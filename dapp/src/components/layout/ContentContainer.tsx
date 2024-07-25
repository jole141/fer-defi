import { FC, HTMLAttributes } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  margin: 0 auto;
  padding: 1rem;
`;

const OuterContainer = styled.div`
  width: 100%;
`;

const ContentContainer: FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <OuterContainer {...props}>
      <Wrapper>{children}</Wrapper>
    </OuterContainer>
  );
};

export default ContentContainer;
