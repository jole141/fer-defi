import { FC, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { useDeFiContracts } from '../context/DeFiContractsContextProvider.tsx';
import { formatNumber } from '../utils/formatNumber.ts';
import { calculateInterestRate } from '../utils/calculateInterestRate.ts';
import { IBorrowingPairUserDetails, IBorrowingSTCContracts, IVault, IVaultDetails } from '../types/defiContract.types.ts';
import { useWeb3Data } from '../context/Web3ContextProvider.tsx';
import { formatTokenBalance, formatUserTokenBalance } from '../utils/formatBalance.ts';
import { BigNumber } from 'ethers';
import PlusIcon from '../assets/plus.svg';
import ReloadIcon from '../assets/reload.svg';
import ManageIcon from '../assets/manage.svg';
import Button from '../components/Button.tsx';
import { PageContainer, PageHeader, PageTitle } from './Borrowing.tsx';
import BlockContainer from '../components/layout/BlockContainer.tsx';
import { theme } from '../constants/theme.config.ts';
import { AnimatedNumber } from '../components/AnimatedNumber.tsx';
import { IModalRef } from '../components/Modal.tsx';
import { ManageVaultModal } from '../components/modals/ManageVaultModal.tsx';
import { checkIfApproved } from '../utils/checkIfApproved.ts';
import { DECIMALS } from '../constants/constants.ts';
import { roundNumber } from '../utils/roundNumber.ts';
import { PairIcons } from '../components/PairIcons.tsx';
import BlockContainerSkeleton from '../components/layout/BlockContainerSkeleton.tsx';
import { NoData } from '../components/NoData.tsx';
import moment from 'moment';
import CopyIcon from '../assets/copy.svg';
import SuccessIcon from '../assets/double-check-white.svg';
import { trimString } from '../utils/trimString.ts';

interface IBorrowingPairProps {}

const Subtitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 1.5rem 0;
`;

export const PairDataContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
`;

const VaultsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

export const PairDataBlock = styled(BlockContainer)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  position: relative;
`;

export const PairDataInfoLabel = styled.p`
  color: ${theme.palette.textSecondary};
  font-size: 0.95rem;
`;

export const ContractAddressContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  cursor: pointer;

  & > img {
    width: 0.85rem;
    height: 1rem;
  }
`;

export const ContractAddress = styled.p`
  color: ${theme.palette.textSecondary};
  font-size: 0.8rem;
`;

export const PairDataInfoValue = styled.div`
  font-size: 1rem;
  font-weight: 600;
`;

const CustomCardButton = styled(Button)`
  position: absolute;
  right: 0.5rem;
`;

const VaultDetails = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
`;

const VaultBlockContainer = styled(BlockContainer)`
  position: relative;
`;

const VaultNumber = styled.h2`
  font-size: 1.4rem;
  font-weight: 600;
`;

const CustomVaultButton = styled(Button)`
  position: absolute;
  top: 0.5rem;
  right: 1.4rem;
`;

const PageTitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CompoundRateUpdateDate = styled.p`
  color: ${theme.palette.textSecondary};
  font-size: 0.75rem;
  position: absolute;
  bottom: 0.5rem;
  right: 1rem;
`;

const LiquidatedWatermark = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 0.5rem;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  background-color: ${theme.palette.danger}0a;
  color: ${theme.palette.danger}30;
  font-size: 1.5rem;
  font-weight: 600;
`;

const BorrowingPair: FC<IBorrowingPairProps> = () => {
  const { pair } = useParams();
  const { supportedBorrowingPairs, sendPopulatedTransaction, approveERC20 } = useDeFiContracts();
  const { account } = useWeb3Data();

  const manageVaultModalRef = useRef<IModalRef>(null);
  const [selectedVaultId, setSelectedVaultId] = useState<number | undefined>(0);

  const [borrowingPairContractsData, setBorrowingPairContractsData] = useState<IBorrowingSTCContracts>();
  const [borrowingPairDetails, setBorrowingPairDetails] = useState<IBorrowingPairUserDetails>();
  const [userVaults, setUserVaults] = useState<IVaultDetails[]>();

  const [copyReference, setCopyReference] = useState<string>('');

  const copyToClipboard = async (text: string, copyRef: string) => {
    await navigator.clipboard.writeText(text);
    setCopyReference(`${copyRef}-${text}`);
    setTimeout(() => {
      setCopyReference('');
    }, 2500);
  };

  const getBorrowingPairData = useCallback(
    (stcKey: string, colKey: string): IBorrowingSTCContracts | undefined => {
      return supportedBorrowingPairs.find(pair => pair.stcKey === stcKey && pair.colKey === colKey);
    },
    [supportedBorrowingPairs],
  );

  const getUserVaults = useCallback(
    async (borrowingData_: IBorrowingSTCContracts) => {
      if (!account) return;
      const numOfVaults = await borrowingData_.borrowing.userVaultsCount(account);
      let outstandingDebt: BigNumber = BigNumber.from(0);
      const userVaultDetails_: IVaultDetails[] = [];
      const interestRate = formatNumber(calculateInterestRate(borrowingPairContractsData?.interestRate.toString()), 4);
      const liquidationRatio = await borrowingData_.defiParameters.getUintParameter(
        `${borrowingData_.colKey}_${borrowingData_.stcKey}_liquidationRatio`,
      );
      const collateralizationRatio = await borrowingData_.defiParameters.getUintParameter(
        `${borrowingData_.colKey}_${borrowingData_.stcKey}_collateralizationRatio`,
      );
      const stcDecimals = await borrowingData_.stcContract.decimals();
      const colDecimals = await borrowingData_.colContract.decimals();
      const stcSymbol = await borrowingData_.stcContract.symbol();
      const colSymbol = await borrowingData_.colContract.symbol();
      const stcBalance = await formatUserTokenBalance(borrowingData_.stcContract, account);
      const colBalance = await formatUserTokenBalance(borrowingData_.colContract, account);
      // check if stc and col are approved for the borrowing contract
      const stcApproved = await checkIfApproved(borrowingData_.stcContract, borrowingData_.borrowing.address, account);
      const colApproved = await checkIfApproved(borrowingData_.colContract, borrowingData_.borrowing.address, account);
      const compoundRateLastUpdate = await borrowingData_.borrowing.getCompoundRateUpdateTimestamp(borrowingData_.colKey);

      for (let i = 0; i < numOfVaults; i++) {
        const vault: IVault = await borrowingData_.borrowing.userVaults(account, i);
        const vaultDebt = await borrowingData_.borrowing.getFullDebt(account, i);
        const priceFeedValue = await borrowingData_.priceFeedContract.getLatestPrice();
        const liquidationPrice = formatTokenBalance(
          BigNumber.from(vaultDebt).mul(liquidationRatio).div(BigNumber.from(10).pow(DECIMALS)),
          stcDecimals,
        );
        const colAssetInSTC = BigNumber.from(vault.colAsset).mul(priceFeedValue);
        const maxBorrowAmount = formatTokenBalance(
          colAssetInSTC
            .mul(BigNumber.from(10).pow(DECIMALS))
            .div(collateralizationRatio)
            .sub(vaultDebt.div(10 ** (stcDecimals - colDecimals))),
          colDecimals,
        );
        const withdrawableAmount = formatTokenBalance(
          vault.colAsset
            .mul(BigNumber.from(10).pow(stcDecimals - colDecimals))
            .sub(vaultDebt.div(priceFeedValue).mul(collateralizationRatio).div(BigNumber.from(10).pow(DECIMALS))),
          stcDecimals,
        );

        outstandingDebt = outstandingDebt.add(vaultDebt);
        userVaultDetails_.push({
          id: i,
          colAsset: formatTokenBalance(vault.colAsset, colDecimals),
          colAssetInSTC: formatTokenBalance(colAssetInSTC, colDecimals),
          debt: formatTokenBalance(vaultDebt, stcDecimals),
          priceFeedValue: formatNumber(priceFeedValue),
          withdrawableAmount,
          stcSymbol,
          colSymbol,
          isLiquidated: vault.isLiquidated,
          stcBalance,
          colBalance,
          interestRate,
          liquidationPrice,
          colDecimals,
          stcDecimals,
          stcApproved,
          colApproved,
          maxBorrowAmount: Math.max(0, Number(maxBorrowAmount)).toString(),
        });
      }
      setUserVaults([...userVaultDetails_]);
      setBorrowingPairDetails({
        interestRate,
        stcBalance,
        colBalance,
        outstandingDebt: formatTokenBalance(outstandingDebt, stcDecimals),
        stcSymbol,
        colSymbol,
        compoundRateLastUpdate: compoundRateLastUpdate.toNumber() * 1000,
      });
    },
    [account, borrowingPairContractsData],
  );

  const fetchBorrowingPairData = useCallback(async () => {
    if (pair && account) {
      const [colKey, stcKey] = pair.split('_');
      const data = getBorrowingPairData(stcKey, colKey);
      if (!data || !account) return;
      await getUserVaults(data);
      setBorrowingPairContractsData(data);
    }
  }, [pair, account, getBorrowingPairData, getUserVaults]);

  useEffect(() => {
    fetchBorrowingPairData();
  }, [fetchBorrowingPairData]);

  const getPairArray = (pair: string) => {
    return pair.split('_');
  };

  const formatPair = (pair: string) => {
    const [colKey, stcKey] = getPairArray(pair);
    return `${colKey} → ${stcKey}`;
  };

  const getColKey = (pair: string) => {
    return pair.split('_')[0];
  };

  const updateBorrowingCompoundRate = async () => {
    if (!borrowingPairContractsData || !pair) return;
    const txReceipt = await sendPopulatedTransaction(borrowingPairContractsData?.borrowing, 'updateCompoundRate', [getColKey(pair)]);
    // update state if tx is successful
    if (txReceipt?.status === 1) fetchBorrowingPairData();
  };

  const createNewVault = async () => {
    if (!borrowingPairContractsData || !pair) return;
    const txReceipt = await sendPopulatedTransaction(borrowingPairContractsData?.borrowing, 'createVault', [getColKey(pair)]);
    // update state if tx is successful
    if (txReceipt?.status === 1) fetchBorrowingPairData();
  };

  const manageVaultTx = async (vaultId: number, amount: BigNumber, method: string) => {
    if (!borrowingPairContractsData || !pair) return;
    const txReceipt = await sendPopulatedTransaction(borrowingPairContractsData?.borrowing, method, [vaultId, amount]);
    // update state if tx is successful
    if (txReceipt?.status === 1) fetchBorrowingPairData();
  };

  const approveStc = async () => {
    if (!borrowingPairContractsData) return;
    const txReceipt = await approveERC20(borrowingPairContractsData.stcContract, borrowingPairContractsData.borrowing.address);
    // update state if tx is successful
    if (txReceipt?.status === 1) fetchBorrowingPairData();
  };

  const approveCol = async () => {
    if (!borrowingPairContractsData) return;
    const txReceipt = await approveERC20(borrowingPairContractsData.colContract, borrowingPairContractsData.borrowing.address);
    // update state if tx is successful
    if (txReceipt?.status === 1) fetchBorrowingPairData();
  };

  const handleOpenManageModal = (id: number) => {
    manageVaultModalRef.current?.open();
    setSelectedVaultId(id);
  };

  return (
    <PageContainer>
      <PageHeader>
        {pair && (
          <PageTitleContainer>
            <PairIcons symbol1={getPairArray(pair)[0]} symbol2={getPairArray(pair)[1]} size={45} />
            <PageTitle>{formatPair(pair)}</PageTitle>
          </PageTitleContainer>
        )}
        <Button label="New vault" color="primary" onClick={createNewVault} icon={<img src={PlusIcon} alt="plus" />} />
      </PageHeader>
      {borrowingPairDetails ? (
        <PairDataContainer>
          <PairDataBlock>
            <PairDataInfoLabel>Borrowing Fee (p.a.)</PairDataInfoLabel>
            <PairDataInfoValue>
              <AnimatedNumber value={roundNumber(borrowingPairDetails.interestRate)} unit="%" />
            </PairDataInfoValue>
          </PairDataBlock>
          <PairDataBlock>
            <PairDataInfoLabel>STC balance</PairDataInfoLabel>
            <PairDataInfoValue>
              <AnimatedNumber value={roundNumber(borrowingPairDetails.stcBalance)} unit={borrowingPairDetails.stcSymbol} />
            </PairDataInfoValue>
            <ContractAddressContainer onClick={() => copyToClipboard(borrowingPairContractsData!.stcContract.address!, 'stc')}>
              <ContractAddress>{trimString(borrowingPairContractsData!.stcContract.address!)}</ContractAddress>
              <img src={copyReference === `stc-${borrowingPairContractsData!.stcContract.address!}` ? SuccessIcon : CopyIcon} alt="copy" />
            </ContractAddressContainer>
          </PairDataBlock>
          <PairDataBlock>
            <PairDataInfoLabel>Collateral balance</PairDataInfoLabel>
            <PairDataInfoValue>
              <AnimatedNumber value={roundNumber(borrowingPairDetails.colBalance)} unit={borrowingPairDetails.colSymbol} />
            </PairDataInfoValue>
            <ContractAddressContainer onClick={() => copyToClipboard(borrowingPairContractsData!.colContract.address!, 'col')}>
              <ContractAddress>{trimString(borrowingPairContractsData!.colContract.address!)}</ContractAddress>
              <img src={copyReference === `col-${borrowingPairContractsData!.colContract.address!}` ? SuccessIcon : CopyIcon} alt="copy" />
            </ContractAddressContainer>
          </PairDataBlock>
          <PairDataBlock>
            <PairDataInfoLabel>Outstanding debt</PairDataInfoLabel>
            <PairDataInfoValue>
              <AnimatedNumber value={roundNumber(borrowingPairDetails.outstandingDebt)} unit={borrowingPairDetails.stcSymbol} />
            </PairDataInfoValue>
            <CompoundRateUpdateDate>Updated {moment(borrowingPairDetails.compoundRateLastUpdate).fromNow()}</CompoundRateUpdateDate>
            <CustomCardButton color="secondary" onClick={updateBorrowingCompoundRate} icon={<img src={ReloadIcon} alt="reload" />} />
          </PairDataBlock>
        </PairDataContainer>
      ) : (
        <PairDataContainer>
          <BlockContainerSkeleton height="2.5rem" />
          <BlockContainerSkeleton height="2.5rem" />
          <BlockContainerSkeleton height="2.5rem" />
          <BlockContainerSkeleton height="2.5rem" />
        </PairDataContainer>
      )}
      <Subtitle>Your vaults</Subtitle>
      <VaultsContainer>
        {userVaults ? (
          userVaults.map((vault, index) => (
            <VaultBlockContainer key={index}>
              <VaultNumber>Vault #{vault.id}</VaultNumber>
              {vault.isLiquidated && <LiquidatedWatermark>Liquidated</LiquidatedWatermark>}
              <VaultDetails>
                <div>
                  <PairDataInfoLabel>Collateral</PairDataInfoLabel>
                  <PairDataInfoValue>
                    <AnimatedNumber value={roundNumber(vault.colAsset)} unit={vault.colSymbol} />
                  </PairDataInfoValue>
                </div>
                <div>
                  <PairDataInfoLabel>Debt</PairDataInfoLabel>
                  <PairDataInfoValue>
                    <AnimatedNumber value={roundNumber(vault.debt)} unit={vault.stcSymbol} />
                  </PairDataInfoValue>
                </div>
                <div>
                  <PairDataInfoLabel>Current COL value:</PairDataInfoLabel>
                  <PairDataInfoValue>
                    1 {vault.colSymbol} ≈ {vault.priceFeedValue} {vault.stcSymbol}
                  </PairDataInfoValue>
                </div>
              </VaultDetails>
              <CustomVaultButton
                label="Manage"
                color="secondary"
                onClick={() => handleOpenManageModal(vault.id)}
                icon={<img src={ManageIcon} alt="manage" />}
                disabled={vault.isLiquidated}
              />
            </VaultBlockContainer>
          ))
        ) : (
          <>
            <BlockContainerSkeleton height="5rem" />
            <BlockContainerSkeleton height="5rem" />
            <BlockContainerSkeleton height="5rem" />
            <BlockContainerSkeleton height="5rem" />
          </>
        )}
      </VaultsContainer>
      {userVaults && userVaults.length === 0 && <NoData message="You don't have any vaults yet." />}
      {userVaults && userVaults.length > 0 && selectedVaultId !== undefined && (
        <ManageVaultModal
          modalRef={manageVaultModalRef}
          vaultDetails={userVaults[selectedVaultId]}
          manageVaultTx={manageVaultTx}
          approveStc={approveStc}
          approveCol={approveCol}
        />
      )}
    </PageContainer>
  );
};

export default BorrowingPair;
