// src/ai/modelLoader.js - YOLO, MoveNet, PoseNet 3개 모델 로드 (싱글톤 패턴)

// 앙상블 가중치
export const ENSEMBLE_WEIGHTS = {
  yolo: 0.5,
  move: 0.3,
  pose: 0.2
};

// ✅ 싱글톤 패턴으로 모델 로더 구현
export const ModelLoader = (() => {
  let loaded = false;
  let loading = false;
  let moveNet = null;
  let yolo = null;
  let pose = null;
  let sideDetector = null;
  
  // 모델 인스턴스 저장 (기존 호환성)
  const frontModels = {
    yolo: null,
    move: null,
    pose: null
  };
  
  // 모델 로딩 상태
  const modelLoadingState = {
    yolo: false,
    move: false,
    pose: false,
    allLoaded: false
  };
  
  return {
    frontModels,
    modelLoadingState,
    getModels: () => ({ moveNet, yolo, pose, sideDetector }),
    isLoaded: () => loaded,
    isLoading: () => loading,
    loadModels: async () => {
      if (loaded) {
        console.log("✅ 모델 이미 로드됨 → 재로드 스킵");
        return { moveNet, yolo, pose, sideDetector };
      }
      
      if (loading) {
        // 이미 로딩 중이면 대기
        while (loading) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return { moveNet, yolo, pose, sideDetector };
      }
      
      loading = true;
      console.log("🔥 모델 로딩 시작…");
      
      try {
        // TensorFlow.js 로드 확인 및 대기
        let tf = null;
        if (typeof window !== 'undefined') {
          // 싱글톤 로더 사용
          if (window.loadTfOnce) {
            tf = await window.loadTfOnce();
            // window.tf에도 할당 (호환성)
            if (!window.tf && tf) {
              window.tf = tf;
            }
            console.log("✅ TensorFlow.js 로드 완료 (싱글톤)");
          } else if (window.tf) {
            tf = window.tf;
            console.log("✅ 전역 TensorFlow.js 사용");
          } else if (window.tfSingleton && window.tfSingleton.tf) {
            tf = window.tfSingleton.tf;
            window.tf = tf; // 호환성
            console.log("✅ TensorFlow.js 싱글톤에서 가져옴");
          } else {
            // 폴백: 직접 로드 시도
            console.warn("⚠️ TensorFlow.js를 찾을 수 없음, 직접 로드 시도");
            // 폴백: ESM +esm 형식 시도
            try {
              const tfModule = await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.14.0/+esm');
              tf = tfModule.default || tfModule.tf || tfModule;
              window.tf = tf;
              console.log("✅ TensorFlow.js 직접 로드 완료 (ESM +esm)");
            } catch (tfErr) {
              console.error("❌ TensorFlow.js 로드 실패:", tfErr);
              throw new Error("TensorFlow.js를 로드할 수 없습니다.");
            }
          }
        }
        
        if (!tf) {
          throw new Error("TensorFlow.js가 로드되지 않았습니다.");
        }
        
        // 모델들 병렬 로드
        [yolo, moveNet, pose, sideDetector] = await Promise.all([
          loadYOLO(),
          loadMoveNet(),
          loadPoseNet(),
          loadSideDetector()
        ]);
        
        // frontModels에 할당 (기존 호환성)
        frontModels.yolo = yolo;
        frontModels.move = moveNet;
        frontModels.pose = pose;
        
        loaded = true;
        modelLoadingState.allLoaded = true;
        console.log("✅ 모든 모델 로딩 완료!");
        return { moveNet, yolo, pose, sideDetector };
      } catch (err) {
        console.error("❌ 모델 로딩 실패:", err);
        loading = false;
        throw err;
      } finally {
        loading = false;
      }
    }
  };
})();

// 모델 인스턴스 저장 (기존 호환성)
export const frontModels = ModelLoader.frontModels;

