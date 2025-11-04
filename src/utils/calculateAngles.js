// 각도 계산 함수 (정규화 좌표 0~1 사용)
export function calculateAngles(points) {
  const { ear, shoulder, hip, knee, ankle } = points;
  
  if (!(ear && shoulder && hip && knee && ankle)) {
    return { cva: 45, trunk: 7, knee: 165 };
  }

  // CVA (Craniovertebral Angle) - 머리 전방 변위
  // 어깨에서 외이도까지의 각도 (수평 기준)
  const cva = calculateCVA(ear, shoulder);
  
  // Trunk Incline - 몸통 기울기
  // 골반에서 어깨까지의 각도 (수직 기준)
  const trunk = calculateTrunk(hip, shoulder);
  
  // Knee Angle - 무릎 각도
  // 엉덩이-무릎-발목 각도
  const kneeAngle = calculateKneeAngle(hip, knee, ankle);

  return {
    cva: Math.round(cva * 10) / 10,
    trunk: Math.round(trunk * 10) / 10,
    knee: Math.round(kneeAngle * 10) / 10,
  };
}

function calculateCVA(ear, shoulder) {
  // 어깨에서 외이도까지의 벡터
  const dx = ear.x - shoulder.x;
  const dy = ear.y - shoulder.y;
  // 수평선과의 각도 (atan2는 -180~180도 반환)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  // CVA는 180도에서 빼서 계산 (정상 >= 50도)
  return 180 - angle;
}

function calculateTrunk(hip, shoulder) {
  // 골반에서 어깨까지의 벡터
  const dx = shoulder.x - hip.x;
  const dy = shoulder.y - hip.y;
  // 수직선과의 각도 (atan2로 계산)
  const angle = Math.atan2(dx, dy) * (180 / Math.PI);
  // 전방 기울기면 양수, 후방 기울기면 음수
  return angle;
}

function calculateKneeAngle(hip, knee, ankle) {
  // 벡터 계산
  const v1 = { x: hip.x - knee.x, y: hip.y - knee.y };
  const v2 = { x: ankle.x - knee.x, y: ankle.y - knee.y };
  
  // 내적 계산
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  // 코사인 값 계산
  const cos = dot / (mag1 * mag2);
  const angle = Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
  
  return angle;
}
