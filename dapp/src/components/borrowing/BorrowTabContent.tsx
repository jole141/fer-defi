import { FC } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { InputField } from '../InputField.tsx';
import Button from '../Button.tsx';
import { ITabContentProps } from '../modals/ManageVaultModal.tsx';
import { decimalToBN } from '../../utils/decimalToBN.ts';
import { InfoCardContainer, InfoCardLabel, InfoCardValue, VaultInfo } from './DepositTabContent.tsx';
import { roundNumber } from '../../utils/roundNumber.ts';

type Inputs = {
  borrowAmount: string;
};

const calcErrorTolerance = 0.0001;

export const BorrowTabContent: FC<ITabContentProps> = ({ vaultDetails, manageVaultTx }) => {
  const { colSymbol, colAsset, priceFeedValue, stcSymbol, liquidationPrice, colAssetInSTC, maxBorrowAmount, stcDecimals } = vaultDetails;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<Inputs>({
    mode: 'onChange',
  });
  const onSubmit: SubmitHandler<Inputs> = data => {
    const { borrowAmount } = data;
    manageVaultTx(vaultDetails.id, decimalToBN(borrowAmount, stcDecimals), 'generateStableCoin');
  };

  const calcMaxBorrowAmount = Math.max(Number(maxBorrowAmount) - calcErrorTolerance, 0);

  const handleMaxDeposit = () => {
    setValue('borrowAmount', calcMaxBorrowAmount.toString());
  };

  const borrowAmountInputValidation = {
    required: 'This field is required.',
    max: { value: maxBorrowAmount, message: `Max value is ${calcMaxBorrowAmount}.` },
    min: { value: 10, message: 'Min value is 10.' },
    pattern: {
      value: /^[0-9]*\.?[0-9]*$/,
      message: 'This input is number only.',
    },
  };

  return (
    <>
      <InputField
        label={'Amount to borrow'}
        subLabel={`Available: ${roundNumber(maxBorrowAmount)}`}
        unit={stcSymbol}
        maxValueAction={handleMaxDeposit}
        {...register('borrowAmount', borrowAmountInputValidation)}
        error={errors.borrowAmount?.message}
      />
      <InfoCardContainer>
        <VaultInfo>
          <InfoCardLabel>Collateral</InfoCardLabel>
          <InfoCardValue>
            {roundNumber(colAsset)} {colSymbol} ≈ {roundNumber(colAssetInSTC)} {stcSymbol}
          </InfoCardValue>
        </VaultInfo>
        <VaultInfo>
          <InfoCardLabel>Price</InfoCardLabel>
          <InfoCardValue>
            1 {colSymbol} ≈ {roundNumber(priceFeedValue)} {stcSymbol}
          </InfoCardValue>
        </VaultInfo>
        <VaultInfo>
          <InfoCardLabel>Liquidation price</InfoCardLabel>
          <InfoCardValue>
            1 {colSymbol} ≈ {roundNumber(liquidationPrice, 2)} {stcSymbol}
          </InfoCardValue>
        </VaultInfo>
      </InfoCardContainer>
      <Button color={'primary'} label={'Borrow'} onClick={handleSubmit(onSubmit)} width="100%" />
    </>
  );
};
