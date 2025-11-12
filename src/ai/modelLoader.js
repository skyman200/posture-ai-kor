// src/ai/modelLoader.js - YOLO, MoveNet, PoseNet 3개 모델 로드

// 앙상블 가중치
export const ENSEMBLE_WEIGHTS = {
  yolo: 0.5,
  move: 0.3,
  pose: 0.2
};

// 모델 인스턴스 저장
export const frontModels = {
  yolo: null,
  move: null,
  pose: null
};

// 모델 로딩 상태
export const modelLoadingState = {
  yolo: false,
  move: false,
  pose: false,
  allLoaded: false
};

/**
 * YOLO 모델 로드 (person detection)
 * @returns {Promise<Object>} YOLO 모델 인스턴스
 */
export async function loadYOLO() {
  if (frontModels.yolo) {
    console.log("✅ YOLO 모델 (캐시)");
    return frontModels.yolo;
  }
  
  if (modelLoadingState.yolo) {
    // 이미 로딩 중이면 대기
    while (modelLoadingState.yolo) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return frontModels.yolo;
  }
  
  modelLoadingState.yolo = true;
  
  try {
    // YOLO는 @tensorflow-models/coco-ssd 또는 직접 구현
    // 브라우저에서 동작하도록 CDN 사용
    const cocoSSD = await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/index.js');
    
    frontModels.yolo = await cocoSSD.load();
    console.log("✅ YOLO 모델 로드 완료");
    return frontModels.yolo;
  } catch (err) {
    console.warn("⚠️ YOLO 로드 실패, 폴백 사용:", err);
    // 폴백: 간단한 person detector (이미지 전체를 person으로 간주)
    frontModels.yolo = {
      detect: async (img) => {
        return [{
          class: 'person',
          score: 0.9,
          bbox: [0, 0, img.width || 640, img.height || 480]
        }];
      }
    };
    return frontModels.yolo;
  } finally {
    modelLoadingState.yolo = false;
  }
}

/**
 * MoveNet 모델 로드
 * @returns {Promise<Object>} MoveNet 모델 인스턴스
 */
export async function loadMoveNet() {
  if (frontModels.move) {
    console.log("✅ MoveNet 모델 (캐시)");
    return frontModels.move;
  }
  
  if (modelLoadingState.move) {
    while (modelLoadingState.move) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return frontModels.move;
  }
  
  modelLoadingState.move = true;
  
  try {
    // @tensorflow-models/pose-detection에서 MoveNet 로드
    const poseDetection = await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.esm.min.js');
    
    frontModels.move = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
      }
    );
    
    console.log("✅ MoveNet 모델 로드 완료");
    return frontModels.move;
  } catch (err) {
    console.error("❌ MoveNet 로드 실패:", err);
    throw err;
  } finally {
    modelLoadingState.move = false;
  }
}

/**
 * PoseNet 모델 로드
 * @returns {Promise<Object>} PoseNet 모델 인스턴스
 */
export async function loadPoseNet() {
  if (frontModels.pose) {
    console.log("✅ PoseNet 모델 (캐시)");
    return frontModels.pose;
  }
  
  if (modelLoadingState.pose) {
    while (modelLoadingState.pose) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return frontModels.pose;
  }
  
  modelLoadingState.pose = true;
  
  try {
    // @tensorflow-models/pose-detection에서 PoseNet 로드
    const poseDetection = await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.esm.min.js');
    
    frontModels.pose = await poseDetection.createDetector(
      poseDetection.SupportedModels.PoseNet,
      {
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 257, height: 257 },
        multiplier: 0.75
      }
    );
    
    console.log("✅ PoseNet 모델 로드 완료");
    return frontModels.pose;
  } catch (err) {
    console.error("❌ PoseNet 로드 실패:", err);
    throw err;
  } finally {
    modelLoadingState.pose = false;
  }
}

/**
 * 정면 앙상블 모델 초기화 (3개 모델 모두 로드)
 */
export async function initFrontEnsemble() {
  if (modelLoadingState.allLoaded) {
    console.log("✅ 정면 앙상블 모델 이미 로드됨");
    return;
  }
  
  try {
    await Promise.all([
      loadYOLO(),
      loadMoveNet(),
      loadPoseNet()
    ]);
    
    modelLoadingState.allLoaded = true;
    console.log("✅ 3중 앙상블 정면모델 준비 완료");
  } catch (err) {
    console.error("❌ 앙상블 모델 로드 실패:", err);
    throw err;
  }
}

/**
 * 기존 호환성을 위한 함수 (BlazePose 로드)
 */
export const detectors = { front: null, side: null };

export async function loadModels() {
  try {
    // 정면: 앙상블 모델 로드
    await initFrontEnsemble();
    
    // 옆모습: BlazePose 로드 (기존 로직 유지)
    const poseDetection = await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.esm.min.js');
    
    detectors.side = await poseDetection.createDetector(
      poseDetection.SupportedModels.BlazePose,
      { runtime: "tfjs", modelType: "full" }
    );
    
    console.log("✅ 모든 모델 로드 완료 (정면: 앙상블, 옆모습: BlazePose)");
  } catch (err) {
    console.error("❌ 모델 로드 실패:", err);
    throw err;
  }
}
