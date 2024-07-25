import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useDeFiContracts } from '../context/DeFiContractsContextProvider.tsx';
import { theme } from '../constants/theme.config.ts';
import Button from '../components/Button.tsx';
import { PageContainer, PageHeader, PageTitle } from './Borrowing.tsx';
import { TokenIcon } from '../components/TokenIcon.tsx';
import styled from 'styled-components';
import BlockContainer from '../components/layout/BlockContainer.tsx';
import ManageIcon from '../assets/manage.svg';
import { formatTokenBalance, formatUserTokenBalance } from '../utils/formatBalance.ts';
import { useWeb3Data } from '../context/Web3ContextProvider.tsx';
import { ISavingBalanceDetails, ISavingDetails, ISavingStats } from '../types/defiContract.types.ts';
import { checkIfApproved } from '../utils/checkIfApproved.ts';
import { ManageSavingModal } from '../components/modals/ManageSavingModal.tsx';
import { IModalRef } from '../components/Modal.tsx';
import { BigNumber } from 'ethers';
import { AnimatedNumber } from '../components/AnimatedNumber.tsx';
import ReloadIcon from '../assets/reload.svg';
import BlockContainerSkeleton from '../components/layout/BlockContainerSkeleton.tsx';
import {
  ContractAddress,
  ContractAddressContainer,
  PairDataBlock,
  PairDataContainer,
  PairDataInfoLabel,
  PairDataInfoValue,
} from './BorrowingPair.tsx';
import { formatNumber } from '../utils/formatNumber.ts';
import { calculateInterestRate } from '../utils/calculateInterestRate.ts';
import moment from 'moment';
import { roundNumber } from '../utils/roundNumber.ts';
import { DECIMALS } from '../constants/constants.ts';
import { trimString } from '../utils/trimString.ts';
import SuccessIcon from '../assets/double-check-white.svg';
import CopyIcon from '../assets/copy.svg';

const SavingData = styled(BlockContainer)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Subtitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 1.5rem 0;
`;

const SavingLabelContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SavingLabel = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
`;

const StabilityFeeInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
`;

const StabilityFeeLabel = styled.p`
  color: ${theme.palette.textSecondary};
  font-size: 0.85rem;
`;

const CompoundRateUpdateDate = styled.p`
  color: ${theme.palette.textPrimary};
  font-size: 1rem;
  align-self: center;
  font-weight: bold;
