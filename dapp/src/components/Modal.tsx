import { FC, HTMLAttributes, forwardRef, useImperativeHandle, useState, ReactNode, Ref } from 'react';
import styled from 'styled-components';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion } from 'framer-motion';
import CrossIcon from '../assets/cross.svg';
import Button from './Button.tsx';
import { theme } from '../constants/theme.config.ts';

export interface IModalRef {
  open: () => void;
  close: () => void;
}

interface IModalProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  children: ReactNode;
  ref: Ref<IModalRef>;
  width?: number;
  closableButton?: boolean;
  zIndex?: number;
}

const ModalContainer = styled(motion.div)<{ zIndex: number }>`
  position: fixed;
  z-index: ${({ zIndex }) => zIndex};
  color: ${theme.palette.textPrimary};
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${theme.palette.backgroundOverlay};
  pointer-events: all;
`;

const ModalDialog = styled.div<{ width: number }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: ${theme.palette.secondary};
  padding: 2rem;
  border-radius: 8px;
  width: ${({ width }) => `${width}px`};
  border: 1px solid ${theme.palette.border};
`;

const ModalClose = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
`;

const ModalTitle = styled.div`
  font-size: 1.4rem;
  line-height: 1.6rem;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
`;

const ModalContent = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
`;

const ModalFooter = styled.div`
  width: 100%;
  justify-self: flex-end;
`;

const Modal: FC<IModalProps> = forwardRef<IModalRef, IModalProps>((props, ref, ...rest) => {
  const [isOpen, setIsOpen] = useState(false);
  useHotkeys('esc', () => onClose());

  const onClose = () => {
    setIsOpen(false);
  };

  const onOpen = () => {
    setIsOpen(true);
  };

  useImperativeHandle(ref, () => ({
    open: onOpen,
    close: onClose,
  }));

  const { title, width = 360, children, closableButton, zIndex } = props;

  return isOpen ? (
    <ModalContainer
      {...rest}
      transition={{ duration: 0.25 }}
      variants={{
        open: { opacity: 1 },
        closed: { opacity: 0 },
      }}
      initial="closed"
      animate={isOpen ? 'open' : 'closed'}
      exit="closed"
      zIndex={zIndex || 10001}
    >
      <ModalOverlay onClick={onClose} />
      <ModalDialog width={width}>
        <ModalTitle>{title}</ModalTitle>
        <ModalClose>
          <Button color="tertiary" onClick={onClose} icon={<img src={CrossIcon} alt="icon" />} />
        </ModalClose>
        <ModalContent>{children}</ModalContent>
        {closableButton && (
          <ModalFooter>
            <Button color={'primary'} label={'Close'} onClick={onClose} width="100%" />
          </ModalFooter>
        )}
      </ModalDialog>
    </ModalContainer>
  ) : null;
});

export default Modal;
