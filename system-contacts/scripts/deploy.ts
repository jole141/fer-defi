import { ethers } from "hardhat";
import {Addressable} from "ethers";
import {writeFileSync} from "node:fs";

interface ITokensOracles {
    FerBTC: Addressable | string;
    FerUSD: Addressable | string;
    BTCUSDDataFeed: Addressable | string;
}

interface ILendingAndBorrowing {
    borrowingContract: Addressable | string;
    savingContract: Addressable | string;
    liquidationContract: Addressable | string;
    systemBalanceContract: Addressable | string;
}

const owner = "<OWNER_ADDRESS>";

async function main() {
  try {
    const defiParameters = await deployDeFiParameters();
    const lendingAndBorrowingContracts = await deployLendingAndBorrowing(defiParameters.target);
    const tokensAndOracles = await deployTokensAndOracles(defiParameters.target.toString(), lendingAndBorrowingContracts.borrowingContract.toString(), lendingAndBorrowingContracts.savingContract.toString());
    await addDeFiParameters(defiParameters.target, tokensAndOracles, lendingAndBorrowingContracts);
    await updateCompoundRates(lendingAndBorrowingContracts.savingContract, lendingAndBorrowingContracts.borrowingContract);
    writeFileSync("./contract_addresses.json", JSON.stringify({
        defiParameters: defiParameters.target,
        tokensAndOracles,
        lendingAndBorrowingContracts,
    }), 'utf-8');
  } catch (e) {
    console.log(e);
  }
}

async function deployTokensAndOracles(defiParametersAddress: Addressable | string, borrowingAddress: Addressable | string, savingAddress: Addressable | string) : Promise<ITokensOracles> {
  console.log("Deploying tokens and oracles");
  const FerBTC = await ethers.deployContract("FerBTC", [owner]);
  const FerUSD = await ethers.deployContract("StableCoin", ["Fer stablecoin USD", "FerUSD", defiParametersAddress, ["FerUSD_minter1", "FerUSD_minter2", "FerUSD_minter3"]]);
  const BTCUSDDataFeed = await ethers.deployContract("BTCUSDDataFeed", []);

  await FerBTC.waitForDeployment();
  console.log(`FerBTC deployed to ${FerBTC.target}`);
  await FerUSD.waitForDeployment();
  console.log(`FerUSD deployed to ${FerUSD.target}`);
  await BTCUSDDataFeed.waitForDeployment();
  console.log(`BTCUSDDataFeed deployed to ${BTCUSDDataFeed.target}`);
  await FerBTC.approve(borrowingAddress, ethers.MaxUint256);

  return {
      FerBTC: FerBTC.target,
      FerUSD: FerUSD.target,
      BTCUSDDataFeed: BTCUSDDataFeed.target,
  };

}

async function deployDeFiParameters() {
  console.log("Deploying DeFi parameters");
  const DeFiParametersFactory = await ethers.getContractFactory("DefiParameters");
  const defiParameters = await DeFiParametersFactory.deploy(
      owner
  );
  await defiParameters.waitForDeployment();

  await defiParameters.setUintParameter("FerBTC_FerUSD_interestRate", BigInt("3022260000000000000"));
  await defiParameters.setUintParameter("FerBTC_FerUSD_stcCeiling", BigInt("1000000000000000000000000"));
  await defiParameters.setUintParameter("FerBTC_FerUSD_collateralizationRatio", BigInt("1500000000000000000000000000"));
  await defiParameters.setUintParameter("FerBTC_FerUSD_stcAcceptableMinimum", BigInt("10000000000000000000"));
  await defiParameters.setUintParameter("FerBTC_FerUSD_liquidationRatio", BigInt("1300000000000000000000000000"));
  await defiParameters.setUintParameter("FerBTC_FerUSD_liquidationFee", BigInt("50000000000000000000000000"));
  await defiParameters.setUintParameter("FerUSD_debtThreshold", BigInt("10000000000000000000000"));
  await defiParameters.setUintParameter("FerUSD_surplusThreshold", BigInt("10000000000000000000000"));
  await defiParameters.setUintParameter("FerUSD_surplusLot", BigInt("10000000000000000000000"));
  await defiParameters.setUintParameter("FerUSD_savingRate", BigInt("1547126000000000000"));
  await defiParameters.setUintParameter("auctionMinIncrement", BigInt("200000000000000000000000000"));
  await defiParameters.setUintParameter("liquidationAuctionPeriod", BigInt("1800"));

  console.log(`DeFi parameters deployed to ${defiParameters.target}`)
  return defiParameters;
}

