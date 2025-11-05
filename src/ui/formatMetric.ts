export function clampDeg(v: number, min = -90, max = 90) {
  if (isNaN(v)) return undefined as any;
  return Math.max(min, Math.min(max, v));
}

export const formatters = {
  CVA: (v: number) => Math.max(0, Math.min(90, v)).toFixed(1) + "°",
  NIA: (v: number) => Math.max(0, Math.min(90, v)).toFixed(1) + "°",
  PTA: (v: number) => clampDeg(v).toFixed(1) + "°", // 부호 유지(+전방/-후방)
  SAA: (v: number) => Math.max(0, Math.min(90, v)).toFixed(1) + "°",
  TIA: (v: number) => clampDeg(v).toFixed(1) + "°",
  TBA: (v: number) => clampDeg(v).toFixed(1) + "°",
  BVA: (v: number) => clampDeg(v).toFixed(1) + "°",
  HPA: (v: number) => clampDeg(v).toFixed(1) + "°",
  KA:  (v: number) => Math.max(120, Math.min(200, v)).toFixed(1) + "°",
};

