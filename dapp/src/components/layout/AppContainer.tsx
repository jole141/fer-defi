import { FC, HTMLAttributes } from "react";
import styled from "styled-components";
import SideNavBar from "./SideNavBar.tsx";
import PageContainer from "./PageContainer.tsx";
import ContentContainer from "./ContentContainer.tsx";
import { theme } from "../../constants/theme.config.ts";

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  color: ${theme.palette.textPrimary};
`;

const AppContainer: FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <Wrapper>
      <SideNavBar />
      <PageContainer>
        <ContentContainer>{children}</ContentContainer>
      </PageContainer>
    </Wrapper>
  );
};

export default AppContainer;
