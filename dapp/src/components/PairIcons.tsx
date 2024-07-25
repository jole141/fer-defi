import styled from 'styled-components';
import { FC } from 'react';
import { TokenIcon } from './TokenIcon.tsx';

interface IPairIconsProps {
  symbol1: string;
  symbol2: string;
  size?: number;
  borderColor?: string;
}

const IconsContainer = styled.div`
  display: flex;
`;

const TokenIconOverflow = styled(TokenIcon)`
  margin-left: -0.7rem;
`;

export const PairIcons: FC<IPairIconsProps> = ({ symbol1, symbol2, size, borderColor }) => {
  return (
    <IconsContainer>
      <TokenIcon symbol={symbol1} size={size} borderColor={borderColor} />
      <TokenIconOverflow symbol={symbol2} size={size} borderColor={borderColor} />
    </IconsContainer>
  );
};
