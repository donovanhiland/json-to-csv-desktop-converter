import styled, { keyframes } from 'styled-components';

const SIZE = 44;

const circularRotateKeyframe = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const circularDashKeyframe = keyframes`
  0% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -15px;
  }
  100% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -125px;
  }
`;

const CircularProgressRoot = styled.span`
  display: inline-block;
  animation: ${circularRotateKeyframe} 1.4s linear infinite;
`;
const CircularProgressSVG = styled.svg`
  display: block;
`;
const CircularProgressCircle = styled.circle`
  stroke: currentColor;
  stroke-dasharray: 80px, 200px;
  stroke-dashoffset: 0;
  animation: ${circularDashKeyframe} 1.4s ease-in-out infinite;
`;

type LoaderProps = {
  size?: number;
};

const CircleLoadingSpinner = (props: LoaderProps) => {
  const { size = 20 } = props;
  const thickness = 3.6;

  return (
    <CircularProgressRoot
      style={{ width: size, height: size }}
      role="progressbar"
    >
      <CircularProgressSVG viewBox={`${SIZE / 2} ${SIZE / 2} ${SIZE} ${SIZE}`}>
        <CircularProgressCircle
          cx={SIZE}
          cy={SIZE}
          r={(SIZE - thickness) / 2}
          fill="none"
          strokeWidth={thickness}
        />
      </CircularProgressSVG>
    </CircularProgressRoot>
  );
};

export { CircleLoadingSpinner };
