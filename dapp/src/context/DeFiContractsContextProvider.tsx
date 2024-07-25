import { createContext, FC, ReactElement, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Contract, ethers } from 'ethers';
import DeFiParametersABI from '../abis/DefiParametersABI.json';
import BorrowingABI from '../abis/BorrowingABI.json';
import SavingABI from '../abis/SavingABI.json';
import SystemBalanceABI from '../abis/SystemBalanceABI.json';
import LiquidationAuctionABI from '../abis/LiquidationAuctionABI.json';
import IPriceFeedABI from '../abis/IPriceFeedABI.json';
import ERC20ABI from '../abis/ERC20ABI.json';
import { IBorrowingSTCContracts, IDeFiSTCSetup, ISavingSTCContracts, TxStatus } from '../types/defiContract.types.ts';
import { ContractInterface } from '@ethersproject/contracts/src.ts';
import { IModalRef } from '../components/Modal.tsx';
import { TxModal } from '../components/modals/TxModal.tsx';

export interface IDeFiContractsData {
  defiParametersAddress: string;
  supportedBorrowingPairs: IBorrowingSTCContracts[];
  savingSTCData: ISavingSTCContracts[];
  sendPopulatedTransaction: (contract: Contract, method: string, args: any[]) => Promise<ethers.providers.TransactionReceipt | null>;
  approveERC20: (contract: Contract, spender: string) => Promise<ethers.providers.TransactionReceipt | null>;
}

export const DeFiContractsContext = createContext({} as IDeFiContractsData);

export const useDeFiContracts = (): IDeFiContractsData => useContext(DeFiContractsContext);

const deFiSTCSetup: IDeFiSTCSetup = {
  FerUSD: {
    defiParametersContractAddress: import.meta.env.VITE_FER_USD_DEFI_PARAMS_CONTRACT_ADDRESS || '0x0',
    supportedCollaterals: ['FerBTC'],
  },
};

const DeFiContractsContextProvider: FC<{ children: ReactElement }> = ({ children }) => {
  const defiParametersAddress = import.meta.env.VITE_FER_USD_DEFI_PARAMS_CONTRACT_ADDRESS || '0x0';
  const [supportedBorrowingPairs, setSupportedBorrowingPairs] = useState<IBorrowingSTCContracts[]>([]);
  const [savingSTCData, setSavingSTCData] = useState<ISavingSTCContracts[]>([]);

  // tx modal setup
  const [txModalStatus, setTxModalStatus] = useState<TxStatus>('in-progress');
  const [txHash, setTxHash] = useState<string>();
  const [txMessageResponse, setTxMessageResponse] = useState<string>();
  const txModalRef = useRef<IModalRef>(null);

  const openTxModal = () => {
    if (txModalRef.current) txModalRef.current.open();
  };

  const getProviderWithSigner = useCallback(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return { provider, signer };
  }, []);

  const handleParamsContracts = useCallback(async () => {
    try {
      setSupportedBorrowingPairs([]);
      setSavingSTCData([]);

      for (const key in deFiSTCSetup) {
        const { defiParametersContractAddress, supportedCollaterals } = deFiSTCSetup[key as keyof IDeFiSTCSetup];
        const { provider } = getProviderWithSigner();
        const paramsContract = new ethers.Contract(defiParametersContractAddress, DeFiParametersABI, provider);
        const stcAddress = await paramsContract.getAddress(key);
        const stcContract = new ethers.Contract(stcAddress, ERC20ABI, provider);
        const stabilityFee = await paramsContract.getUintParameter(`${key}_savingRate`);

        // saving setup
        const savingSTC_: ISavingSTCContracts = {
          stcKey: key,
          stcContract,
          defiParameters: paramsContract,
          saving: getContractInstance(await paramsContract.getAddress(`${key}_saving`), SavingABI),
          systemBalance: getContractInstance(await paramsContract.getAddress(`${key}_systemBalance`), SystemBalanceABI),
          stabilityFee,
        };

        setSavingSTCData(prev => {
          if (prev.some(stcData => stcData.stcKey === savingSTC_.stcKey)) return prev;
          return [...prev, savingSTC_];
        });

        for (const supportedCollateral of supportedCollaterals) {
          const colAddress = await paramsContract.getAddress(supportedCollateral);
          const colContract = new ethers.Contract(colAddress, ERC20ABI, provider);

          const borrowingPair: IBorrowingSTCContracts = {
            stcKey: key,
            stcContract: stcContract,
            colKey: supportedCollateral,
            colContract: colContract,
            defiParameters: paramsContract,
            borrowing: getContractInstance(await paramsContract.getAddress(`${key}_borrowing`), BorrowingABI),
            liquidationAuction: getContractInstance(await paramsContract.getAddress(`${key}_liquidationAuction`), LiquidationAuctionABI),
            systemBalance: getContractInstance(await paramsContract.getAddress(`${key}_systemBalance`), SystemBalanceABI),
            interestRate: await paramsContract.getUintParameter(`${supportedCollateral}_${key}_interestRate`),
            priceFeedContract: getContractInstance(await paramsContract.getAddress(`${supportedCollateral}_${key}_oracle`), IPriceFeedABI),
          };

          setSupportedBorrowingPairs(prev => {
            if (prev.some(pair => pair.stcKey === key && pair.colKey === supportedCollateral)) return prev;
            return [...prev, borrowingPair];
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const getContractInstance = useCallback(
    (contractAddress: string, abi: ContractInterface) => {
      const { provider } = getProviderWithSigner();
      return new ethers.Contract(contractAddress, abi, provider);
    },
    [getProviderWithSigner],
  );

  const sendPopulatedTransaction = useCallback(
    async (contract: Contract, method: string, args: any[]): Promise<ethers.providers.TransactionReceipt | null> => {
      try {
        const { signer } = getProviderWithSigner();
        const preparedTx = await contract.populateTransaction[method](...args);
        setTxHash(undefined);
        setTxModalStatus('in-progress');
        openTxModal();
        const txResponse = await signer.sendTransaction(preparedTx);
        setTxHash(txResponse.hash);
        const txReceipt = await txResponse.wait();
        if (txReceipt.status === 1) {
          setTxModalStatus('success');
          setTxMessageResponse('Transaction successful');
          // split camelCase method name to camel Case
          const formattedMethodName = method.replace(/([A-Z])/g, ' $1').trim();
          setTxMessageResponse(`${formattedMethodName}`);
          return txReceipt;
        }
        setTxModalStatus('error');
        return txReceipt;
      } catch (error) {
        console.log(error);
        setTxModalStatus('error');
        setTxMessageResponse('Error occurred');
        return null;
      }
    },
    [],
  );

  const approveERC20 = useCallback(
    async (contract: Contract, spender: string) => {
      return await sendPopulatedTransaction(contract, 'approve', [spender, ethers.constants.MaxUint256]);
    },
    [sendPopulatedTransaction],
  );

  useEffect(() => {
    handleParamsContracts();
  }, [handleParamsContracts]);

  return (
    <DeFiContractsContext.Provider
      value={{
        defiParametersAddress,
        supportedBorrowingPairs,
        savingSTCData,
        sendPopulatedTransaction,
        approveERC20,
      }}
    >
      <TxModal status={txModalStatus} modalRef={txModalRef} txHash={txHash} txMessageResponse={txMessageResponse} />
      {children}
    </DeFiContractsContext.Provider>
  );
};

export default DeFiContractsContextProvider;
