import type { Pt } from "./sideNormalization";

export function angleFromHorizontalDeg(a: Pt, b: Pt): number {
  return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI; // -180~+180
}

// -90~+90 로 정규화(항상 예각)
export function normalizeToAcuteDeg(theta: number): number {
  let t = theta;
  if (t > 90)  t -= 180;
  if (t < -90) t += 180;
  return t;
}

// 수직 기준에서 전/후방 부호(+전방, -후방)
export function angleFromVerticalSignedDeg(top: Pt, bottom: Pt): number {
  const dx = top.x - bottom.x;
  const dy = bottom.y - top.y; // 위->아래
  const acute = Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI; // 0~90
  return dx >= 0 ? +acute : -acute;
}

// 관절내부각 (B-vertex)
export function jointAngleDeg(a: Pt, b: Pt, c: Pt): number {
  const v1x = a.x - b.x, v1y = a.y - b.y;
  const v2x = c.x - b.x, v2y = c.y - b.y;
  const dot = v1x*v2x + v1y*v2y;
  const m1 = Math.hypot(v1x, v1y), m2 = Math.hypot(v2x, v2y);
  const cos = Math.min(1, Math.max(-1, dot/(m1*m2)));
  return Math.acos(cos) * 180/Math.PI;
}

