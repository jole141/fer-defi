import { FC, forwardRef, InputHTMLAttributes } from 'react';
import styled from 'styled-components';
import { theme } from '../constants/theme.config.ts';
import Button from './Button.tsx';

interface IInputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  subLabel?: string;
  unit?: string;
  maxValueAction?: () => void;
  error?: string;
}

const MainInputContainer = styled.div`
  width: min(100%, 24rem);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Input = styled.input`
  width: 10rem;
  background-color: ${theme.palette.secondary};
  border: none;
  color: ${theme.palette.textSecondary};
  font-size: 1rem;
  line-height: 1.5rem;
  font-family: 'Inter', sans-serif;
  padding: 0.75rem 0.5rem;
  /* to avoid border issue on error */
  height: 99%;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${theme.palette.textSecondary};
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  -moz-appearance: textfield;
`;

const Unit = styled.p`
  font-size: 1rem;
  font-weight: 600;
`;

const InputContainer = styled.div<Partial<IInputFieldProps>>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 1.5rem;
  border-radius: 8px;
  background-color: ${theme.palette.secondary};
  color: ${theme.palette.textPrimary};
  border: ${({ error }) => (error ? `1px solid ${theme.palette.danger}` : `1px solid ${theme.palette.border}`)};
`;

const InputLabelContainer = styled.div`
  width: min(100%, 24rem);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
`;

const InputLabel = styled.p`
  font-size: 1rem;
  font-weight: 500;
  color: ${theme.palette.textPrimary};
`;

const InputSubLabel = styled.p`
  font-size: 0.8rem;
  font-weight: 500;
  color: ${theme.palette.textSecondary};
`;

const ErrorMessage = styled.p`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${theme.palette.danger};
  width: min(95%, 24rem);
  text-align: right;
  height: 1rem;
`;

export const InputField: FC<IInputFieldProps> = forwardRef<HTMLInputElement, IInputFieldProps>(
  ({ label, subLabel, unit, maxValueAction, error = '', ...rest }, ref) => {
    return (
      <MainInputContainer>
        <InputLabelContainer>
          <InputLabel>{label}</InputLabel>
          <InputSubLabel>{subLabel}</InputSubLabel>
        </InputLabelContainer>
        <InputContainer error={error}>
          <Unit>{unit}</Unit>
          <Input ref={ref} {...rest} />
          {maxValueAction && <Button label="MAX" color="tertiary" onClick={maxValueAction} />}
        </InputContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </MainInputContainer>
    );
  },
);
