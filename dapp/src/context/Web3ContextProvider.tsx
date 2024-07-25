import { createContext, FC, ReactElement, useCallback, useContext, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import useLocalStorage from '../hooks/useLocalStorage.ts';
import { ChainId, injected, NETWORK_CHAIN_ID, networks } from '../constants/network.config.ts';

export interface IWeb3Data {
  connect: () => Promise<void>;
  disconnect: () => void;
  account: string | null | undefined;
  chainId: number | null | undefined;
}

export const Web3Context = createContext({} as IWeb3Data);

export const useWeb3Data = (): IWeb3Data => useContext(Web3Context);

const Web3ContextProvider: FC<{ children: ReactElement }> = ({ children }) => {
  const { account, activate, deactivate, chainId } = useWeb3React();
  const [isWalletConnected, setIsWalletConnected] = useLocalStorage('isWalletConnected', false);

  const switchNetwork = async (chainId: ChainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            ...networks[chainId],
          },
        ],
      });
    } catch (error) {
      console.log(error);
    }
  };

  const isNetworkValid = useCallback(async () => {
    const currentChainId = (await injected.getChainId()) as string;
    if (NETWORK_CHAIN_ID !== parseInt(currentChainId, 16)) return undefined;
    return NETWORK_CHAIN_ID;
  }, []);

  const networkValidationSwitch = useCallback(async () => {
    if (!(await isNetworkValid())) {
      await switchNetwork(NETWORK_CHAIN_ID);
    }
  }, [isNetworkValid]);

  const connect = useCallback(async () => {
    try {
      await activate(injected);
      await networkValidationSwitch();
      setIsWalletConnected(true);
    } catch (ex) {
      console.log(ex);
    }
  }, [activate, setIsWalletConnected]);

  async function disconnect() {
    try {
      deactivate();
      setIsWalletConnected(false);
    } catch (ex) {
      console.log(ex);
    }
  }

  useEffect(() => {
    const connectWalletOnPageLoad = async () => {
      if (isWalletConnected) {
        try {
          await activate(injected);
        } catch (ex) {
          console.log(ex);
        }
      }
    };
    connectWalletOnPageLoad();
  }, [activate, isWalletConnected]);

  return (
    <Web3Context.Provider
      value={{
        connect,
        disconnect,
        account,
        chainId,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export default Web3ContextProvider;
