// src/ai/poseMapper.js - COCO → 커스텀 키 매핑

/**
 * COCO 키포인트 인덱스 정의
 */
export const COCO_KEYPOINTS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16
};

/**
 * MoveNet/PoseNet 키포인트 이름을 COCO 인덱스로 변환
 * @param {Object} keypoints - 모델에서 반환한 키포인트
 * @param {string} modelType - 'movenet' | 'posenet'
 * @returns {Object} COCO 인덱스를 키로 하는 키포인트 맵
 */
export function normalizeToCOCO(keypoints, modelType = 'movenet') {
  const cocoMap = {};
  
  if (modelType === 'movenet') {
    // MoveNet은 COCO 형식과 유사
    const moveNetMap = {
      0: 'nose',
      1: 'left_eye',
      2: 'right_eye',
      3: 'left_ear',
      4: 'right_ear',
      5: 'left_shoulder',
      6: 'right_shoulder',
      7: 'left_elbow',
      8: 'right_elbow',
      9: 'left_wrist',
      10: 'right_wrist',
      11: 'left_hip',
      12: 'right_hip',
      13: 'left_knee',
      14: 'right_knee',
      15: 'left_ankle',
      16: 'right_ankle'
    };
    
    if (Array.isArray(keypoints)) {
      keypoints.forEach((kp, idx) => {
        const name = moveNetMap[idx];
        if (name && kp) {
          cocoMap[COCO_KEYPOINTS[name.toUpperCase().replace(/-/g, '_')]] = {
            x: kp.x || kp.x || 0,
            y: kp.y || kp.y || 0,
            score: kp.score || kp.confidence || 0.5
          };
        }
      });
    }
  } else if (modelType === 'posenet') {
    // PoseNet은 이름 기반
    const poseNetNames = {
      'nose': COCO_KEYPOINTS.NOSE,
      'leftEye': COCO_KEYPOINTS.LEFT_EYE,
      'rightEye': COCO_KEYPOINTS.RIGHT_EYE,
      'leftEar': COCO_KEYPOINTS.LEFT_EAR,
      'rightEar': COCO_KEYPOINTS.RIGHT_EAR,
      'leftShoulder': COCO_KEYPOINTS.LEFT_SHOULDER,
      'rightShoulder': COCO_KEYPOINTS.RIGHT_SHOULDER,
      'leftElbow': COCO_KEYPOINTS.LEFT_ELBOW,
      'rightElbow': COCO_KEYPOINTS.RIGHT_ELBOW,
      'leftWrist': COCO_KEYPOINTS.LEFT_WRIST,
      'rightWrist': COCO_KEYPOINTS.RIGHT_WRIST,
      'leftHip': COCO_KEYPOINTS.LEFT_HIP,
      'rightHip': COCO_KEYPOINTS.RIGHT_HIP,
      'leftKnee': COCO_KEYPOINTS.LEFT_KNEE,
      'rightKnee': COCO_KEYPOINTS.RIGHT_KNEE,
      'leftAnkle': COCO_KEYPOINTS.LEFT_ANKLE,
      'rightAnkle': COCO_KEYPOINTS.RIGHT_ANKLE
    };
    
    if (Array.isArray(keypoints)) {
      keypoints.forEach(kp => {
        if (kp.part && poseNetNames[kp.part]) {
          const idx = poseNetNames[kp.part];
          cocoMap[idx] = {
            x: kp.position.x,
            y: kp.position.y,
            score: kp.score || 0.5
          };
        }
      });
    }
  }
  
  return cocoMap;
}

/**
 * COCO 인덱스를 커스텀 키로 매핑
 * @param {Object} cocoKeypoints - COCO 인덱스를 키로 하는 키포인트 맵
 * @param {number} imgWidth - 이미지 너비
 * @param {number} imgHeight - 이미지 높이
 * @returns {Object} 커스텀 키를 가진 키포인트 맵
 */
