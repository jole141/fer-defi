import { FC, HTMLAttributes } from "react";
import styled, { css } from "styled-components";

interface ISpinnerProps extends HTMLAttributes<SVGSVGElement> {
  size?: number;
  thickness?: number;
}

export const StyledSpinner = styled.svg<{
  size: number;
  radius: number;
}>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  animation: rotate 2s linear infinite;

  & circle {
    stroke: currentColor;
    stroke-linecap: round;
    animation: spin-${({ radius }) => radius} 1.5s ease-in-out infinite;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  ${({ radius }) => css`
    @keyframes spin-${radius} {
      0% {
        stroke-dasharray: 1 ${2 * radius * Math.PI};
        stroke-dashoffset: 0;
      }
      50% {
        stroke-dasharray: ${2 * radius * Math.PI} ${2 * radius * Math.PI};
        stroke-dashoffset: -${0.5 * radius * Math.PI};
      }
      100% {
        stroke-dasharray: ${2 * radius * Math.PI} ${2 * radius * Math.PI};
        stroke-dashoffset: -${2 * radius * Math.PI};
      }
    }
  `}
`;

const Spinner: FC<ISpinnerProps> = ({ size = 20, thickness = 2, ...rest }) => {
  return (
    <StyledSpinner size={size} radius={size / 2 - 2 * thickness} {...rest}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 2 * thickness}
        fill="none"
        strokeWidth={thickness}
      />
    </StyledSpinner>
  );
};

export default Spinner;
