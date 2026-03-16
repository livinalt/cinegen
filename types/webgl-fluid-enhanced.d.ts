declare module 'webgl-fluid-enhanced' {
  interface FluidSimulationOptions {
    SIM_RESOLUTION?: number;
    DYE_RESOLUTION?: number;
    DENSITY_DISSIPATION?: number;
    VELOCITY_DISSIPATION?: number;
    PRESSURE?: number;
    PRESSURE_ITERATIONS?: number;
    CURL?: number;
    SPLAT_RADIUS?: number;
    SPLAT_FORCE?: number;
    BLOOM?: boolean;
    BLOOM_ITERATIONS?: number;
    BLOOM_INTENSITY?: number;
    BLOOM_THRESHOLD?: number;
    SUNRAYS?: boolean;
    SUNRAYS_RESOLUTION?: number;
    SUNRAYS_WEIGHT?: number;
    SHADING?: boolean;
    COLORFUL?: boolean;
    PAUSED?: boolean;
    BACK_COLOR?: { r: number; g: number; b: number };
    TRANSPARENT?: boolean;
    [key: string]: any;
  }

  interface FluidSimulationInstance {
    updateConfig: (config: Partial<FluidSimulationOptions>) => void;
    splat: (x: number, y: number, dx: number, dy: number, color: number[]) => void;
    pause: () => void;
    resume: () => void;
    // more methods if needed
  }

  const createFluidSimulation: (
    canvas: HTMLCanvasElement,
    options?: FluidSimulationOptions
  ) => FluidSimulationInstance;

  export default createFluidSimulation;
}