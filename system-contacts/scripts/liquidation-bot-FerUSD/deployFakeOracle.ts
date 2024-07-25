import { ethers } from "hardhat";

const FAKE_ORACLE_PRICE = 50000;

export const deployFakeOracle = async (fakePrice: number) => {
  const fakeUSDBTCOracle = await ethers.deployContract("FakeOracle", [
    fakePrice,
  ]);
  await fakeUSDBTCOracle.waitForDeployment();
  return fakeUSDBTCOracle.target;
};

const main = async () => {
  const fakeOracle = await deployFakeOracle(FAKE_ORACLE_PRICE);
  console.log(`Fake oracle deployed to ${fakeOracle}`);
};

main();