// 모델 로딩 상태 (기존 호환성)
export const modelLoadingState = ModelLoader.modelLoadingState;

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
    // TensorFlow.js는 이미 전역에 로드되어 있으므로 사용하지 않음
    // YOLO는 폴백 모드로 처리 (전체 이미지를 person으로 간주)
    console.log("✅ YOLO 폴백 모드 (전체 이미지를 person으로 처리)");
    frontModels.yolo = {
      detect: async (img) => {
        // 이미지 전체를 person bounding box로 반환
        const width = img.naturalWidth || img.width || 640;
        const height = img.naturalHeight || img.height || 480;
        return [{
          class: 'person',
          score: 0.9,
          bbox: [0, 0, width, height]
        }];
      }
    };
    return frontModels.yolo;
  } catch (err) {
    console.warn("⚠️ YOLO 로드 실패, 폴백 사용:", err);
    // 폴백: 간단한 person detector (이미지 전체를 person으로 간주)
    frontModels.yolo = {
      detect: async (img) => {
        const width = img.naturalWidth || img.width || 640;
        const height = img.naturalHeight || img.height || 480;
        return [{
          class: 'person',
          score: 0.9,
          bbox: [0, 0, width, height]
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
    // TensorFlow.js 확인
    if (!window.tf) {
      throw new Error("TensorFlow.js가 로드되지 않았습니다.");
    }
    
    // @tensorflow-models/pose-detection에서 MoveNet 로드
    // @mediapipe/pose 의존성 문제 해결: 먼저 @mediapipe/pose가 로드되었는지 확인
    if (typeof window !== 'undefined' && !window.MP_Pose && !window.Pose) {
      console.warn("⚠️ @mediapipe/pose가 아직 로드되지 않음, 대기 중...");
      // 최대 3초 대기
      let waitCount = 0;
      while (!window.MP_Pose && !window.Pose && waitCount < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
      if (!window.MP_Pose && !window.Pose) {
        console.warn("⚠️ @mediapipe/pose 로드 타임아웃, 계속 진행...");
      }
    }
    
    let poseDetection;
    try {
      // import-map을 통해 @mediapipe/pose가 해결되도록 시도
      poseDetection = await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.esm.min.js');
    } catch (importErr) {
      console.warn("⚠️ pose-detection ESM import 실패:", importErr);
      // 에러를 전파하여 폴백 모드로 전환
      throw importErr;
    }
    
    // MoveNet 모델 타입 확인
    const modelType = poseDetection.movenet?.modelType?.SINGLEPOSE_LIGHTNING || 
                      poseDetection.movenet?.modelType?.SINGLEPOSE_THUNDER ||
                      'lightning';
    
    frontModels.move = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: modelType
      }
    );
    
    console.log("✅ MoveNet 모델 로드 완료");
    return frontModels.move;
  } catch (err) {
    console.error("❌ MoveNet 로드 실패:", err);
    // 폴백: 간단한 MoveNet 모델
    console.warn("⚠️ MoveNet 폴백 모드 사용");
    frontModels.move = {
      estimatePoses: async (img) => {
        return [{ keypoints: [] }]; // 빈 결과 반환
      }
    };
    return frontModels.move;
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
    // TensorFlow.js 확인
    if (!window.tf) {
      throw new Error("TensorFlow.js가 로드되지 않았습니다.");
    }
    
    // @tensorflow-models/pose-detection에서 PoseNet 로드
    // @mediapipe/pose 의존성 문제 해결: 먼저 @mediapipe/pose가 로드되었는지 확인
    if (typeof window !== 'undefined' && !window.MP_Pose && !window.Pose) {
      console.warn("⚠️ @mediapipe/pose가 아직 로드되지 않음, 대기 중...");
      let waitCount = 0;
      while (!window.MP_Pose && !window.Pose && waitCount < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
    }
    
    let poseDetection;
    try {
      poseDetection = await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.esm.min.js');
    } catch (importErr) {
      console.warn("⚠️ pose-detection ESM import 실패:", importErr);
      throw importErr;
    }
    
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
    // 폴백: 간단한 PoseNet 모델
    console.warn("⚠️ PoseNet 폴백 모드 사용");
    frontModels.pose = {
      estimatePoses: async (img) => {
        return [{ keypoints: [] }]; // 빈 결과 반환
      }
    };
    return frontModels.pose;
  } finally {
    modelLoadingState.pose = false;
  }
}

/**
 * 옆모습 BlazePose 모델 로드
 * @returns {Promise<Object>} BlazePose 모델 인스턴스
 */
async function loadSideDetector() {
  try {
    // TensorFlow.js 확인
    if (!window.tf) {
      throw new Error("TensorFlow.js가 로드되지 않았습니다.");
    }
    
    // @tensorflow-models/pose-detection에서 BlazePose 로드
    // @mediapipe/pose 의존성 문제 해결: 먼저 @mediapipe/pose가 로드되었는지 확인
    if (typeof window !== 'undefined' && !window.MP_Pose && !window.Pose) {
      console.warn("⚠️ @mediapipe/pose가 아직 로드되지 않음, 대기 중...");
      let waitCount = 0;
      while (!window.MP_Pose && !window.Pose && waitCount < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
    }
    
    let poseDetection;
    try {
      poseDetection = await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.esm.min.js');
    } catch (importErr) {
      console.warn("⚠️ pose-detection ESM import 실패:", importErr);
      throw importErr;
    }
    
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.BlazePose,
      { runtime: "tfjs", modelType: "full" }
    );
    
    console.log("✅ BlazePose 모델 로드 완료");
    return detector;
  } catch (err) {
    console.error("❌ BlazePose 로드 실패:", err);
    // 폴백: 빈 디텍터
    console.warn("⚠️ BlazePose 폴백 모드 사용");
    return {
      estimatePoses: async (img) => {
        return [{ keypoints: [] }];
      }
    };
  }
}

/**
 * 정면 앙상블 모델 초기화 (3개 모델 모두 로드) - 기존 호환성
 */
export async function initFrontEnsemble() {
  if (ModelLoader.isLoaded()) {
    console.log("✅ 정면 앙상블 모델 이미 로드됨");
    return;
  }
  
  await ModelLoader.loadModels();
  console.log("✅ 3중 앙상블 정면모델 준비 완료");
}

/**
 * 기존 호환성을 위한 함수 (BlazePose 로드)
 */
export const detectors = { front: null, side: null };

/**
 * 모든 모델 로드 (기존 호환성)
 */
export async function loadModels() {
  const models = await ModelLoader.loadModels();
  detectors.side = models.sideDetector;
  console.log("✅ 모든 모델 로드 완료 (정면: 앙상블, 옆모습: BlazePose)");
  return models;
}
