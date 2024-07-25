import { FC, ReactNode, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../constants/theme.config.ts';

interface ITabViewOption {
  title: string;
  content: ReactNode;
}

interface ITabViewProps {
  options: ITabViewOption[];
  handleTabChange?: (index: number) => void;
}
const TabSelectorContainer = styled.div`
  width: 100%;
  background-color: ${theme.palette.secondary};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
`;

const TabItem = styled.div<{ selected: boolean }>`
  padding: 0.5rem 1rem;
  background-color: ${({ selected }) => (selected ? theme.palette.blueBackground : theme.palette.secondary)};
  color: ${({ selected }) => (selected ? theme.palette.blue : theme.palette.textSecondary)};
  border-bottom: 2px solid ${({ selected }) => (selected ? theme.palette.blue : theme.palette.secondary)};
  cursor: pointer;
  text-align: center;
`;

export const TabView: FC<ITabViewProps> = ({ options, handleTabChange }) => {
  const tabTitles = options.map(option => option.title);
  const [selectedTab, setSelectedTab] = useState(0);

  const onTabChange = (index: number) => {
    handleTabChange && handleTabChange(index);
    setSelectedTab(index);
  };

  return (
    <>
      <TabSelectorContainer>
        {tabTitles.map((title, index) => (
          <TabItem key={index} selected={selectedTab === index} onClick={() => onTabChange(index)}>
            {title}
          </TabItem>
        ))}
      </TabSelectorContainer>
      {options[selectedTab].content}
    </>
  );
};
