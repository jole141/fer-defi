import { FC, HTMLAttributes } from 'react';
import styled from 'styled-components';
import { theme } from '../../constants/theme.config.ts';

interface IBlockContainerProps extends HTMLAttributes<HTMLDivElement> {
  height?: string;
}

const Wrapper = styled.div<IBlockContainerProps>`
  border-radius: 8px;
  padding: 0.4rem 2rem;
  margin: 0.6rem;

  background: linear-gradient(-45deg, ${theme.palette.secondary} 40%, ${theme.palette.secondary}90 50%, ${theme.palette.secondary} 60%);
  background-size: 300%;
  background-position-x: 100%;
  animation: shimmer 0.8s infinite linear;
  height: ${({ height }) => height || 'auto'};

  @keyframes shimmer {
    to {
      background-position-x: 0;
    }
  }
`;

export const TableRowSkeleton: FC<IBlockContainerProps> = ({ ...rest }) => {
  return <Wrapper {...rest} />;
};
