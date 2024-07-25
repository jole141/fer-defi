import { BigNumber } from 'ethers';

export const formatNumber = (value: number | string | BigNumber, precision = 3): string => {
  if (typeof value === 'string') {
    value = parseFloat(value);
  } else if (BigNumber.isBigNumber(value)) {
    value = parseFloat(value.toString());
  }

  const precisionValue = Math.pow(10, precision);

  return (Math.floor(value * precisionValue) / precisionValue).toString();
};
