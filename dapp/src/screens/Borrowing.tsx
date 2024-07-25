import { FC } from 'react';
import styled from 'styled-components';
import { useDeFiContracts } from '../context/DeFiContractsContextProvider.tsx';
import { calculateInterestRate } from '../utils/calculateInterestRate.ts';
import { formatNumber } from '../utils/formatNumber.ts';
import Button from '../components/Button.tsx';
import { useNavigate } from 'react-router-dom';
import BlockContainer from '../components/layout/BlockContainer.tsx';
import { theme } from '../constants/theme.config.ts';
import { PairIcons } from '../components/PairIcons.tsx';

interface IBorrowingProps {}

export const PageContainer = styled.div`
  padding: 1rem 2rem;
`;

export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

export const PageTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
`;

const BorrowingPairData = styled(BlockContainer)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BorrowingPairLabelContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const BorrowingPairLabel = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
`;

const InterestRateInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
`;

const InterestRateLabel = styled.p`
  color: ${theme.palette.textSecondary};
  font-size: 0.85rem;
`;

const InterestRateValue = styled.p`
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0.5rem;
`;

const Borrowing: FC<IBorrowingProps> = () => {
  const navigate = useNavigate();
  const { supportedBorrowingPairs } = useDeFiContracts();

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Borrowing</PageTitle>
      </PageHeader>
      {supportedBorrowingPairs.map(pair => {
        return (
          <BorrowingPairData key={pair.colKey + pair.stcKey}>
            <BorrowingPairLabelContainer>
              <PairIcons symbol1={pair.colKey} symbol2={pair.stcKey} size={36} borderColor={theme.palette.secondary} />
              <BorrowingPairLabel>
                {pair.colKey} → {pair.stcKey}
              </BorrowingPairLabel>
            </BorrowingPairLabelContainer>
            <InterestRateInfo>
              <InterestRateLabel>Borrowing Fee (p.a.)</InterestRateLabel>
              <InterestRateValue>{formatNumber(calculateInterestRate(pair.interestRate.toString()))}%</InterestRateValue>
            </InterestRateInfo>
            <Button label="Open" color="primary" onClick={() => navigate(`/borrowing/${pair.colKey}_${pair.stcKey}`)} />
          </BorrowingPairData>
        );
      })}
    </PageContainer>
  );
};

export default Borrowing;
