import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppContainer from './components/layout/AppContainer.tsx';
import Borrowing from './screens/Borrowing.tsx';
import BorrowingPair from './screens/BorrowingPair.tsx';
import { Lending } from './screens/Lending.tsx';
import { Homepage } from './screens/Homepage.tsx';
import { Parameters } from './screens/Parameters.tsx';

const HomeRoute = () => {
  return (
    <AppContainer>
      <Homepage />
    </AppContainer>
  );
};

const BorrowingRoute = () => {
  return (
    <AppContainer>
      <Borrowing />
    </AppContainer>
  );
};

const BorrowingPairRoute = () => {
  return (
    <AppContainer>
      <BorrowingPair />
    </AppContainer>
  );
};

const LendingRoute = () => {
  return (
    <AppContainer>
      <Lending />
    </AppContainer>
  );
};

const ParametersRoute = () => {
  return (
    <AppContainer>
      <Parameters />
    </AppContainer>
  );
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/borrowing" element={<BorrowingRoute />} />
        <Route path="/borrowing/:pair" element={<BorrowingPairRoute />} />
        <Route path="/lending" element={<LendingRoute />} />
        <Route path="/parameters" element={<ParametersRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
