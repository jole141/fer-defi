export const calculateInterestRate = (value: number | string | undefined) => {
  if (value === undefined) return 0;
  value = typeof value === 'string' ? parseFloat(value) : value;
  if (value <= 0 || isNaN(value)) return 0;
  const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
  const MAX_INTEREST = 10 ** 27;
  const ratePerSecond = value >= MAX_INTEREST ? 100 : Math.max(value / MAX_INTEREST, 0);
  return ((1 + ratePerSecond) ** SECONDS_IN_YEAR - 1) * 100;
};
