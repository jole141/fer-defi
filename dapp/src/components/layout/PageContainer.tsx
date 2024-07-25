import { FC, HTMLAttributes } from 'react';
import styled from 'styled-components';
import { theme } from '../../constants/theme.config.ts';

const Wrapper = styled.div`
  background-color: ${theme.palette.primary};
  min-height: 100vh;
  width: calc(100% - 16rem);
  padding-left: 16rem;
`;

const PageContainer: FC<HTMLAttributes<HTMLDivElement>> = ({ children }: HTMLAttributes<HTMLDivElement>) => {
  return <Wrapper>{children}</Wrapper>;
};

export default PageContainer;
