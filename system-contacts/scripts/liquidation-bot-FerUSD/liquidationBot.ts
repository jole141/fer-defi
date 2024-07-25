import { ethers } from "hardhat";
import "dotenv/config";

const DEFI_PARAMETERS_CONTRACT_ADDRESS =
  process.env.DEFI_PARAMETERS_CONTRACT_ADDRESS_FERUSD || "";
const USER_ADDRESS = "0x52196310E1acaA3eFC58e20FE52a09404Fc9E7B6";

const main = async () => {
  console.log("🚀 Starting liquidation bot 🚀");
  const defiParameters = await ethers.getContractAt(
    "DefiParameters",
    DEFI_PARAMETERS_CONTRACT_ADDRESS,
  );
  console.log("DefiParameters contract loaded!");
  const borrowingContractAddress =
    await defiParameters.addressParameters("FerUSD_borrowing");
  const oracleAddress = await defiParameters.addressParameters(
    "FerBTC_FerUSD_oracle",
  );
  console.log("Oracle address updated to: ", oracleAddress);
  console.log("Borrowing contract address: ", borrowingContractAddress);
  const borrowingContract = await ethers.getContractAt(
    "BorrowingContract",
    borrowingContractAddress,
  );
  const oracle = await ethers.getContractAt("IPriceFeed", oracleAddress);
  const price = await oracle.getLatestPrice();
  console.log("Borrowing contract loaded!");
  const liquidationRatio = await defiParameters.getUintParameter(
    "FerBTC_FerUSD_liquidationRatio",
  );
  const userVaultsCount = Number(
    await borrowingContract.userVaultsCount(USER_ADDRESS),
  );
  if (userVaultsCount === 0) {
    console.log("❌ User has no vaults ❌");
    return;
  }
  console.log(`\nProcessing ${USER_ADDRESS} vaults...`);
  for (let i = 0; i < userVaultsCount; i++) {
    const userData = await borrowingContract.userVaults(USER_ADDRESS, i);
    const vaultDebt = await borrowingContract.getFullDebt(USER_ADDRESS, i);
    const liquidationPrice =
      (BigInt(vaultDebt) * BigInt(liquidationRatio)) /
      BigInt(1e27) /
      BigInt(1e18);
    console.log(`------------🔐 Vault ${i} ------------`);
    console.log(` Vault ${i} debt: $${vaultDebt.toString()}`);
    console.log(
      ` Vault ${i} liquidation price: $${liquidationPrice.toString()}`,
    );
    console.log(` Collateral price: $${price.toString()}`);
    // check if it's already liquidated
    if (userData[5]) {
      console.log("🟢 Vault already liquidated 🟢");
      console.log(`----------------------------------------\n`);
      continue;
    }
    if (price < liquidationPrice) {
      console.log("🚨 Liquidation is possible 🚨");
    } else {
      console.log("🟢 Liquidation is not possible 🟢");
    }
    console.log(`----------------------------------------\n`);
  }
};

main();
