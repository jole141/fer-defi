import { FC, Ref } from 'react';
import Modal, { IModalRef } from '../Modal.tsx';
import { IVaultDetails } from '../../types/defiContract.types.ts';
import { TabView } from '../TabView.tsx';
import { DepositTabContent } from '../borrowing/DepositTabContent.tsx';
import { BorrowTabContent } from '../borrowing/BorrowTabContent.tsx';
import { RepayTabContent } from '../borrowing/RepayTabContent.tsx';
import { WithdrawTabContent } from '../borrowing/WithdrawTabContent.tsx';
import { BigNumber } from 'ethers';

interface IManageVaultModalProps {
  modalRef: Ref<IModalRef>;
  vaultDetails: IVaultDetails;
  manageVaultTx: (vaultId: number, amount: BigNumber, method: string) => Promise<void>;
  approveStc: () => Promise<void>;
  approveCol: () => Promise<void>;
}

export type ITabContentProps = Omit<IManageVaultModalProps, 'modalRef' | 'approveStc' | 'approveCol'>;

export const ManageVaultModal: FC<IManageVaultModalProps> = ({ modalRef, vaultDetails, manageVaultTx, approveCol, approveStc }) => {
  return (
    <Modal ref={modalRef} title={`Vault #${vaultDetails.id}`}>
      <TabView
        options={[
          {
            title: 'Deposit',
            content: <DepositTabContent vaultDetails={vaultDetails} manageVaultTx={manageVaultTx} approveCol={approveCol} />,
          },
          {
            title: 'Borrow',
            content: <BorrowTabContent vaultDetails={vaultDetails} manageVaultTx={manageVaultTx} />,
          },
          {
            title: 'Repay',
            content: <RepayTabContent vaultDetails={vaultDetails} manageVaultTx={manageVaultTx} approveStc={approveStc} />,
          },
          {
            title: 'Withdraw',
            content: <WithdrawTabContent vaultDetails={vaultDetails} manageVaultTx={manageVaultTx} />,
          },
        ]}
      />
    </Modal>
  );
};
