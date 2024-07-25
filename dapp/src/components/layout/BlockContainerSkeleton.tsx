import { FC, HTMLAttributes } from 'react';
import styled from 'styled-components';
import { theme } from '../../constants/theme.config.ts';

interface IBlockContainerProps extends HTMLAttributes<HTMLDivElement> {
  height?: string;
}

const Wrapper = styled.div<IBlockContainerProps>`
  border: 1px solid ${theme.palette.border};
  border-radius: 8px;
  padding: 1.8rem 2rem;
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

const BlockContainerSkeleton: FC<IBlockContainerProps> = ({ ...rest }) => {
  return <Wrapper {...rest} />;
};

export default BlockContainerSkeleton;
