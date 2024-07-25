import { HTMLAttributes, useEffect, useRef } from "react";

import jazzicon from "@metamask/jazzicon";
import styled from "styled-components";

interface Props extends HTMLAttributes<HTMLDivElement> {
  address: string;
  size?: number;
}

export const StyledAddressIcon = styled.div`
  display: flex;

  & > div {
    display: inline-flex !important;
  }
`;

function AddressIcon({ address, size = 20, ...rest }: Props) {
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!iconRef.current) return;

    const addressSlice = address.slice(2, 10);
    const identicon = jazzicon(size, parseInt(addressSlice, 16));

    iconRef.current.innerHTML = "";
    iconRef.current.appendChild(identicon);
  }, [address, size]);

  return <StyledAddressIcon ref={iconRef} {...rest} />;
}

export default AddressIcon;
