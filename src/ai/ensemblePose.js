// src/ai/ensemblePose.js - 키포인트 융합 및 앙상블 처리

import { frontModels, ENSEMBLE_WEIGHTS } from './modelLoader.js';
import { normalizeToCOCO, mapCOCOToCustom } from './poseMapper.js';
import { ensureImageLoaded, validateKeypoint, filterValidCoordinate } from '../core/utils.js';

// 스무딩 버퍼
const smoothBuf = {};

/**
 * YOLO로 person detection 수행
 * @param {HTMLImageElement} img - 입력 이미지
 * @returns {Promise<Array>} person bounding box 배열
 */
async function detectYOLO(img) {
  if (!frontModels.yolo) {
    throw new Error("YOLO 모델이 로드되지 않았습니다.");
  }
  
  try {
    const detections = await frontModels.yolo.detect(img);
    const persons = detections.filter(d => d.class === 'person');
    
    if (persons.length === 0) {
      // person이 없으면 전체 이미지를 person으로 간주
      return [{
        bbox: [0, 0, img.width, img.height],
        score: 0.5
      }];
    }
    
    // 가장 높은 confidence의 person 반환
    return persons.sort((a, b) => b.score - a.score);
  } catch (err) {
    console.warn("⚠️ YOLO detection 실패:", err);
    // 폴백: 전체 이미지
    return [{
      bbox: [0, 0, img.width || 640, img.height || 480],
      score: 0.5
    }];
  }
}

/**
 * MoveNet으로 키포인트 추출
 * @param {HTMLImageElement} img - 입력 이미지
 * @returns {Promise<Object>} 키포인트 맵
 */
async function detectMove(img) {
  if (!frontModels.move) {
    throw new Error("MoveNet 모델이 로드되지 않았습니다.");
  }
  
  try {
    const poses = await frontModels.move.estimatePoses(img);
    
    if (poses.length === 0) {
      return {};
    }
    
    // 첫 번째 pose 사용
    const pose = poses[0];
    const keypoints = {};
    
    if (pose.keypoints && Array.isArray(pose.keypoints)) {
      pose.keypoints.forEach((kp, idx) => {
        if (kp && kp.x !== undefined && kp.y !== undefined) {
          keypoints[idx] = {
            x: kp.x / img.width, // 정규화
            y: kp.y / img.height,
            score: kp.score || kp.confidence || 0.5
          };
        }
      });
    }
    
    return keypoints;
  } catch (err) {
    console.warn("⚠️ MoveNet detection 실패:", err);
    return {};
  }
}

/**
 * PoseNet으로 키포인트 추출
 * @param {HTMLImageElement} img - 입력 이미지
 * @returns {Promise<Object>} 키포인트 맵
 */
async function detectPose(img) {
  if (!frontModels.pose) {
    throw new Error("PoseNet 모델이 로드되지 않았습니다.");
  }
  
  try {
    const poses = await frontModels.pose.estimatePoses(img);
    
    if (poses.length === 0) {
      return {};
    }
    
    // 첫 번째 pose 사용
    const pose = poses[0];
    const keypoints = {};
    
    if (pose.keypoints && Array.isArray(pose.keypoints)) {
      pose.keypoints.forEach(kp => {
        if (kp && kp.position) {
          const name = kp.part || kp.name;
          if (name) {
            keypoints[name] = {
              x: kp.position.x / img.width, // 정규화
              y: kp.position.y / img.height,
              score: kp.score || 0.5
            };
          }
        }
      });
    }
    
    return keypoints;
  } catch (err) {
    console.warn("⚠️ PoseNet detection 실패:", err);
    return {};
  }
}

/**
 * 3개 모델의 키포인트를 COCO 형식으로 정규화
 * @param {Object} yoloResult - YOLO 결과 (bbox만 사용)
 * @param {Object} moveResult - MoveNet 결과
 * @param {Object} poseResult - PoseNet 결과
 * @returns {Array} [yoloNormalized, moveNormalized, poseNormalized]
 */
function normalizeResults(yoloResult, moveResult, poseResult) {
  // YOLO는 bbox만 제공하므로 키포인트 없음
  const yoloNorm = {};
  
  // MoveNet 정규화
  const moveNorm = normalizeToCOCO(moveResult, 'movenet');
  
  // PoseNet 정규화
  const poseNorm = normalizeToCOCO(poseResult, 'posenet');
  
  return [yoloNorm, moveNorm, poseNorm];
}

