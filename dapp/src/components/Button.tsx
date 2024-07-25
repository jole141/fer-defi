import { FC, HTMLAttributes, ReactNode } from 'react';
import styled from 'styled-components';
import { theme } from '../constants/theme.config.ts';
import Spinner from './Spinner.tsx';

interface IButtonProps extends HTMLAttributes<HTMLButtonElement> {
  label?: string;
  color: 'primary' | 'secondary' | 'tertiary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  width?: string;
}

const StyledButton = styled.button<IButtonProps>`
  transition: background-color 0.2s ease-in-out;
  margin: 0.25rem;
  font-family: Inter, sans-serif;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: ${p => (p.icon ? '0.5rem' : '0.25rem')};
  width: ${p => (p.label ? p.width || '12rem' : '2.5rem')};
  height: 2.5rem;
  cursor: pointer;
  box-sizing: border-box;
  border-radius: 8px;
  color: ${p => theme.components.button[p.color].color};
  background-color: ${p => theme.components.button[p.color].background};
  font-weight: ${p => theme.components.button[p.color].fontWeight};
  border: ${p => theme.components.button[p.color].border};
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.25);
  opacity: ${p => (p.disabled ? 0.8 : 1)};
  pointer-events: ${p => (p.disabled ? 'none' : 'auto')};

  &:hover {
    background-color: ${p => theme.components.button[p.color].backgroundHover};
    color: ${p => theme.components.button[p.color].hover};
    opacity: ${p => theme.components.button[p.color].opacity};
  }

  & > img {
    width: 0.85rem;
    height: 0.85rem;
  }
`;

const Button: FC<IButtonProps> = ({ label, color, disabled = false, loading = false, icon, width, ...rest }) => {
  const buttonDisabled = disabled || loading;

  return (
    <StyledButton disabled={buttonDisabled} label={label} color={color} icon={icon} width={width} {...rest}>
      {icon}
      {loading && <Spinner />}
      {label}
    </StyledButton>
  );
};

export default Button;
