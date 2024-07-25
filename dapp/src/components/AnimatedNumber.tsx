import { FC } from 'react';
import AnimatedNumbers from 'react-animated-numbers';
import styled from 'styled-components';

interface IAnimatedNumberProps {
  value: string | number;
  unit?: string;
  duration?: number;
}

const AnimatedNumberContainer = styled.div`
  display: flex;
  gap: 0.25rem;
`;

export const AnimatedNumber: FC<IAnimatedNumberProps> = ({ value, unit, duration = 0.75 }) => {
  const parsedValue = parseFloat(value.toString());

  return (
    <AnimatedNumberContainer>
      <AnimatedNumbers
        animateToNumber={parsedValue}
        transitions={() => ({
          duration,
        })}
      />
      <p>{unit}</p>
    </AnimatedNumberContainer>
  );
};