export function mapCOCOToCustom(cocoKeypoints, imgWidth, imgHeight) {
  const custom = {};
  
  // 직접 매핑
  const get = (idx) => cocoKeypoints[idx] || null;
  
  // 어깨
  const leftShoulder = get(COCO_KEYPOINTS.LEFT_SHOULDER);
  const rightShoulder = get(COCO_KEYPOINTS.RIGHT_SHOULDER);
  
  if (leftShoulder) {
    custom.L_acromion = {
      x: leftShoulder.x * (imgWidth || 1),
      y: leftShoulder.y * (imgHeight || 1),
      score: leftShoulder.score
    };
  }
  
  if (rightShoulder) {
    custom.R_acromion = {
      x: rightShoulder.x * (imgWidth || 1),
      y: rightShoulder.y * (imgHeight || 1),
      score: rightShoulder.score
    };
  }
  
  // 골반 (ASIS)
  const leftHip = get(COCO_KEYPOINTS.LEFT_HIP);
  const rightHip = get(COCO_KEYPOINTS.RIGHT_HIP);
  
  if (leftHip) {
    custom.L_asis = {
      x: leftHip.x * (imgWidth || 1),
      y: leftHip.y * (imgHeight || 1),
      score: leftHip.score
    };
  }
  
  if (rightHip) {
    custom.R_asis = {
      x: rightHip.x * (imgWidth || 1),
      y: rightHip.y * (imgHeight || 1),
      score: rightHip.score
    };
  }
  
  // 무릎
  const leftKnee = get(COCO_KEYPOINTS.LEFT_KNEE);
  const rightKnee = get(COCO_KEYPOINTS.RIGHT_KNEE);
  
  if (leftKnee) {
    custom.L_knee = {
      x: leftKnee.x * (imgWidth || 1),
      y: leftKnee.y * (imgHeight || 1),
      score: leftKnee.score
    };
  }
  
  if (rightKnee) {
    custom.R_knee = {
      x: rightKnee.x * (imgWidth || 1),
      y: rightKnee.y * (imgHeight || 1),
      score: rightKnee.score
    };
  }
  
  // 발목
  const leftAnkle = get(COCO_KEYPOINTS.LEFT_ANKLE);
  const rightAnkle = get(COCO_KEYPOINTS.RIGHT_ANKLE);
  
  if (leftAnkle) {
    custom.L_ankle = {
      x: leftAnkle.x * (imgWidth || 1),
      y: leftAnkle.y * (imgHeight || 1),
      score: leftAnkle.score
    };
  }
  
  if (rightAnkle) {
    custom.R_ankle = {
      x: rightAnkle.x * (imgWidth || 1),
      y: rightAnkle.y * (imgHeight || 1),
      score: rightAnkle.score
    };
  }
  
  // C7 (두 어깨 중점 위)
  if (leftShoulder && rightShoulder) {
    custom.c7 = {
      x: ((leftShoulder.x + rightShoulder.x) / 2) * (imgWidth || 1),
      y: (Math.min(leftShoulder.y, rightShoulder.y) - 0.05) * (imgHeight || 1),
      score: Math.min(leftShoulder.score, rightShoulder.score) * 0.9
    };
  }
  
  // Fallback 생성 (누락된 키포인트 보간)
  if (custom.L_acromion && !custom.L_asis) {
    custom.L_asis = {
      x: custom.L_acromion.x,
      y: custom.L_acromion.y + (imgHeight || 480) * 0.25,
      score: 0.7
    };
  }
  
  if (custom.R_acromion && !custom.R_asis) {
    custom.R_asis = {
      x: custom.R_acromion.x,
      y: custom.R_acromion.y + (imgHeight || 480) * 0.25,
      score: 0.7
    };
  }
  
  if (custom.L_asis && !custom.L_knee) {
    custom.L_knee = {
      x: custom.L_asis.x,
      y: custom.L_asis.y + (imgHeight || 480) * 0.30,
      score: 0.7
    };
  }
  
  if (custom.R_asis && !custom.R_knee) {
    custom.R_knee = {
      x: custom.R_asis.x,
      y: custom.R_asis.y + (imgHeight || 480) * 0.30,
      score: 0.7
    };
  }
  
  if (custom.L_knee && !custom.L_ankle) {
    custom.L_ankle = {
      x: custom.L_knee.x,
      y: custom.L_knee.y + (imgHeight || 480) * 0.22,
      score: 0.7
    };
  }
  
  if (custom.R_knee && !custom.R_ankle) {
    custom.R_ankle = {
      x: custom.R_knee.x,
      y: custom.R_knee.y + (imgHeight || 480) * 0.22,
      score: 0.7
    };
  }
  
  // 특수 포인트: 슬개골 (patella)
  if (custom.L_knee) {
    custom.L_patella = {
      x: custom.L_knee.x,
      y: custom.L_knee.y - (imgHeight || 480) * 0.04,
      score: 0.8
    };
  }
  
  if (custom.R_knee) {
    custom.R_patella = {
      x: custom.R_knee.x,
      y: custom.R_knee.y - (imgHeight || 480) * 0.04,
      score: 0.8
    };
  }
  
  // 경골 결절 (tibial tuberosity)
  if (custom.L_knee && custom.L_ankle) {
    const kneeAnkleDist = custom.L_ankle.y - custom.L_knee.y;
    custom.L_tibial_tub = {
      x: custom.L_knee.x,
      y: custom.L_knee.y + kneeAnkleDist * 0.12,
      score: 0.8
    };
  }
  
  if (custom.R_knee && custom.R_ankle) {
    const kneeAnkleDist = custom.R_ankle.y - custom.R_knee.y;
    custom.R_tibial_tub = {
      x: custom.R_knee.x,
      y: custom.R_knee.y + kneeAnkleDist * 0.12,
      score: 0.8
    };
  }
  
  return custom;
}