`;

const StabilityFeeValue = styled.p`
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0.5rem;
`;

export const Lending: FC = () => {
  const { savingSTCData, sendPopulatedTransaction, approveERC20 } = useDeFiContracts();
  const { account } = useWeb3Data();
  const manageSavingModalRef = useRef<IModalRef>(null);

  const [savingAssetsData, setSavingAssetsData] = useState<ISavingDetails[]>([]);
  const [savingDataStats, setSavingDataStats] = useState<ISavingStats[]>([]);
  const [selectedSTCId, setSelectedSTCId] = useState<number | undefined>(0);

  const [copyReference, setCopyReference] = useState<string>('');

  const copyToClipboard = async (text: string, copyRef: string) => {
    await navigator.clipboard.writeText(text);
    setCopyReference(`${copyRef}-${text}`);
    setTimeout(() => {
      setCopyReference('');
    }, 2500);
  };

  const getUserSTCData = useCallback(async () => {
    if (!account) return;
    console.log('Fetching user STC data...');
    setSavingAssetsData([]);
    setSavingDataStats([]);
    for (let i = 0; i < savingSTCData.length; i++) {
      const STCData = savingSTCData[i];
      const stcDecimals = await STCData.stcContract.decimals();
      const stcSymbol = await STCData.stcContract.symbol();
      const stcBalance = await formatUserTokenBalance(STCData.stcContract, account);
      const stcApproved = await checkIfApproved(STCData.stcContract, STCData.saving.address, account);
      const contractDataBalanceDetails = await STCData.saving.getBalanceDetails(account);
      const savingBalanceDetails: ISavingBalanceDetails = {
        currentBalance: contractDataBalanceDetails[0],
        normalizedBalance: contractDataBalanceDetails[1],
        compoundRate: contractDataBalanceDetails[2],
        lastUpdateOfCompoundRate: contractDataBalanceDetails[3].toNumber() * 1000,
        interestRate: contractDataBalanceDetails[4],
      };
      const systemBalanceRaw = await STCData.systemBalance.getBalance();
      const systemBalance = formatTokenBalance(systemBalanceRaw, stcDecimals);
      const withdrawableAmount = formatTokenBalance(savingBalanceDetails.currentBalance, stcDecimals);
      const stabilityFee = formatNumber(calculateInterestRate(savingBalanceDetails.interestRate.toString()), 3);
      const expectedEarningsPA = Number(formatTokenBalance(savingBalanceDetails.normalizedBalance, DECIMALS)) * (1 + Number(stabilityFee) / 100);

      setSavingAssetsData(prevState => {
        if (prevState.find(data => data.stcSymbol === stcSymbol)) return prevState;
        return [
          ...prevState,
          {
            id: i,
            stcSymbol,
            stcBalance,
            stcDecimals,
            stcApproved,
            withdrawableAmount,
            systemBalance,
            compoundRateUpdate: savingBalanceDetails.lastUpdateOfCompoundRate,
            stabilityFee,
            expectedEarningsPA,
          },
        ];
      });

      setSavingDataStats(prevState => {
        if (prevState.find(data => data.stcSymbol === stcSymbol)) return prevState;
        return [
          ...prevState,
          {
            stcSymbol,
            stcBalance,
            stcDecimals,
            systemBalance,
            stcAddress: STCData.stcContract.address,
            systemBalanceAddress: STCData.systemBalance.address,
          },
        ];
      });
    }
  }, [account, savingSTCData]);

  const getSavingContracts = (stcKey: string) => {
    return savingSTCData.find(data => data.stcKey === stcKey);
  };

  const getCompoundRateUpdateDate = (stcKey: string) => {
    const savingDetails = savingAssetsData.find(data => data.stcSymbol === stcKey);
    if (!savingDetails) return;
    return moment(savingDetails.compoundRateUpdate).fromNow();
  };

  const manageSavingTx = async (stcKey: string, amount: BigNumber, method: string) => {
    const savingContracts = getSavingContracts(stcKey);
    if (!savingContracts) return;
    const txReceipt = await sendPopulatedTransaction(savingContracts.saving, method, [amount]);
    // update state if tx is successful
    if (txReceipt?.status === 1) getUserSTCData();
  };

  const approveStc = async (stcKey: string) => {
    const savingContracts = getSavingContracts(stcKey);
    if (!savingContracts) return;
    const txReceipt = await approveERC20(savingContracts.stcContract, savingContracts.saving.address);
    // update state if tx is successful
    if (txReceipt?.status === 1) getUserSTCData();
  };

  const updateSavingCompoundRate = async (stcKey: string) => {
    const savingContracts = getSavingContracts(stcKey);
    if (!savingContracts) return;
    const txReceipt = await sendPopulatedTransaction(savingContracts.saving, 'updateCompoundRate', []);
    // update state if tx is successful
    if (txReceipt?.status === 1) getUserSTCData();
  };

  useEffect(() => {
    if (savingSTCData !== undefined && account) {
      getUserSTCData();
    }
  }, [getUserSTCData, savingSTCData, account]);

  const handleOpenManageModal = (id: number) => {
    manageSavingModalRef.current?.open();
    setSelectedSTCId(id);
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Lending</PageTitle>
      </PageHeader>
      <PairDataContainer>
        {savingDataStats &&
          savingDataStats.map((assetStats, index) => {
            return (
              <React.Fragment key={index}>
                <PairDataBlock>
                  <PairDataInfoLabel>{assetStats.stcSymbol} balance</PairDataInfoLabel>
                  <PairDataInfoValue>
                    <AnimatedNumber value={roundNumber(assetStats.stcBalance)} unit={assetStats.stcSymbol} />
                  </PairDataInfoValue>
                  <ContractAddressContainer onClick={() => copyToClipboard(assetStats.stcAddress, 'stc')}>
                    <ContractAddress>{trimString(assetStats.stcAddress)}</ContractAddress>
                    <img src={copyReference === `stc-${assetStats.stcAddress}` ? SuccessIcon : CopyIcon} alt="copy" />
                  </ContractAddressContainer>
                </PairDataBlock>
                <PairDataBlock>
                  <PairDataInfoLabel>{assetStats.stcSymbol} SysBalance</PairDataInfoLabel>
                  <PairDataInfoValue>
                    <AnimatedNumber value={roundNumber(assetStats.systemBalance)} unit={assetStats.stcSymbol} />
                  </PairDataInfoValue>
                  <ContractAddressContainer onClick={() => copyToClipboard(assetStats.systemBalanceAddress, 'sys')}>
                    <ContractAddress>{trimString(assetStats.systemBalanceAddress)}</ContractAddress>
                    <img src={copyReference === `sys-${assetStats.systemBalanceAddress}` ? SuccessIcon : CopyIcon} alt="copy" />
                  </ContractAddressContainer>
                </PairDataBlock>
              </React.Fragment>
            );
          })}
        {savingDataStats.length === 0 && (
          <>
            <BlockContainerSkeleton height="2.5rem" />
            <BlockContainerSkeleton height="2.5rem" />
            <BlockContainerSkeleton height="2.5rem" />
            <BlockContainerSkeleton height="2.5rem" />
          </>
        )}
      </PairDataContainer>
      <Subtitle>Savings</Subtitle>
      {(!savingSTCData || savingDataStats.length === 0) && <BlockContainerSkeleton height="3rem" />}
      {savingSTCData &&
        savingDataStats.length !== 0 &&
        savingSTCData.map((savingDetails, index) => {
          return (
            <SavingData key={index}>
              <SavingLabelContainer>
                <TokenIcon symbol={savingDetails.stcKey} size={40} />
                <SavingLabel>{savingDetails.stcKey}</SavingLabel>
              </SavingLabelContainer>
              <StabilityFeeInfo>
                <StabilityFeeLabel>Saving Fee (p.a.)</StabilityFeeLabel>
                <StabilityFeeValue>
                  <AnimatedNumber value={formatNumber(calculateInterestRate(savingDetails.stabilityFee.toString()))} unit={'%'} />
                </StabilityFeeValue>
              </StabilityFeeInfo>
              <StabilityFeeInfo>
                <StabilityFeeLabel>Saving balance updated</StabilityFeeLabel>
                {getCompoundRateUpdateDate(savingDetails.stcKey) && (
                  <CompoundRateUpdateDate>{getCompoundRateUpdateDate(savingDetails.stcKey)}</CompoundRateUpdateDate>
                )}
              </StabilityFeeInfo>
              <Button
                label="Update balance"
                color="secondary"
                onClick={() => updateSavingCompoundRate(savingDetails.stcKey)}
                icon={<img src={ReloadIcon} alt="reload" />}
              />
              <Button label="Manage" color="secondary" onClick={() => handleOpenManageModal(index)} icon={<img src={ManageIcon} alt="manage" />} />
            </SavingData>
          );
        })}
      {savingSTCData && selectedSTCId !== undefined && savingAssetsData[selectedSTCId] && (
        <ManageSavingModal
          modalRef={manageSavingModalRef}
          savingDetails={savingAssetsData[selectedSTCId]}
          manageSavingTx={manageSavingTx}
          approveStc={approveStc}
        />
      )}
    </PageContainer>
  );
};
