export const roundNumber = (num: number | string, decimalPlaces?: number): number => {
  decimalPlaces = decimalPlaces || 4;
  return Math.round(Number(num) * 10 ** decimalPlaces) / 10 ** decimalPlaces;
};
