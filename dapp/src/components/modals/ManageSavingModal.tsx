import { FC, Ref } from 'react';
import Modal, { IModalRef } from '../Modal.tsx';
import { ISavingDetails } from '../../types/defiContract.types.ts';
import { TabView } from '../TabView.tsx';
import { DepositTabContent } from '../saving/DepositTabContent.tsx';
import { WithdrawTabContent } from '../saving/WithdrawTabContent.tsx';
import { BigNumber } from 'ethers';

interface IManageSavingModalProps {
  modalRef: Ref<IModalRef>;
  savingDetails: ISavingDetails;
  manageSavingTx: (stcKey: string, amount: BigNumber, method: string) => Promise<void>;
  approveStc: (stcKey: string) => Promise<void>;
}

export type ITabContentProps = Omit<IManageSavingModalProps, 'modalRef' | 'approveStc' | 'approveCol'>;

export const ManageSavingModal: FC<IManageSavingModalProps> = ({ modalRef, savingDetails, manageSavingTx, approveStc }) => {
  return (
    <Modal ref={modalRef} title={`${savingDetails.stcSymbol} savings`}>
      <TabView
        options={[
          {
            title: 'Deposit',
            content: <DepositTabContent savingDetails={savingDetails} manageSavingTx={manageSavingTx} approveStc={approveStc} />,
          },
          {
            title: 'Withdraw',
            content: <WithdrawTabContent savingDetails={savingDetails} manageSavingTx={manageSavingTx} />,
          },
        ]}
      />
    </Modal>
  );
};
