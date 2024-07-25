import AppRoutes from './routes.tsx';
import { Web3ReactProvider } from '@web3-react/core';
import Web3ContextProvider from './context/Web3ContextProvider.tsx';
import { ethers } from 'ethers';
import DeFiContractsContextProvider from './context/DeFiContractsContextProvider.tsx';

export function getLibrary(provider: string) {
  return new ethers.providers.JsonRpcProvider(provider);
}

function App() {
  return (
    <>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Web3ContextProvider>
          <DeFiContractsContextProvider>
            <AppRoutes />
          </DeFiContractsContextProvider>
        </Web3ContextProvider>
      </Web3ReactProvider>
    </>
  );
}

export default App;
