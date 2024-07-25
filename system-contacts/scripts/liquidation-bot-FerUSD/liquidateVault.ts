import { ethers } from "hardhat";

const DEFI_PARAMETERS_CONTRACT_ADDRESS =
  process.env.DEFI_PARAMETERS_CONTRACT_ADDRESS_FERUSD || "";

const liquidateVault = async (address: string, vault: string) => {
  const defiParameters = await ethers.getContractAt(
    "DefiParameters",
    DEFI_PARAMETERS_CONTRACT_ADDRESS,
  );
  console.log("DefiParameters contract loaded!");
  const borrowingContractAddress =
    await defiParameters.addressParameters("FerUSD_borrowing");
  const borrowingContract = await ethers.getContractAt(
    "BorrowingContract",
    borrowingContractAddress,
  );
  console.log(`Liquidating vault ${vault} from ${address}`);
  const data = await borrowingContract.getCurrentColRatio(address, vault);
  const liquidationRatio = await defiParameters.getUintParameter(
    "FerBTC_FerUSD_liquidationRatio",
  );
  console.log(data.toString());
  console.log(liquidationRatio.toString());
  await (await borrowingContract.liquidate(address, vault)).wait();
  console.log(`Vault ${vault} from ${address} liquidated`);
};

liquidateVault("<user_address>", "3");
