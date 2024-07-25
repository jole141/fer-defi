import { Contract, ethers } from 'ethers';

export const checkIfApproved = async (ercContract: Contract, spender: string, owner: string) => {
  const allowance = await ercContract.allowance(owner, spender);
  return allowance.gte(ethers.constants.MaxUint256);
};
