import { FC } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { InputField } from '../InputField.tsx';
import Button from '../Button.tsx';
import { ITabContentProps } from '../modals/ManageVaultModal.tsx';
import { decimalToBN } from '../../utils/decimalToBN.ts';
import { roundNumber } from '../../utils/roundNumber.ts';

type Inputs = {
  withdrawAmount: string;
};

export const WithdrawTabContent: FC<ITabContentProps> = ({ vaultDetails, manageVaultTx }) => {
  const { withdrawableAmount, colDecimals, colSymbol } = vaultDetails;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<Inputs>({
    mode: 'onChange',
  });
  const onSubmit: SubmitHandler<Inputs> = data => {
    const { withdrawAmount } = data;
    manageVaultTx(vaultDetails.id, decimalToBN(withdrawAmount, colDecimals), 'withdrawCol');
  };

  const handleMaxDeposit = () => {
    setValue('withdrawAmount', withdrawableAmount);
  };

  const withdrawAmountInputValidation = {
    required: 'This field is required.',
    max: { value: withdrawableAmount, message: `Max value is ${withdrawableAmount}.` },
    min: { value: 0, message: 'Min value is 0.' },
    pattern: {
      value: /^[0-9]*\.?[0-9]*$/,
      message: 'This input is number only.',
    },
  };

  return (
    <>
      <InputField
        label={'Amount to withdraw'}
        subLabel={`Available: ${roundNumber(withdrawableAmount)}`}
        unit={colSymbol}
        maxValueAction={handleMaxDeposit}
        {...register('withdrawAmount', withdrawAmountInputValidation)}
        error={errors.withdrawAmount?.message}
      />
      <Button color={'primary'} label={'Withdraw'} onClick={handleSubmit(onSubmit)} width="100%" />
    </>
  );
};
