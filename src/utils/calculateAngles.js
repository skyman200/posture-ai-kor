// 각도 계산 함수 (정규화 좌표 0~1 사용)
// 원래 calcAngle.js 로직 사용
import { calcAngle, angleToVertical } from "./calcAngle";

export function calculateAngles(points) {
  const { ear, shoulder, hip, knee, ankle } = points;
  
  if (!(ear && shoulder && hip && knee && ankle)) {
    return { cva: 45, trunk: 7, knee: 165 };
  }

  // 1) Forward Head (CVA): 어깨→외이도 선의 수평 기준 각(°)
  // 원래 로직: 180 - calcAngle(수평 기준점, shoulder, ear)
  const forwardHead = 180 - calcAngle(
    { x: shoulder.x + 0.5, y: shoulder.y }, // 수평 기준점
    shoulder, 
    ear
  );

  // 2) Trunk Incline: 골반→어깨 선분이 수직(아래)과 이루는 각(°)
  // 원래 로직: angleToVertical(hip, shoulder) * sign
  const trunkRaw = angleToVertical(hip, shoulder);
  // 전방 기울기(어깨가 골반보다 앞= x 증가)면 +, 뒤면 -
  const sign = (shoulder.x - hip.x) >= 0 ? 1 : -1;
  const trunk = trunkRaw * sign;

  // 3) Knee Angle: 엉덩이–무릎–발목
  const kneeAngle = calcAngle(hip, knee, ankle);

  return {
    cva: Math.round(forwardHead * 10) / 10,
    trunk: Math.round(trunk * 10) / 10,
    knee: Math.round(kneeAngle * 10) / 10,
  };
}
