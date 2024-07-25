import { FC } from 'react';
import NoDataImage from '../assets/no-data.svg';
import styled from 'styled-components';
import { theme } from '../constants/theme.config.ts';

interface INoDataProps {
  message?: string;
}

const Container = styled.div`
  padding: 4em;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  img {
    width: 100%;
    opacity: 0.8;
    max-width: 12rem;
  }

  p {
    margin-top: 1rem;
    font-size: 1rem;
    font-weight: 500;
    color: ${theme.palette.textSecondary};
  }
`;

export const NoData: FC<INoDataProps> = ({ message = 'No data available' }) => {
  return (
    <Container>
      <img src={NoDataImage} alt="No data" />
      <p>{message}</p>
    </Container>
  );
};
