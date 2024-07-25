import { InjectedConnector } from '@web3-react/injected-connector';

export const NETWORK_CHAIN_ID = 11155111;

const SEPOLIA_CHAIN_ID = 11155111;

export type ChainId = 11155111;

export interface INetworkConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export const injected = new InjectedConnector({
  supportedChainIds: [SEPOLIA_CHAIN_ID], // Sepolia
});

export const networks: Record<ChainId, INetworkConfig> = {
  11155111: {
    chainId: `0x${Number(SEPOLIA_CHAIN_ID).toString(16)}`,
    chainName: 'Sepolia',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://rpc.sepolia.org',
      'https://rpc2.sepolia.org',
      'https://rpc-sepolia.rockx.com',
      'https://rpc.sepolia.ethpandaops.io',
      'https://sepolia.gateway.tenderly.co',
    ],
    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
  },
};

export const explorerURL = networks[NETWORK_CHAIN_ID].blockExplorerUrls[0];
