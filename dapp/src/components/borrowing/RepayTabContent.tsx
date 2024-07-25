import { FC } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { InputField } from '../InputField.tsx';
import Button from '../Button.tsx';
import { ITabContentProps } from '../modals/ManageVaultModal.tsx';
import { decimalToBN } from '../../utils/decimalToBN.ts';
import { InfoCardContainer, InfoCardLabel, InfoCardValue, VaultInfo } from './DepositTabContent.tsx';
import { roundNumber } from '../../utils/roundNumber.ts';

type Inputs = {
  repayAmount: string;
};

interface IWithdrawTabContentProps extends ITabContentProps {
  approveStc: () => Promise<void>;
}

export const RepayTabContent: FC<IWithdrawTabContentProps> = ({ vaultDetails, approveStc, manageVaultTx }) => {
  const { debt, stcSymbol, stcBalance, stcDecimals, stcApproved } = vaultDetails;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<Inputs>({
    mode: 'onChange',
  });
  const onSubmit: SubmitHandler<Inputs> = data => {
    const { repayAmount } = data;
    manageVaultTx(vaultDetails.id, decimalToBN(repayAmount, stcDecimals), 'payBackStc');
  };

  const maxRepayAmount = Math.min(Number(debt), Number(stcBalance));

  const handleMaxDeposit = () => {
    setValue('repayAmount', maxRepayAmount.toString());
  };

  const repayAmountInputValidation = {
    required: 'This field is required.',
    max: { value: maxRepayAmount, message: `Max value is ${maxRepayAmount}.` },
    min: { value: 10, message: 'Min value is 10.' },
    pattern: {
      value: /^[0-9]*\.?[0-9]*$/,
      message: 'This input is number only.',
    },
  };

  return (
    <>
      <InputField
        label={'Amount to repay'}
        subLabel={`Debt: ${roundNumber(debt)}`}
        unit={stcSymbol}
        maxValueAction={handleMaxDeposit}
        {...register('repayAmount', repayAmountInputValidation)}
        error={errors.repayAmount?.message}
      />
      <InfoCardContainer>
        <VaultInfo>
          <InfoCardLabel>{stcSymbol} Balance</InfoCardLabel>
          <InfoCardValue>{roundNumber(stcBalance)}</InfoCardValue>
        </VaultInfo>
      </InfoCardContainer>
      {stcApproved ? (
        <Button color={'primary'} label={'Repay debt'} onClick={handleSubmit(onSubmit)} width="100%" />
      ) : (
        <Button color={'primary'} label={`Approve ${stcSymbol}`} onClick={approveStc} width="100%" />
      )}
    </>
  );
};
