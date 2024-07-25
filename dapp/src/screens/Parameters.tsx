import { useCallback, useEffect, useState } from 'react';
import { theme } from '../constants/theme.config.ts';
import styled from 'styled-components';
import { useDeFiContracts } from '../context/DeFiContractsContextProvider.tsx';
import { IParameters } from '../types/defiContract.types.ts';
import { PageContainer, PageHeader, PageTitle } from './Borrowing.tsx';
import CopyIcon from '../assets/copy.svg';
import SuccessIcon from '../assets/double-check-white.svg';
import { TableRowSkeleton } from '../components/layout/TableRowSkeleton.tsx';
import Button from '../components/Button.tsx';
import { ContractAddress, ContractAddressContainer } from './BorrowingPair.tsx';
import { trimString } from '../utils/trimString.ts';

const PageTitleContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ParametersTable = styled.table`
  width: 100%;
  margin-top: 2rem;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.9rem;

  th {
    font-weight: 600;
    color: ${theme.palette.textPrimary};
    text-align: left;
    padding: 0.5rem 0;
  }
  td {
    padding: 0.5rem 0;
    color: ${theme.palette.textSecondary};
    border-bottom: 1px solid ${theme.palette.border};
  }
`;

const CopyButton = styled.div`
  cursor: pointer;
  display: inline-block;
  width: 1rem;
  height: 1rem;
  justify-content: center;
  align-items: center;
  margin-left: 0.5rem;
  padding: 0.1rem;
  border-radius: 0.2rem;

  img {
    width: 0.85rem;
    height: 0.85rem;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
`;

const MAX_ITEMS_PER_PAGE = 15;

export const Parameters = () => {
  const { defiParametersAddress, supportedBorrowingPairs } = useDeFiContracts();
  const [parameters, setParameters] = useState<IParameters[]>([]);
  const [copyReference, setCopyReference] = useState<string>('');
  const [pageOffset, setPageOffset] = useState<number>(0);

  const copyToClipboard = async (text: string, copyRef: string) => {
    await navigator.clipboard.writeText(text);
    setCopyReference(`${copyRef}-${text}`);
    setTimeout(() => {
      setCopyReference('');
    }, 2500);
  };

  const handleNextPage = () => {
    const size = parameters.length;
    if (pageOffset + MAX_ITEMS_PER_PAGE >= size) return;
    setPageOffset(pageOffset + MAX_ITEMS_PER_PAGE);
  };

  const handlePreviousPage = () => {
    if (pageOffset === 0) return;
    setPageOffset(pageOffset - MAX_ITEMS_PER_PAGE);
  };

  const getAddressParameters = useCallback(async () => {
    setParameters([]);
    const defiParametersContracts = supportedBorrowingPairs.map(pair => {
      return pair.defiParameters;
    });
    const parameters = [];
    for (const contract of defiParametersContracts) {
      // UINT parameters
      const uintParameters = await contract.getAllUintParameters();
      if (uintParameters.length === 2) {
        const keys = uintParameters[0];
        const values = uintParameters[1];
        for (let i = 0; i < keys.length; i++) {
          parameters.push({ key: keys[i], value: values[i].toString() });
        }
      }
      // ADDRESS parameters
      const addressesParameters = await contract.getAllAddressParameters();
      if (addressesParameters.length === 2) {
        const keys = addressesParameters[0];
        const values = addressesParameters[1];
        for (let i = 0; i < keys.length; i++) {
          parameters.push({ key: keys[i], value: values[i].toString() });
        }
      }
    }
    setParameters(parameters);
  }, [supportedBorrowingPairs]);

  useEffect(() => {
    getAddressParameters();
  }, [getAddressParameters]);

  return (
    <PageContainer>
      <PageHeader>
        <PageTitleContainer>
          <PageTitle>DeFi Parameters</PageTitle>
          <ContractAddressContainer onClick={() => copyToClipboard(defiParametersAddress, defiParametersAddress)}>
            <ContractAddress>{trimString(defiParametersAddress, '42')}</ContractAddress>
            <img src={copyReference === `${defiParametersAddress}-${defiParametersAddress}` ? SuccessIcon : CopyIcon} alt="copy" />
          </ContractAddressContainer>
        </PageTitleContainer>
        <Pagination>
          <Button label="Previous" color="primary" onClick={handlePreviousPage} disabled={pageOffset === 0} />
          <Button label="Next" color="primary" onClick={handleNextPage} disabled={pageOffset + MAX_ITEMS_PER_PAGE >= parameters.length} />
        </Pagination>
      </PageHeader>
      {parameters.length === 0 && (
        <ParametersTable>
          <thead>
            <tr>
              <th>Parameter key</th>
              <th>Parameter value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <TableRowSkeleton />
              </td>
              <td>
                <TableRowSkeleton />
              </td>
            </tr>
            <tr>
              <td>
                <TableRowSkeleton />
              </td>
              <td>
                <TableRowSkeleton />
              </td>
            </tr>
            <tr>
              <td>
                <TableRowSkeleton />
              </td>
              <td>
                <TableRowSkeleton />
              </td>
            </tr>
            <tr>
              <td>
                <TableRowSkeleton />
              </td>
              <td>
                <TableRowSkeleton />
              </td>
            </tr>
            <tr>
              <td>
                <TableRowSkeleton />
              </td>
              <td>
                <TableRowSkeleton />
              </td>
            </tr>
          </tbody>
        </ParametersTable>
      )}
      {parameters.length !== 0 && (
        <ParametersTable>
          <thead>
            <tr>
              <th>Parameter key</th>
              <th>Parameter value</th>
            </tr>
          </thead>
          <tbody>
            {parameters.slice(pageOffset, pageOffset + MAX_ITEMS_PER_PAGE).map((parameter, index) => (
              <tr key={index}>
                <td>
                  {parameter.key}
                  <CopyButton onClick={() => copyToClipboard(parameter.key, index.toString())}>
                    <img src={copyReference !== `${index}-${parameter.key}` ? CopyIcon : SuccessIcon} alt="copy" />
                  </CopyButton>
                </td>
                <td>
                  {parameter.value}
                  <CopyButton onClick={() => copyToClipboard(parameter.value, index.toString())}>
                    <img src={copyReference !== `${index}-${parameter.value}` ? CopyIcon : SuccessIcon} alt="copy" />
                  </CopyButton>
                </td>
              </tr>
            ))}
          </tbody>
        </ParametersTable>
      )}
    </PageContainer>
  );
};
