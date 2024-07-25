import { FC } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { InputField } from '../InputField.tsx';
import Button from '../Button.tsx';
import styled from 'styled-components';
import { theme } from '../../constants/theme.config.ts';
import { ITabContentProps } from '../modals/ManageSavingModal.tsx';
import { decimalToBN } from '../../utils/decimalToBN.ts';
import { roundNumber } from '../../utils/roundNumber.ts';

type Inputs = {
  stcValue: string;
};

interface IDepositTabContentProps extends ITabContentProps {
  approveStc: (stcKey: string) => Promise<void>;
}

export const InfoCardContainer = styled.div`
  width: 90%;
  display: flex;
  flex-direction: column;
  background-color: ${theme.palette.blueBackground};
  padding: 1.4rem;
  gap: 0.25rem;
  border-radius: 8px;
`;

export const VaultInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const InfoCardLabel = styled.p`
  font-size: 0.85rem;
  line-height: 1.2rem;
  font-family: 'Inter', sans-serif;
  color: ${theme.palette.textSecondary};
`;

export const InfoCardValue = styled.p`
  font-size: 0.85rem;
  line-height: 1.2rem;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  color: ${theme.palette.textPrimary};
`;

export const DepositTabContent: FC<IDepositTabContentProps> = ({ savingDetails, manageSavingTx, approveStc }) => {
  const { stcBalance, stcSymbol, stcDecimals, stcApproved, withdrawableAmount, expectedEarningsPA, stabilityFee } = savingDetails;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<Inputs>({
    mode: 'onChange',
  });
  const onSubmit: SubmitHandler<Inputs> = data => {
    const { stcValue } = data;
    manageSavingTx(savingDetails.stcSymbol, decimalToBN(stcValue, stcDecimals), 'deposit');
  };

  const handleMaxDeposit = () => {
    setValue('stcValue', stcBalance);
  };

  const depositInputValidation = {
    required: 'This field is required.',
    max: { value: stcBalance, message: `Max value is ${stcBalance}.` },
    min: { value: 0, message: 'Min value is 0.' },
    pattern: {
      value: /^[0-9]*\.?[0-9]*$/,
      message: 'This input is number only.',
    },
  };

  return (
    <>
      <InputField
        label={'Amount to deposit'}
        subLabel={`Available: ${roundNumber(stcBalance)}`}
        unit={stcSymbol}
        maxValueAction={handleMaxDeposit}
        {...register('stcValue', depositInputValidation)}
        error={errors.stcValue?.message}
      />
      <InfoCardContainer>
        <VaultInfo>
          <InfoCardLabel>Saving balance</InfoCardLabel>
          <InfoCardValue>
            {roundNumber(withdrawableAmount)} {stcSymbol}
          </InfoCardValue>
        </VaultInfo>
        <VaultInfo>
          <InfoCardLabel>Stabilization reward (p.a.)</InfoCardLabel>
          <InfoCardValue>{roundNumber(stabilityFee)}%</InfoCardValue>
        </VaultInfo>
        <VaultInfo>
          <InfoCardLabel>Expected yearly earnings</InfoCardLabel>
          <InfoCardValue>
            {roundNumber(expectedEarningsPA)} {stcSymbol}
          </InfoCardValue>
        </VaultInfo>
      </InfoCardContainer>
      {stcApproved ? (
        <Button color={'primary'} label={'Deposit'} onClick={handleSubmit(onSubmit)} width="100%" />
      ) : (
        <Button color={'primary'} label={`Approve ${stcSymbol}`} onClick={() => approveStc(stcSymbol)} width="100%" />
      )}
    </>
  );
};
