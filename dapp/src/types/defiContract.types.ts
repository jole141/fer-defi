import { BigNumber, Contract } from 'ethers';

export type SupportedSTC = 'FerUSD';

export type IDeFiSTCSetup = Record<SupportedSTC, IDeFiSTC>;

interface IDeFiSTC {
  defiParametersContractAddress: string;
  supportedCollaterals: string[];
}

export interface IBorrowingSTCContracts {
  stcKey: string;
  colKey: string;
  defiParameters: Contract;
  borrowing: Contract;
  systemBalance: Contract;
  liquidationAuction: Contract;
  interestRate: BigNumber;
  stcContract: Contract;
  colContract: Contract;
  priceFeedContract: Contract;
}

export interface ISavingSTCContracts {
  stcKey: string;
  stcContract: Contract;
  defiParameters: Contract;
  saving: Contract;
  systemBalance: Contract;
  stabilityFee: BigNumber;
}

export interface ISavingStats {
  stcSymbol: string;
  stcBalance: string;
  stcDecimals: number;
  systemBalance: string;
  stcAddress: string;
  systemBalanceAddress: string;
}

export interface ISavingDetails {
  stcSymbol: string;
  stcBalance: string;
  stcDecimals: number;
  stcApproved: boolean;
  withdrawableAmount: string;
  systemBalance: string;
  compoundRateUpdate: number;
  stabilityFee: string;
  expectedEarningsPA: number;
}

export interface ISavingBalanceDetails {
  currentBalance: BigNumber;
  normalizedBalance: BigNumber;
  compoundRate: BigNumber;
  lastUpdateOfCompoundRate: number;
  interestRate: BigNumber;
}

export interface IVault {
  colKey: string;
  colAsset: BigNumber;
  normalizedDebt: BigNumber;
  mintedAmount: BigNumber;
  isLiquidated: boolean;
  liquidationFullDebt: BigNumber;
}

interface IBorrowingTokenSymbols {
  stcSymbol: string;
  colSymbol: string;
}

export interface IBorrowingPairUserDetails extends IBorrowingTokenSymbols {
  interestRate: string;
  colBalance: string;
  stcBalance: string;
  outstandingDebt: string;
  compoundRateLastUpdate: number;
}

export interface IVaultDetails extends IBorrowingTokenSymbols {
  id: number;
  colAsset: string;
  colAssetInSTC: string;
  debt: string;
  priceFeedValue: string;
  isLiquidated: boolean;
  stcBalance: string;
  colBalance: string;
  interestRate: string;
  liquidationPrice: string;
  maxBorrowAmount: string;
  withdrawableAmount: string;
  colDecimals: number;
  stcDecimals: number;
  stcApproved: boolean;
  colApproved: boolean;
}

export interface IParameters {
  key: string;
  value: string;
}

export type TxStatus = 'in-progress' | 'success' | 'error';
