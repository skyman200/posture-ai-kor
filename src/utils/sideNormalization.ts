export type Pt = { x: number; y: number };

export function isRightSideView(pts: Record<string, Pt>): boolean {
  // tragus가 C7보다 뒤쪽(x가 더 작음)이면 오른옆(R-side)로 간주
  const t = pts["tragus"];
  const c7 = pts["c7"];
  if (!t || !c7) return false;
  return t.x < c7.x;
}

export function mirrorToLeft(points: Record<string, Pt>, imageWidth: number) {
  const out: Record<string, Pt> = {};
  for (const k in points) {
    const p = points[k];
    out[k] = { x: imageWidth - p.x, y: p.y };
  }
  return out;
}

export function ensureLeftSide(points: Record<string, Pt>, imageWidth: number) {
  return isRightSideView(points) ? mirrorToLeft(points, imageWidth) : points;
}

