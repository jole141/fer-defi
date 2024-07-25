import { FC, HTMLAttributes } from 'react';

import styled from 'styled-components';
import AddressIcon from './AddressIcon.tsx';
import { theme } from '../constants/theme.config.ts';
import { trimString } from '../utils/trimString.ts';

interface IUserAddressProps extends HTMLAttributes<HTMLDivElement> {
  address: string;
}

export const AddressWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  border: 1px solid ${theme.palette.border};
  width: 8rem;
  border-radius: 8px;
  padding: 0.65rem 2rem;
  margin: 0.25rem 0;
  font-size: 0.85rem;
`;

export const AddressValue = styled.span`
  margin-left: 0.5rem;
  font-size: 0.875rem;
`;

const UserAddress: FC<IUserAddressProps> = ({ address, ...rest }) => {
  return (
    <AddressWrapper {...rest}>
      <AddressIcon address={address} size={16} />
      <AddressValue>{trimString(address)}</AddressValue>
    </AddressWrapper>
  );
};

export default UserAddress;
