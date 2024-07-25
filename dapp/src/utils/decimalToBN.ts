import { BigNumber } from 'ethers';

const FORMAT_DECIMALS = 6;

export const decimalToBN = (value: string | number, decimals: number): BigNumber => {
  const valueString = typeof value === 'string' ? value : value.toString();
  const formattedValue = (parseFloat(valueString) * 10 ** FORMAT_DECIMALS).toFixed(0);
  return BigNumber.from(formattedValue).mul(BigNumber.from(10).pow(decimals - FORMAT_DECIMALS));
};