/**
 * 3개 모델의 키포인트를 confidence weighted average로 융합
 * @param {Object} yoloNorm - YOLO 정규화 결과
 * @param {Object} moveNorm - MoveNet 정규화 결과
 * @param {Object} poseNorm - PoseNet 정규화 결과
 * @returns {Object} 융합된 키포인트 맵 (COCO 인덱스)
 */
export function fuse3Keypoints(yoloNorm, moveNorm, poseNorm) {
  const fused = {};
  const allKeys = new Set([
    ...Object.keys(yoloNorm),
    ...Object.keys(moveNorm),
    ...Object.keys(poseNorm)
  ]);
  
  allKeys.forEach(key => {
    const yolo = yoloNorm[key];
    const move = moveNorm[key];
    const pose = poseNorm[key];
    
    // 가중치 계산
    const wy = (yolo?.score || 0) * ENSEMBLE_WEIGHTS.yolo;
    const wm = (move?.score || 0) * ENSEMBLE_WEIGHTS.move;
    const wp = (pose?.score || 0) * ENSEMBLE_WEIGHTS.pose;
    
    const totalWeight = wy + wm + wp;
    
    if (totalWeight < 1e-6) return; // 가중치가 너무 작으면 스킵
    
    // 가중 평균 계산
    const x = ((yolo?.x || 0) * wy + (move?.x || 0) * wm + (pose?.x || 0) * wp) / totalWeight;
    const y = ((yolo?.y || 0) * wy + (move?.y || 0) * wm + (pose?.y || 0) * wp) / totalWeight;
    const score = Math.max(yolo?.score || 0, move?.score || 0, pose?.score || 0);
    
    fused[key] = { x, y, score };
  });
  
  return fused;
}

/**
 * 정면 이미지에 대해 앙상블 분석 수행
 * @param {HTMLImageElement} img - 입력 이미지
 * @returns {Promise<Object>} 커스텀 키포인트 맵
 */
export async function runFrontAnalysis(img) {
  // 이미지 로드 확인
  await ensureImageLoaded(img);
  
  const imgWidth = img.naturalWidth || img.width;
  const imgHeight = img.naturalHeight || img.height;
  
  // YOLO로 person detection
  const yoloDetections = await detectYOLO(img);
  const personBbox = yoloDetections[0]?.bbox || [0, 0, imgWidth, imgHeight];
  
  // 이미지 크롭 (person 영역만 사용, 선택적)
  // 여기서는 전체 이미지 사용
  
  // 3개 모델로 키포인트 추출
  const [moveResult, poseResult] = await Promise.all([
    detectMove(img),
    detectPose(img)
  ]);
  
  // 정규화
  const [yoloNorm, moveNorm, poseNorm] = normalizeResults(
    {}, // YOLO는 키포인트 없음
    moveResult,
    poseResult
  );
  
  // 융합
  const fusedCOCO = fuse3Keypoints(yoloNorm, moveNorm, poseNorm);
  
  // COCO → 커스텀 키 매핑
  const customKeypoints = mapCOCOToCustom(fusedCOCO, imgWidth, imgHeight);
  
  // 스무딩 적용
  const smoothed = applySmoothing(customKeypoints);
  
  // 좌표 검증
  const validated = validateKeypoints(smoothed, imgWidth, imgHeight);
  
  return validated;
}

/**
 * 키포인트 스무딩 적용
 * @param {Object} keypoints - 키포인트 맵
 * @returns {Object} 스무딩된 키포인트 맵
 */
function applySmoothing(keypoints) {
  const smoothed = {};
  const alpha = 0.6; // 현재 프레임 가중치
  
  Object.entries(keypoints).forEach(([key, point]) => {
    if (!point) return;
    
    if (!smoothBuf[key]) {
      smoothBuf[key] = { ...point };
    } else {
      smoothBuf[key] = {
        x: alpha * point.x + (1 - alpha) * smoothBuf[key].x,
        y: alpha * point.y + (1 - alpha) * smoothBuf[key].y,
        score: Math.max(point.score, smoothBuf[key].score)
      };
    }
    
    smoothed[key] = smoothBuf[key];
  });
  
  return smoothed;
}

/**
 * 키포인트 검증 및 필터링
 * @param {Object} keypoints - 키포인트 맵
 * @param {number} imgWidth - 이미지 너비
 * @param {number} imgHeight - 이미지 높이
 * @returns {Object} 검증된 키포인트 맵
 */
function validateKeypoints(keypoints, imgWidth, imgHeight) {
  const validated = {};
  
  Object.entries(keypoints).forEach(([key, point]) => {
    const valid = validateKeypoint(point, imgWidth, imgHeight);
    if (valid) {
      validated[key] = valid;
    }
  });
  
  return validated;
}

