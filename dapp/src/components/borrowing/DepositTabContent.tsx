import { FC } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { InputField } from '../InputField.tsx';
import Button from '../Button.tsx';
import styled from 'styled-components';
import { theme } from '../../constants/theme.config.ts';
import { ITabContentProps } from '../modals/ManageVaultModal.tsx';
import { decimalToBN } from '../../utils/decimalToBN.ts';
import { roundNumber } from '../../utils/roundNumber.ts';

type Inputs = {
  collateralValue: string;
};

interface IDepositTabContentProps extends ITabContentProps {
  approveCol: () => Promise<void>;
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

export const DepositTabContent: FC<IDepositTabContentProps> = ({ vaultDetails, manageVaultTx, approveCol }) => {
  const { colSymbol, colAsset, priceFeedValue, stcSymbol, colBalance, liquidationPrice, colDecimals, colAssetInSTC, colApproved } = vaultDetails;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<Inputs>({
    mode: 'onChange',
  });
  const onSubmit: SubmitHandler<Inputs> = data => {
    const { collateralValue } = data;
    manageVaultTx(vaultDetails.id, decimalToBN(collateralValue, colDecimals), 'depositCollateral');
  };

  const handleMaxDeposit = () => {
    setValue('collateralValue', colBalance);
  };

  const depositInputValidation = {
    required: 'This field is required.',
    max: { value: colBalance, message: `Max value is ${colBalance}.` },
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
        subLabel={`Available: ${roundNumber(colBalance)}`}
        unit={colSymbol}
        maxValueAction={handleMaxDeposit}
        {...register('collateralValue', depositInputValidation)}
        error={errors.collateralValue?.message}
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
      {colApproved ? (
        <Button color={'primary'} label={'Deposit'} onClick={handleSubmit(onSubmit)} width="100%" />
      ) : (
        <Button color={'primary'} label={`Approve ${colSymbol}`} onClick={approveCol} width="100%" />
      )}
    </>
  );
};
