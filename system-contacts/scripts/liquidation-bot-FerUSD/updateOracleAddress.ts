import { ethers } from "hardhat";

const DEFI_PARAMETERS_CONTRACT_ADDRESS =
  process.env.DEFI_PARAMETERS_CONTRACT_ADDRESS_FERUSD || "";
const VALID_ORACLE_ADDRESS = "0x9760a7Bf7743720Cfd2DFcaEe6B1e58bb5f38A95";
const FAKE_ORACLE_ADDRESS = "0x287D4c2aF6Ec2f943ABa9F5C42e9098D62a02c60";

const updateOracleAddress = async (address: string) => {
  const defiParameters = await ethers.getContractAt(
    "DefiParameters",
    DEFI_PARAMETERS_CONTRACT_ADDRESS,
  );
  await (
    await defiParameters.setAddress("FerBTC_FerUSD_oracle", address)
  ).wait();
  console.log("Oracle address updated to: ", address);
};

const main = async (deployFake: boolean) => {
  if (deployFake) {
    await updateOracleAddress(FAKE_ORACLE_ADDRESS);
  } else {
    await updateOracleAddress(VALID_ORACLE_ADDRESS);
  }
};

main(true);
