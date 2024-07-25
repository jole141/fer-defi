import { theme } from '../constants/theme.config.ts';
import styled from 'styled-components';
import Logo from '../assets/logo-header.png';

const IntroductionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const IntroductionLogo = styled.img`
  width: 12rem;
  margin: 2rem 0;
`;

const IntroductionText = styled.p`
  width: min(90%, 50rem);
  font-size: 0.85rem;
  line-height: 1.2rem;
  font-family: 'Inter', sans-serif;
  color: ${theme.palette.textSecondary};
  background-color: ${theme.palette.blueBackground};
  padding: 1.4rem;
  gap: 0.25rem;
  border-radius: 8px;
  margin: 0.25rem 0;
`;

export const Homepage = () => {
  return (
    <IntroductionContainer>
      <IntroductionLogo src={Logo} alt="FER Logo" />
      <IntroductionText>
        Welcome to our lending and borrowing platform, a pioneering initiative developed as a graduate thesis project for the Faculty of Electrical
        Engineering and Computing (FER), designed to revolutionize decentralized finance (DeFi) with a focus on academic innovation. Our platform,
        while inspired by the MakerDAO protocol, introduces FerUSD as a stablecoin specifically tailored for our academic community.
      </IntroductionText>
      <IntroductionText>
        Built upon the principles of MakerDAO, our platform offers a robust ecosystem for lending and borrowing, with tailored features to meet the
        unique needs of FER students, faculty, and staff. With FerUSD as our stablecoin, users can engage in lending and borrowing activities with
        confidence, knowing that their transactions are backed by collateral assets and governed by transparent smart contracts.
      </IntroductionText>
      <IntroductionText>
        Our platform serves as a testament to the innovative spirit of FER, showcasing the potential of blockchain technology in reshaping traditional
        finance. By leveraging FerUSD, we aim to provide a secure and reliable means for individuals within the academic community to access DeFi
        services, empowering them to manage their finances with greater flexibility and autonomy.
      </IntroductionText>
      <IntroductionText>
        Join us on this groundbreaking journey as we redefine the future of finance at FER and beyond. Explore our platform today and discover the
        transformative power of decentralized lending and borrowing with FerUSD.
      </IntroductionText>
    </IntroductionContainer>
  );
};
