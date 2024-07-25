import { BigNumber, Contract } from 'ethers';
import { formatNumber } from './formatNumber.ts';
import { DECIMALS } from '../constants/constants.ts';

export const formatTokenBalance = (amount: BigNumber, decimals: number): string => {
  const divisor = BigNumber.from(10).pow(decimals);
  const balance = amount.div(divisor);
  const formattedBalance = balance.toString() + '.' + amount.mod(divisor).toString().padStart(decimals, '0');
  return formatNumber(formattedBalance, DECIMALS);
};

export const formatUserTokenBalance = async (tokenContract: Contract, address: string): Promise<string> => {
  const balanceWei = await tokenContract.balanceOf(address);
  const decimals = await tokenContract.decimals();
  return formatTokenBalance(balanceWei, decimals);
};
