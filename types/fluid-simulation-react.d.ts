declare module 'fluid-simulation-react' {
  import { ForwardRefExoticComponent, RefAttributes } from 'react';

  interface FluidSimulationProps {
    densityDissipation?: number;
    velocityDissipation?: number;
    vorticity?: number;
    curl?: number;
    pressureIterations?: number;
    splatRadius?: number;
    splatForce?: number;
    bloom?: boolean;
    bloomIntensity?: number;
    bloomThreshold?: number;
    sunrays?: boolean;
    sunraysWeight?: number;
    paused?: boolean;
    shading?: boolean;
    colorful?: boolean;
    backColor?: { r: number; g: number; b: number };
    // Add more props if you discover/experiment with them
    [key: string]: any; // fallback for unknown props
  }

  const FluidSimulation: ForwardRefExoticComponent<
    FluidSimulationProps & RefAttributes<HTMLCanvasElement>
  >;

  export default FluidSimulation;
}