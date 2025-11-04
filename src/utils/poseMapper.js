// MediaPipe Tasks 결과 landmarks 배열을 5포인트로 매핑
// MediaPipe Pose landmarks 인덱스:
// 7: left_ear, 8: right_ear
// 11: left_shoulder, 12: right_shoulder
// 23: left_hip, 24: right_hip
// 25: left_knee, 26: right_knee
// 27: left_ankle, 28: right_ankle
export const mapPosePoints = (landmarks = []) => {
  if (!Array.isArray(landmarks) || landmarks.length === 0) {
    return { ear: null, shoulder: null, hip: null, knee: null, ankle: null };
  }

  const lm01 = (v) => Math.min(1, Math.max(0, v));
  
  // 인덱스로 landmark 가져오기 (없으면 null)
  const getLm = (idx) => {
    if (idx < landmarks.length && landmarks[idx]) {
      const lm = landmarks[idx];
      if (typeof lm.x === "number" && typeof lm.y === "number") {
        return { x: lm01(lm.x), y: lm01(lm.y) };
      }
    }
    return null;
  };

  // 왼쪽/오른쪽 중 하나 선택 (옆모습이므로 한쪽만 보임)
  const pickSide = (leftIdx, rightIdx) => {
    const left = getLm(leftIdx);
    const right = getLm(rightIdx);
    // 왼쪽이 있으면 왼쪽, 없으면 오른쪽
    return left || right;
  };

  return {
    ear:     pickSide(7, 8),      // left_ear or right_ear
    shoulder: pickSide(11, 12),    // left_shoulder or right_shoulder
    hip:     pickSide(23, 24),     // left_hip or right_hip
    knee:    pickSide(25, 26),     // left_knee or right_knee
    ankle:   pickSide(27, 28),     // left_ankle or right_ankle
  };
};

