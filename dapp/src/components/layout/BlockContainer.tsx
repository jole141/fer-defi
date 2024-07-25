import { FC, HTMLAttributes } from 'react';
import styled from 'styled-components';
import { theme } from '../../constants/theme.config.ts';

interface IBlockContainerProps extends HTMLAttributes<HTMLDivElement> {}

const Wrapper = styled.div`
  background-color: ${theme.palette.secondary};
  border: 1px solid ${theme.palette.border};
  border-radius: 8px;
  padding: 1.8rem 2rem;
  margin: 0.6rem;
`;

const BlockContainer: FC<IBlockContainerProps> = ({ children, ...rest }) => {
  return <Wrapper {...rest}>{children}</Wrapper>;
};

export default BlockContainer;