async function addDeFiParameters(defiParameters: Addressable | string, tokensAndOracles: ITokensOracles, lendingAndBorrowingContracts: ILendingAndBorrowing) {
  console.log("Adding DeFi parameters...")
  const contract = await ethers.getContractAt("DefiParameters", defiParameters);
  await contract.setAddress("FerBTC", tokensAndOracles.FerBTC.toString());
  await contract.setAddress("FerUSD", tokensAndOracles.FerUSD.toString());
  await contract.setAddress("FerBTC_FerUSD_oracle", tokensAndOracles.BTCUSDDataFeed.toString());
  await contract.setAddress("FerUSD_borrowing", lendingAndBorrowingContracts.borrowingContract.toString());
  await contract.setAddress("FerUSD_saving", lendingAndBorrowingContracts.savingContract.toString());
  await contract.setAddress("FerUSD_liquidationAuction", lendingAndBorrowingContracts.liquidationContract.toString());
  await contract.setAddress("FerUSD_systemBalance", lendingAndBorrowingContracts.systemBalanceContract.toString());
  await contract.setAddress("FerUSD_minter1", owner);
  await contract.setAddress("FerUSD_minter2", lendingAndBorrowingContracts.borrowingContract.toString());
  await contract.setAddress("FerUSD_minter3", lendingAndBorrowingContracts.savingContract.toString());
  console.log("DeFi parameters added!");
}

async function deployLendingAndBorrowing(parametersAddress: Addressable | string) : Promise<ILendingAndBorrowing> {
  console.log("Deploying Lending and Borrowing...");
  const BorrowingContractFactory = await ethers.getContractFactory("BorrowingContract");
  const borrowingContract = await BorrowingContractFactory.deploy(
      parametersAddress, "FerUSD"
  );
  await borrowingContract.waitForDeployment();
  console.log(`Borrowing contract deployed to ${borrowingContract.target}`);
  const SavingContractFactory = await ethers.getContractFactory("Saving");
  const savingContract = await SavingContractFactory.deploy(
      parametersAddress, "FerUSD"
  );
  await savingContract.waitForDeployment();
  console.log(`Saving contract deployed to ${savingContract.target}`);
  const LiquidationContractFactory = await ethers.getContractFactory("LiquidationAuction");
  const liquidationContract = await LiquidationContractFactory.deploy(
      parametersAddress, "FerUSD"
  );
  await liquidationContract.waitForDeployment();
  console.log(`Liquidation contract deployed to ${liquidationContract.target}`);
  const SystemBalanceContractFactory = await ethers.getContractFactory("SystemBalance");
  const systemBalanceContract = await SystemBalanceContractFactory.deploy(
      parametersAddress, "FerUSD"
  );
  await systemBalanceContract.waitForDeployment();
  console.log(`System balance contract deployed to ${systemBalanceContract.target}`);

  return {
    borrowingContract: borrowingContract.target,
    savingContract: savingContract.target,
    liquidationContract: liquidationContract.target,
    systemBalanceContract: systemBalanceContract.target,
  };
}

async function updateCompoundRates(savingAddress: Addressable | string, borrowingAddress: Addressable | string) {
  console.log("Updating compound rates...")
  const savingContract = await ethers.getContractAt("Saving", savingAddress);
  await savingContract.updateCompoundRate();
  const borrowingContract = await ethers.getContractAt("BorrowingContract", borrowingAddress);
  await borrowingContract.updateCompoundRate("FerBTC");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
