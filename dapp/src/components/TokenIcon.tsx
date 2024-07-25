import styled from 'styled-components';
import { FC, HTMLAttributes } from 'react';
import { theme } from '../constants/theme.config.ts';

interface ITokenIconProps extends HTMLAttributes<HTMLDivElement> {
  symbol?: string;
  size?: number;
  borderColor?: string;
}

const IconContainer = styled.div<Pick<ITokenIconProps, 'size' | 'borderColor'>>`
  border: 3px solid ${({ borderColor }) => borderColor};
  border-radius: 50%;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  img {
    width: 100%;
    height: 100%;
  }
`;

export const TokenIcon: FC<ITokenIconProps> = ({ symbol = 'FerBTC', size = 48, borderColor = theme.palette.primary, ...rest }) => {
  const iconSrc = ` ../src/assets/${symbol}.png`;

  return (
    <IconContainer size={size} borderColor={borderColor} {...rest}>
      <img src={iconSrc} alt={symbol} />
    </IconContainer>
  );
};
