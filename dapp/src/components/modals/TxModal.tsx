import { FC, Ref } from 'react';
import Modal, { IModalRef } from '../Modal.tsx';
import Spinner from '../Spinner.tsx';
import styled from 'styled-components';
import CrossIcon from '../../assets/cross-red.svg';
import DoubleCheckIcon from '../../assets/double-check.svg';
import { TxStatus } from '../../types/defiContract.types.ts';
import { theme } from '../../constants/theme.config.ts';
import { explorerURL } from '../../constants/network.config.ts';

interface ITxModalProps {
  status: TxStatus;
  modalRef: Ref<IModalRef>;
  txHash?: string;
  txMessageResponse?: string;
}

const TxStatusContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const TxTipMessage = styled.div`
  font-size: 1rem;
  line-height: 1.5rem;
  font-family: 'Inter', serif;
`;

const TxMessage = styled.div`
  font-size: 1.25rem;
  line-height: 1.5rem;
  font-weight: 500;
  font-family: 'Inter', serif;
  text-transform: capitalize;
`;

const TxStatusIcon = styled.img`
  width: 4rem;
  height: 4rem;
`;

const ExplorerLink = styled.a`
  font-size: 0.9rem;
  line-height: 1.2rem;
  font-family: 'Inter', serif;
  color: ${theme.palette.textSecondary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    color: ${theme.palette.textPrimary};
  }
`;

const TxDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding-bottom: 2rem;
`;

export const TxModal: FC<ITxModalProps> = ({ modalRef, status, txHash, txMessageResponse }) => {
  const content = (status: TxStatus, txHash?: string, message?: string) => {
    const txURLExplorer = `${explorerURL}tx/${txHash}`;
    switch (status) {
      case 'in-progress':
        return (
          <TxDetailsContainer>
            <TxStatusContainer>
              <Spinner size={120} thickness={5} />
            </TxStatusContainer>
            {!txHash && <TxTipMessage>Waiting for transaction to be confirmed.</TxTipMessage>}
            {txHash && (
              <>
                <TxTipMessage>Transaction confirmed</TxTipMessage>
                <ExplorerLink href={txURLExplorer} target="_blank">
                  View on Explorer
                </ExplorerLink>
              </>
            )}
          </TxDetailsContainer>
        );
      case 'success':
        return (
          <TxDetailsContainer>
            <TxStatusContainer>
              <TxStatusIcon src={DoubleCheckIcon} alt="double-check" />
            </TxStatusContainer>
            <TxMessage>{message}</TxMessage>
            {txHash && (
              <ExplorerLink href={txURLExplorer} target="_blank">
                View on Explorer
              </ExplorerLink>
            )}
          </TxDetailsContainer>
        );
      case 'error':
        return (
          <TxDetailsContainer>
            <TxStatusContainer>
              <TxStatusIcon src={CrossIcon} alt="cross" />
            </TxStatusContainer>
            <TxMessage>Error occurred</TxMessage>
            {txHash && (
              <ExplorerLink href={txURLExplorer} target="_blank">
                View on Explorer
              </ExplorerLink>
            )}
          </TxDetailsContainer>
        );
    }
  };

  const title = (status: TxStatus) => {
    switch (status) {
      case 'in-progress':
        if (txHash) return 'Sending Transaction';
        return 'Waiting for Confirmation...';
      case 'success':
        return 'Transaction Success';
      case 'error':
        return 'Transaction Failed';
    }
  };

  return (
    <Modal ref={modalRef} title={title(status)} closableButton={status === 'error' || status === 'success'} zIndex={10004}>
      {content(status, txHash, txMessageResponse)}
    </Modal>
  );
};
