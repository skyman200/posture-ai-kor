// ∠ABC (벡터 BA, BC)의 각도(°)
export const calcAngle = (a, b, c) => {
  const BA = [a.x - b.x, a.y - b.y];
  const BC = [c.x - b.x, c.y - b.y];
  const dot = BA[0] * BC[0] + BA[1] * BC[1];
  const mag = Math.hypot(...BA) * Math.hypot(...BC);
  const cos = Math.max(-1, Math.min(1, dot / Math.max(mag, 1e-9)));
  return Math.acos(cos) * 180 / Math.PI;
};

// 수직(아래방향)과 선분 a-b가 이루는 각(°) : 화면 y+가 아래이므로 [0,1]이 수직
export const angleToVertical = (a, b) => {
  const v = [b.x - a.x, b.y - a.y];
  const vertical = [0, 1];
  const dot = v[0] * vertical[0] + v[1] * vertical[1];
  const mag = Math.hypot(...v) * Math.hypot(...vertical);
  const cos = Math.max(-1, Math.min(1, dot / Math.max(mag, 1e-9)));
  return Math.acos(cos) * 180 / Math.PI;
};

