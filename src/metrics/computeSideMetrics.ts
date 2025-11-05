import { ensureLeftSide, Pt } from "../utils/sideNormalization";
import { angleFromHorizontalDeg, normalizeToAcuteDeg,
         angleFromVerticalSignedDeg, jointAngleDeg } from "../utils/angles";

type Pts = Record<string, Pt>;

export interface SideOutput {
  CVA?: number;  // 0~90 (정상 ≥50)
  NIA?: number;  // 0~90 (정상 10~20)
  TIA?: number;  // ± (0~5 정상)
  SAA?: number;  // ± (0~10 정상, +전방/-후방)
  PTA?: number;  // +전방/-후방 (정상 +5~+15)
  KA?: number;   // 175~180 정상
  TBA?: number;  // ± (85~90 근처)
  BVA?: number;  // ±
  HPA?: number;  // ± (0~5 정상)
}

export function computeSideMetrics(raw: Pts, imageWidth: number): SideOutput {
  const p = ensureLeftSide(raw, imageWidth); // ← 오른옆이면 자동 미러링

  const need = (k: string) => {
    const v = p[k];
    if (!v) throw new Error(`missing keypoint: ${k}`);
    return v;
  };

  const tragus   = need("tragus");
  const c7       = need("c7");
  const acromion = need("acromion");
  const hip      = need("hip");
  const knee     = need("knee");
  const ankle    = need("ankle");
  const asis     = need("asis");
  const psis     = need("psis");

  // 1) CVA = C7 수평면 기준 각도 (0도 = C7 수평면)
  const cv_theta  = angleFromHorizontalDeg(c7, tragus);
  const cv_acute  = normalizeToAcuteDeg(cv_theta);
  const CVA       = Math.abs(cv_acute); // C7 수평면 기준 각도

  // 2) NIA = |(Acromion->Tragus 수평각의 예각)|
  const nia_theta = angleFromHorizontalDeg(acromion, tragus);
  const NIA       = Math.abs(normalizeToAcuteDeg(nia_theta));

  // 3) TIA = vertical signed (윗점=Acromion, +전방/-후방)
  const TIA       = angleFromVerticalSignedDeg(acromion, hip);

  // 4) SAA = PSIS 기준 수직선과 Acromion의 각도
  // 0° = Acromion과 PSIS가 같은 x축 (수직 정렬)
  // +각: Acromion이 PSIS보다 전방(앞)으로 이동 → Rounded Shoulder
  // -각: Acromion이 PSIS보다 후방(뒤)으로 이동 → 견갑 후인 과다
  const SAA = angleFromVerticalSignedDeg(acromion, psis); // 수직선 기준 각도

  // 5) PTA = 임상부호 (+전방/-후방)
  const pta_theta = angleFromHorizontalDeg(psis, asis);
  const pta_abs   = Math.abs(normalizeToAcuteDeg(pta_theta));
  const PTA       = (asis.y > psis.y) ? +pta_abs : -pta_abs;

  // 6) KA = ∠(Hip, Knee, Ankle)
  const KA        = jointAngleDeg(hip, knee, ankle);

  // 7) TBA = vertical signed (윗점=Knee)
  const TBA       = angleFromVerticalSignedDeg(knee, ankle);

  // 8) BVA = vertical signed (윗점=Tragus, 아랫점=Ankle)
  const BVA       = angleFromVerticalSignedDeg(tragus, ankle);

  // 9) HPA = vertical signed (윗점=Tragus, 아랫점=PSIS)
  const HPA       = angleFromVerticalSignedDeg(tragus, psis);

  return { CVA, NIA, TIA, SAA, PTA, KA, TBA, BVA, HPA };
}

