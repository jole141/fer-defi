import { FC, ReactNode } from 'react';
import styled from 'styled-components';
import { theme } from '../../constants/theme.config.ts';
import LogoHeader from '../../assets/logo-header.png';
import { useNavigate } from 'react-router-dom';
import VaultIcon from '../../assets/vault.svg';
import VaultIconSelected from '../../assets/vault-selected.svg';
import StableCoinIcon from '../../assets/stablecoin.svg';
import StableCoinIconSelected from '../../assets/stablecoin-selected.svg';
import ParametersIcon from '../../assets/params.svg';
import ParametersIconSelected from '../../assets/params-selected.svg';
import { useWeb3Data } from '../../context/Web3ContextProvider.tsx';
import LogoutIcon from '../../assets/logout.svg';
import Button from '../Button.tsx';
import UserAddress from '../UserAddress.tsx';

interface ITabProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  activeIcon: ReactNode;
}

const Container = styled.div`
  position: fixed;
  background-color: ${theme.palette.secondary};
  border-right: 1px solid ${theme.palette.border};
  width: 16rem;
  height: 100vh;
  top: 0;
  left: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LogoImg = styled.img`
  height: 2rem;
  padding: 1rem 2rem;
  align-self: flex-start;
  cursor: pointer;
`;

const HLine = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${theme.palette.border};
`;

const TabContainer = styled.div<Pick<ITabProps, 'active'>>`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background-color: ${({ active }) => (active ? theme.palette.blueBackground : 'transparent')};
    color: ${({ active }) => (active ? theme.palette.blue : theme.palette.textPrimary)};
    width: 80%;
    border-radius: 8px;
    padding: 0.5rem 1.25rem;
    margin: 0.25rem 0;
    font-size: 0.85rem;
    cursor: pointer;
    
    &:hover {
        background-color: ${({ active }) => (active ? theme.palette.blueBackground : theme.palette.ternary)}};
    }
`;

const Icon = styled.img`
  height: 1.25rem;
`;

const Tab: FC<ITabProps> = ({ label, active, onClick, icon, activeIcon }) => {
  const handleClick = () => {
    if (!active) onClick();
  };

  return (
    <TabContainer active={active} onClick={handleClick}>
      {active ? activeIcon : icon}
      <div>{label}</div>
    </TabContainer>
  );
};

const SideNavBar: FC = () => {
  const navigate = useNavigate();
  const { account, connect, disconnect } = useWeb3Data();

  const checkActive = (label: string) => {
    const route = window.location.pathname;
    return route.startsWith(label);
  };

  return (
    <Container>
      <LogoImg src={LogoHeader} alt="Logo" onClick={() => navigate('/')} />
      <HLine />
      {account && <UserAddress address={account} />}
      {!account && <Button label="Connect Wallet" color="primary" onClick={connect} />}
      <Button label="Disconnect Wallet" color="secondary" onClick={disconnect} icon={<img src={LogoutIcon} alt="logout" />} />
      <HLine />
      <Tab
        label="Borrowing"
        active={checkActive('/borrowing')}
        onClick={() => navigate('/borrowing')}
        icon={<Icon src={VaultIcon} alt="vault" />}
        activeIcon={<Icon src={VaultIconSelected} alt="vault" />}
      />
      <Tab
        label="Lending"
        active={checkActive('/lending')}
        onClick={() => navigate('/lending')}
        icon={<Icon src={StableCoinIcon} alt="stablecoin" />}
        activeIcon={<Icon src={StableCoinIconSelected} alt="stablecoin" />}
      />
      <Tab
        label="Parameters"
        active={checkActive('/parameters')}
        onClick={() => navigate('/parameters')}
        icon={<Icon src={ParametersIcon} alt="params" />}
        activeIcon={<Icon src={ParametersIconSelected} alt="params" />}
      />
    </Container>
  );
};

export default SideNavBar;
