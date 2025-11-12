true&&(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
}());

// 전역 변수 보호: 기존 sessions가 있으면 재사용, 없으면 새로 생성
const createSessions = () => ({
  Before: { 
    imgSide: null, 
    imgFront: null, 
    sidePoints: new Map(),
    frontPoints: new Map(),
    metrics: {}, 
    score: null, 
    analysis: null,
    poseData: null
  },
  After: { 
    imgSide: null, 
    imgFront: null, 
    sidePoints: new Map(),
    frontPoints: new Map(),
    metrics: {}, 
    score: null, 
    analysis: null,
    poseData: null
  }
});

// 전역 보호: window.sessions가 이미 있으면 재사용
const sessions = (typeof window !== 'undefined' && window.sessions && 
                        window.sessions.Before && window.sessions.After) 
  ? window.sessions 
  : createSessions();

// sessions를 window에 명시적으로 할당 (전역 접근 가능하도록)
if(typeof window !== 'undefined') {
  if (!window.sessions || !window.sessions.Before || !window.sessions.After) {
    window.sessions = sessions;
    console.log("✅ sessions 객체가 window.sessions에 할당되었습니다.", { 
      hasBefore: !!window.sessions.Before, 
      hasAfter: !!window.sessions.After 
    });
  } else {
    console.log("✅ 기존 window.sessions 재사용");
  }
}

// src/core/utils.js - 이미지 로드/NaN 방어 및 유틸리티 함수

/**
 * 이미지가 완전히 로드되었는지 확인
 * @param {HTMLImageElement} img - 확인할 이미지
 * @returns {Promise<HTMLImageElement>}
 */
async function ensureImageLoaded(img) {
  if (!img) {
    throw new Error("이미지가 제공되지 않았습니다.");
  }
  
  if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
    return img;
  }
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img);
      } else {
        reject(new Error("이미지 로드 실패: 유효하지 않은 크기"));
      }
    };
    img.onerror = () => {
      reject(new Error("이미지 로드 실패"));
    };
    
    // 이미 로드 중이면 이벤트 리스너만 추가
    if (img.src && !img.complete) {
      // 이미지가 로딩 중이면 onload를 기다림
      return;
    }
    
    // 이미 완료되었지만 크기가 0이면 에러
    reject(new Error("이미지 크기가 0입니다"));
  });
}

/**
 * NaN/Infinity 좌표 필터링
 * @param {number} value - 검사할 값
 * @param {number} maxValue - 최대값 (기본값: 10000)
 * @returns {number|null} - 유효한 값 또는 null
 */
function filterValidCoordinate(value, maxValue = 10000) {
  if (typeof value !== 'number') return null;
  if (Number.isNaN(value) || !Number.isFinite(value)) return null;
  if (value < 0 || value > maxValue) return null;
  return value;
}

/**
 * 키포인트 객체의 좌표 검증 및 필터링
 * @param {Object} point - {x, y, score?} 형태의 키포인트
 * @param {number} imgWidth - 이미지 너비
 * @param {number} imgHeight - 이미지 높이
 * @returns {Object|null} - 검증된 키포인트 또는 null
 */
function validateKeypoint(point, imgWidth, imgHeight) {
  if (!point || typeof point !== 'object') return null;
  
  const x = filterValidCoordinate(point.x, imgWidth);
  const y = filterValidCoordinate(point.y, imgHeight);
  
  if (x === null || y === null) return null;
  
  return {
    x,
    y,
    score: typeof point.score === 'number' && !Number.isNaN(point.score) 
      ? Math.max(0, Math.min(1, point.score)) 
      : 0.5
  };
}

const scriptRel = 'modulepreload';const assetsURL = function(dep) { return "/posture-ai-kor/"+dep };const seen = {};const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (true && deps && deps.length > 0) {
    document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector(
      "meta[property=csp-nonce]"
    );
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = Promise.allSettled(
      deps.map((dep) => {
        dep = assetsURL(dep);
        if (dep in seen) return;
        seen[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link = document.createElement("link");
        link.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link.as = "script";
        }
        link.crossOrigin = "";
        link.href = dep;
        if (cspNonce) {
          link.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link);
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener("load", res);
            link.addEventListener(
              "error",
              () => rej(new Error(`Unable to preload CSS for ${dep}`))
            );
          });
        }
      })
    );
  }
  function handlePreloadError(err) {
    const e = new Event("vite:preloadError", {
      cancelable: true
    });
    e.payload = err;
    window.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw err;
    }
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};

// 앙상블 가중치
const ENSEMBLE_WEIGHTS = {
  yolo: 0.5,
  move: 0.3,
  pose: 0.2
};

// ✅ 싱글톤 패턴으로 모델 로더 구현
const ModelLoader = (() => {
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
        // TensorFlow.js는 이미 전역에 로드되어 있으므로 사용
        // 동적 import 대신 전역 tf 사용
        if (typeof window !== 'undefined' && window.tf) {
          console.log("✅ 전역 TensorFlow.js 사용");
        } else {
          console.warn("⚠️ 전역 TensorFlow.js를 찾을 수 없음, 동적 import 시도");
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
const frontModels = ModelLoader.frontModels;

// 모델 로딩 상태 (기존 호환성)
const modelLoadingState = ModelLoader.modelLoadingState;

/**
 * YOLO 모델 로드 (person detection)
 * @returns {Promise<Object>} YOLO 모델 인스턴스
 */
async function loadYOLO() {
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
async function loadMoveNet() {
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
    const poseDetection = await __vitePreload(() => import('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.esm.min.js'),true?[]:void 0);
    
    // MoveNet 모델 타입 확인
    const modelType = poseDetection.movenet?.modelType?.SINGLEPOSE_LIGHTNING || 'lightning';
    
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
        return []; // 빈 결과 반환
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
async function loadPoseNet() {
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
    const poseDetection = await __vitePreload(() => import('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.esm.min.js'),true?[]:void 0);
    
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
        return []; // 빈 결과 반환
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
    // @tensorflow-models/pose-detection에서 BlazePose 로드
    const poseDetection = await __vitePreload(() => import('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.esm.min.js'),true?[]:void 0);
    
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.BlazePose,
      { runtime: "tfjs", modelType: "full" }
    );
    
    console.log("✅ BlazePose 모델 로드 완료");
    return detector;
  } catch (err) {
    console.error("❌ BlazePose 로드 실패:", err);
    // 폴백: 빈 디텍터
    return {
      estimatePoses: async (img) => {
        return [];
      }
    };
  }
}

// src/ai/poseMapper.js - COCO → 커스텀 키 매핑

/**
 * COCO 키포인트 인덱스 정의
 */
const COCO_KEYPOINTS = {
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
function normalizeToCOCO(keypoints, modelType = 'movenet') {
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
function mapCOCOToCustom(cocoKeypoints, imgWidth, imgHeight) {
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

// src/ai/ensemblePose.js - 키포인트 융합 및 앙상블 처리


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
function fuse3Keypoints(yoloNorm, moveNorm, poseNorm) {
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
async function runFrontAnalysis(img) {
  // 이미지 로드 확인
  await ensureImageLoaded(img);
  
  const imgWidth = img.naturalWidth || img.width;
  const imgHeight = img.naturalHeight || img.height;
  
  // YOLO로 person detection
  const yoloDetections = await detectYOLO(img);
  yoloDetections[0]?.bbox || [0, 0, imgWidth, imgHeight];
  
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

// src/ai/analyzer.js - 정면 앙상블 분석 통합


/**
 * 정면 이미지 분석 및 키포인트 추출
 * @param {HTMLImageElement} img - 정면 이미지
 * @param {string} sessionName - 세션 이름 ('Before' | 'After')
 * @returns {Promise<Object>} 키포인트 맵
 */
async function analyzeFrontImage(img, sessionName = 'Before') {
  try {
    // 이미지 로드 확인
    await ensureImageLoaded(img);
    
    // 앙상블 분석 수행
    const keypoints = await runFrontAnalysis(img);
    
    // 세션에 저장
    const session = sessions[sessionName];
    if (session) {
      // frontPoints Map에 저장
      session.frontPoints.clear();
      Object.entries(keypoints).forEach(([key, point]) => {
        if (point && point.x !== undefined && point.y !== undefined) {
          session.frontPoints.set(key, { x: point.x, y: point.y, score: point.score || 0.5 });
        }
      });
      
      // poseData 업데이트
      if (!session.poseData) {
        session.poseData = { orientation: 'front', landmarks: null };
      }
      session.poseData.orientation = 'front';
      session.poseData.landmarks = keypoints;
      
      console.log(`✅ 정면 분석 완료 (${sessionName}):`, Object.keys(keypoints).length, '키포인트');
    }
    
    return keypoints;
  } catch (err) {
    console.error(`❌ 정면 분석 실패 (${sessionName}):`, err);
    throw err;
  }
}

/**
 * 현재 세션 분석 (정면/옆모습 자동 감지)
 */
const liveAnalyzer = {
  async analyzeCurrentSession() {
    try {
      const sessionName = window.cur || "Before";
      const session = sessions[sessionName];
      
      if (!session) {
        console.warn("세션을 찾을 수 없습니다:", sessionName);
        return;
      }
      
      // 정면 이미지가 있으면 정면 분석
      if (session.imgFront) {
        console.log(`🔥 정면 이미지 분석 시작 (${sessionName})`);
        await analyzeFrontImage(session.imgFront, sessionName);
        
        // UI 업데이트
        if (typeof window.draw === 'function') {
          window.draw();
        }
        if (typeof window.computeMetricsOnly === 'function') {
          window.computeMetricsOnly();
        }
      }
      
      // 옆모습 이미지는 기존 로직 유지 (BlazePose 사용)
      if (session.imgSide) {
        console.log(`🔥 옆모습 이미지 분석 시작 (${sessionName})`);
        // 기존 옆모습 분석 로직은 그대로 유지
        if (typeof window.liveAnalyzer?.analyzeSideImage === 'function') {
          await window.liveAnalyzer.analyzeSideImage(session.imgSide, sessionName);
        }
      }
    } catch (err) {
      console.error("❌ 세션 분석 실패:", err);
    }
  }
};

let initialized = false;

async function initializeApp() {
  console.log("🚀 initializeApp 실행됨");
  console.log("📦 sessions 상태:", sessions);
  
  // 전역 변수 보호: sessions가 window에 할당되었는지 확인
  if (typeof window !== 'undefined') {
    if (!window.sessions || !window.sessions.Before || !window.sessions.After) {
      window.sessions = sessions;
      console.log("✅ sessions를 window.sessions에 할당했습니다.");
    } else {
      console.log("✅ 기존 window.sessions 재사용");
    }
    
    // cur 보호
    if (typeof window.cur === 'undefined') {
      window.cur = "Before";
    }
  }
  
  // 버튼 초기화 함수들 직접 구현 (HTML 인라인 스크립트가 번들에 포함되지 않으므로)
  const setupButtonsDirectly = () => {
    // setupResetButton 직접 구현
    if (typeof window.setupResetButton !== 'function') {
      window.setupResetButton = function() {
        const btnReset = document.getElementById("btnReset");
        if (!btnReset) {
          console.warn("Reset 버튼을 찾을 수 없습니다.");
          return;
        }
        const handler = () => {
          const orientation = window.sessions?.[window.cur || "Before"]?.poseData?.orientation || "side";
          const currentSession = window.sessions?.[window.cur || "Before"];
          if (!currentSession) return;
          const currentPoints = orientation === "front" ? currentSession.frontPoints : currentSession.sidePoints;
          if (currentPoints && currentPoints.clear) currentPoints.clear();
          if (typeof window.draw === 'function') window.draw();
          if (typeof window.computeMetricsOnly === 'function') window.computeMetricsOnly();
        };
        btnReset.addEventListener('click', handler, { passive: true });
        btnReset.addEventListener('touchstart', (e) => {
          e.preventDefault();
          handler();
        }, { passive: false });
        console.log("✅ Reset 버튼 이벤트 연결 완료");
      };
    }
    
    // setupCalibrateButton 직접 구현
    if (typeof window.setupCalibrateButton !== 'function') {
      let calibrationMode = false;
      window.setupCalibrateButton = function() {
        const btnCalibrate = document.getElementById("btnCalibrate");
        if (!btnCalibrate) {
          console.warn("캘리브레이션 버튼을 찾을 수 없습니다.");
          return;
        }
        const handler = () => {
          calibrationMode = !calibrationMode;
          const panel = document.getElementById("calibrationPanel");
          const S = window.sessions?.[window.cur || "Before"];
          const cv = document.getElementById("cv");
          
          if (calibrationMode) {
            if (panel) panel.style.display = "block";
            if (S) {
              S.calibrationPoint1 = null;
              S.calibrationPoint2 = null;
            }
            if (cv) cv.style.cursor = "crosshair";
            if (typeof window.draw === 'function') window.draw();
          } else {
            if (panel) panel.style.display = "none";
            if (cv) cv.style.cursor = "default";
            if (S) {
              S.calibrationPoint1 = null;
              S.calibrationPoint2 = null;
            }
            if (typeof window.draw === 'function') window.draw();
          }
        };
        btnCalibrate.addEventListener('click', handler, { passive: true });
        btnCalibrate.addEventListener('touchstart', (e) => {
          e.preventDefault();
          handler();
        }, { passive: false });
        console.log("✅ 캘리브레이션 버튼 이벤트 연결 완료");
      };
    }
    
    // setupCalibrationButtons 직접 구현 (간단 버전)
    if (typeof window.setupCalibrationButtons !== 'function') {
      window.setupCalibrationButtons = function() {
        const btnConfirm = document.getElementById("btnConfirmCalibration");
        const btnCancel = document.getElementById("btnCancelCalibration");
        
        if (btnConfirm) {
          const handler = () => {
            const S = window.sessions?.[window.cur || "Before"];
            if (!S || !S.calibrationPoint1 || !S.calibrationPoint2) {
              alert("두 점을 모두 선택해주세요.");
              return;
            }
            const realLengthCm = parseFloat(document.getElementById("calibrationLength")?.value || "0");
            if (!realLengthCm || realLengthCm <= 0) {
              alert("실제 길이(cm)를 올바르게 입력해주세요.");
              return;
            }
            // 캘리브레이션 로직은 기존 함수 사용
            if (typeof window.calibratePxPerCm === 'function') {
              try {
                const pxPerCm = window.calibratePxPerCm(S.calibrationPoint1, S.calibrationPoint2, realLengthCm);
                S.pxPerCm = pxPerCm;
                const resultEl = document.getElementById("calibrationResult");
                if (resultEl) {
                  resultEl.textContent = `✅ 캘리브레이션 완료: ${pxPerCm.toFixed(2)} px/cm`;
                  resultEl.style.color = "#2ec4b6";
                }
                if (typeof window.computeMetricsOnly === 'function') window.computeMetricsOnly();
                if (typeof window.setupCalibrateButton === 'function') window.setupCalibrateButton();
              } catch (error) {
                alert(`캘리브레이션 실패: ${error.message}`);
              }
            }
          };
          btnConfirm.addEventListener('click', handler, { passive: true });
          btnConfirm.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handler();
          }, { passive: false });
        }
        
        if (btnCancel) {
          const handler = () => {
            if (typeof window.setupCalibrateButton === 'function') window.setupCalibrateButton();
          };
          btnCancel.addEventListener('click', handler, { passive: true });
          btnCancel.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handler();
          }, { passive: false });
        }
        console.log("✅ 캘리브레이션 관련 버튼 이벤트 연결 완료");
      };
    }
    
    // setupPDFButton 직접 구현
    if (typeof window.setupPDFButton !== 'function') {
      window.setupPDFButton = function() {
        const btnPDF = document.getElementById("btnPDF");
        if (!btnPDF) {
          console.warn("PDF 버튼을 찾을 수 없습니다.");
          return;
        }
        // 기존 이벤트 리스너 제거 (중복 방지)
        const newBtn = btnPDF.cloneNode(true);
        btnPDF.parentNode.replaceChild(newBtn, btnPDF);
        
        newBtn.addEventListener('click', async () => {
          try {
            const btn = document.getElementById("btnPDF");
            const originalText = btn.textContent;
            btn.textContent = "⏳ PDF 생성 중...";
            btn.disabled = true;
            
            let centerName = prompt("센터 이름을 입력하세요:", localStorage.getItem('centerName') || "") || null;
            if(centerName) localStorage.setItem('centerName', centerName);
            
            let memberName = prompt("회원 이름을 입력하세요:", localStorage.getItem('memberName') || "") || null;
            if(memberName) localStorage.setItem('memberName', memberName);
            
            if(!centerName || !memberName) {
              if(!confirm("센터 이름 또는 회원 이름이 입력되지 않았습니다. 계속하시겠습니까?")) {
                btn.textContent = originalText;
                btn.disabled = false;
                return;
              }
            }
            
            // 라이브러리 로드 대기
            let retryCount = 0;
            while ((typeof html2canvas === 'undefined' || !window.jspdf) && retryCount < 30) {
              await new Promise(resolve => setTimeout(resolve, 100));
              retryCount++;
            }
            
            const S = window.sessions?.[window.cur || "Before"];
            const hasSidePoints = S?.sidePoints && (S.sidePoints.size > 0 || Object.keys(S.sidePoints).length > 0);
            const hasFrontPoints = S?.frontPoints && (S.frontPoints.size > 0 || Object.keys(S.frontPoints).length > 0);
            if (!S || (!hasSidePoints && !hasFrontPoints)) {
              alert("먼저 이미지를 업로드하고 분석을 완료해주세요.");
              btn.textContent = originalText;
              btn.disabled = false;
              return;
            }
            
            if (typeof window.exportAsPdf === 'function') {
              await window.exportAsPdf({
                userName: localStorage.getItem('userName') || memberName || "사용자",
                centerName: centerName,
                memberName: memberName,
                appName: 'DIT 자세 분석 AI'
              });
            } else {
              alert("PDF 생성 함수를 찾을 수 없습니다.");
            }
            
            btn.textContent = originalText;
            btn.disabled = false;
          } catch(error) {
            console.error("❌ PDF 생성 실패:", error);
            alert("PDF 생성에 실패했습니다: " + (error.message || '알 수 없는 오류'));
            const btn = document.getElementById("btnPDF");
            if (btn) {
              btn.textContent = "📄 PDF 저장";
              btn.disabled = false;
            }
          }
        });
        console.log("✅ PDF 버튼 이벤트 연결 완료");
      };
    }
    
    // setupImageButton 직접 구현
    if (typeof window.setupImageButton !== 'function') {
      window.setupImageButton = function() {
        const btnImage = document.getElementById("btnImage");
        if (!btnImage) {
          console.warn("이미지 버튼을 찾을 수 없습니다.");
          return;
        }
        
        btnImage.onclick = async () => {
          const btn = document.getElementById("btnImage");
          const originalText = btn.textContent;
          btn.textContent = "⏳ 이미지 생성 중...";
          btn.disabled = true;
          try {
            if (typeof html2canvas === 'undefined') {
              throw new Error("html2canvas 라이브러리가 로드되지 않았습니다.");
            }
            const memberNameDisplay = localStorage.getItem('memberName') || window.memberName || '회원';
            const centerNameDisplay = localStorage.getItem('centerName') || window.centerName || '';
            
            if (typeof window.captureReportCanvases === 'function' && typeof window.combineCanvasesVertical === 'function' && typeof window.downloadCanvasAsImage === 'function') {
              const pageData = await window.captureReportCanvases({
                centerName: centerNameDisplay,
                memberName: memberNameDisplay,
                appName: 'DIT 자세 분석 AI',
                logoUrl: null
              });
              const orderedCanvases = [
                pageData.canvases.cover,
                ...(pageData.includeHeatmapPage && pageData.canvases.heatmap ? [pageData.canvases.heatmap] : []),
                pageData.canvases.metrics,
                pageData.canvases.aiSummary,
                pageData.canvases.pilates,
                pageData.canvases.aiDeep,
                pageData.canvases.conclusion
              ].filter(Boolean);
              if (!orderedCanvases.length) {
                throw new Error("저장할 페이지가 없습니다.");
              }
              const combinedCanvas = window.combineCanvasesVertical(orderedCanvases);
              const imageFileName = `${centerNameDisplay || 'DIT'}_${memberNameDisplay || '회원'}_자세분석리포트_${new Date().toISOString().split('T')[0]}.png`;
              await window.downloadCanvasAsImage(combinedCanvas, imageFileName, btn, originalText);
            } else {
              throw new Error("이미지 생성 함수를 찾을 수 없습니다.");
            }
          } catch (error) {
            console.error("전체 이미지 생성 실패:", error);
            alert("이미지 생성 중 오류가 발생했습니다: " + (error?.message || "알 수 없는 오류"));
            btn.textContent = originalText || "🖼️ 이미지 저장";
            btn.disabled = false;
          }
        };
        console.log("✅ 이미지 버튼 이벤트 연결 완료");
      };
    }
    
    // 직접 구현한 함수들 실행
    if (typeof window.setupResetButton === 'function') window.setupResetButton();
    if (typeof window.setupCalibrateButton === 'function') window.setupCalibrateButton();
    if (typeof window.setupCalibrationButtons === 'function') window.setupCalibrationButtons();
    if (typeof window.setupPDFButton === 'function') window.setupPDFButton();
    if (typeof window.setupImageButton === 'function') window.setupImageButton();
  };
  
  setupButtonsDirectly();
  
  // 세션별 포즈 정보 초기화
  if (!sessions.Before.poseData) {
    sessions.Before.poseData = { orientation: "side", landmarks: null, orientationMode: "auto" };
  }
  if (!sessions.After.poseData) {
    sessions.After.poseData = { orientation: "side", landmarks: null, orientationMode: "auto" };
  }
  
  // 버튼 이벤트 핸들러 초기화
  // initSessionButtons는 HTML에 정의된 전역 함수이므로 window를 통해 접근
  // 최대 3초 동안 재시도 (30번) - HTML 스크립트가 로드될 시간 확보
  let retryCount2 = 0;
  const maxRetries2 = 30;
  
  // 직접 버튼 연결 함수 (fallback)
  const setupSessionButtonsDirectly = () => {
    const btnBefore = document.getElementById("btnBefore");
    const btnAfter = document.getElementById("btnAfter");
    const btnOrientationSide = document.getElementById("btnOrientationSide");
    const btnOrientationFront = document.getElementById("btnOrientationFront");
    const btnReset = document.getElementById("btnReset");
    const btnCalibrate = document.getElementById("btnCalibrate");
    
    // 버튼별 리스너 등록 여부 추적
    const buttonListeners = new WeakMap();
    
    const addClickHandler = (btn, handler) => {
      if (btn) {
        // 기존 리스너가 있으면 제거 (중복 방지)
        if (buttonListeners.has(btn)) {
          const oldHandler = buttonListeners.get(btn);
          btn.removeEventListener('click', oldHandler.click);
          btn.removeEventListener('touchstart', oldHandler.touch);
        }
        
        // 새 리스너 등록
        const clickHandler = (e) => {
          e.stopPropagation();
          handler(e);
        };
        const touchHandler = (e) => {
          e.preventDefault();
          e.stopPropagation();
          handler(e);
        };
        
        btn.addEventListener('click', clickHandler, { passive: true });
        btn.addEventListener('touchstart', touchHandler, { passive: false });
        
        // 리스너 저장 (나중에 제거하기 위해)
        buttonListeners.set(btn, { click: clickHandler, touch: touchHandler });
        
        console.log(`✅ ${btn.id} 직접 연결 완료`);
        return btn;
      }
      return null;
    };
    
    if (btnBefore) {
      const handler = () => {
        console.log("Before 버튼 클릭됨");
        if (typeof window.switchSession === 'function') {
          window.switchSession("Before");
        }
      };
      addClickHandler(btnBefore, handler);
    }
    
    if (btnAfter) {
      const handler = () => {
        console.log("After 버튼 클릭됨");
        if (typeof window.switchSession === 'function') {
          window.switchSession("After");
        }
      };
      addClickHandler(btnAfter, handler);
    }
    
    if (btnOrientationSide) {
      const handler = () => {
        console.log("옆모습 버튼 클릭됨");
        if (typeof window.setOrientation === 'function') {
          window.setOrientation("side", { manual: true });
        }
      };
      addClickHandler(btnOrientationSide, handler);
    }
    
    if (btnOrientationFront) {
      const handler = () => {
        console.log("정면 버튼 클릭됨");
        if (typeof window.setOrientation === 'function') {
          window.setOrientation("front", { manual: true });
        }
      };
      addClickHandler(btnOrientationFront, handler);
    }
    
    if (btnReset) {
      const handler = () => {
        console.log("Reset 버튼 클릭됨");
        const orientation = window.sessions?.[window.cur || "Before"]?.poseData?.orientation || "side";
        const currentSession = window.sessions?.[window.cur || "Before"];
        if (!currentSession) return;
        const currentPoints = orientation === "front" ? currentSession.frontPoints : currentSession.sidePoints;
        if (currentPoints && currentPoints.clear) currentPoints.clear();
        if (typeof window.draw === 'function') window.draw();
        if (typeof window.computeMetricsOnly === 'function') window.computeMetricsOnly();
      };
      addClickHandler(btnReset, handler);
    }
    
    if (btnCalibrate) {
      const handler = () => {
        console.log("캘리브레이션 버튼 클릭됨");
        if (typeof window.setupCalibrateButton === 'function') {
          // setupCalibrateButton이 이미 실행되었을 수 있으므로 직접 토글
          const panel = document.getElementById("calibrationPanel");
          if (panel) {
            const isVisible = panel.style.display !== "none";
            panel.style.display = isVisible ? "none" : "block";
          }
        }
      };
      addClickHandler(btnCalibrate, handler);
    }
  };
  
  // 직접 연결은 한 번만 실행 (중복 방지)
  let sessionButtonsSetup = false;
  const tryInitSessionButtons = () => {
    // 직접 연결은 한 번만 실행
    if (!sessionButtonsSetup) {
      setupSessionButtonsDirectly();
      sessionButtonsSetup = true;
    }
    
    if (typeof window.initSessionButtons === 'function') {
      try {
        window.initSessionButtons();
        console.log("✅ initSessionButtons 실행 완료");
      } catch (error) {
        console.error("❌ initSessionButtons 실행 실패:", error);
      }
    } else if (retryCount2 < maxRetries2) {
      retryCount2++;
      setTimeout(tryInitSessionButtons, 100);
    } else {
      console.warn("⚠️ initSessionButtons 함수를 찾을 수 없지만 직접 연결은 완료됨");
    }
  };
  
  tryInitSessionButtons();
  
  // orientation 버튼 상태 설정
  if (typeof window.cur !== 'undefined') {
    const orientation = sessions[window.cur]?.poseData?.orientation || "side";
    const btnSide = document.getElementById("btnOrientationSide");
    const btnFront = document.getElementById("btnOrientationFront");
    
    if(btnSide && btnFront) {
      btnSide.classList.toggle("active", orientation === "side");
      btnFront.classList.toggle("active", orientation === "front");
      console.log("Orientation 버튼 초기 상태 설정 완료:", orientation);
    }
  }
  
  // 좌표 선택 드롭다운 초기화
  if (typeof updateCoordSelectOptions === 'function') {
    updateCoordSelectOptions();
  }
  
  // ✅ UI 비활성화 (모델 로딩 전까지)
  disableUI();
  
  if (window.resizeCanvasFor) window.resizeCanvasFor(null);
  if (window.draw) window.draw();
  if (window.computeMetricsOnly) window.computeMetricsOnly();
  if (window.updateCompare) window.updateCompare();
  
  // ✅ 모델 로딩 (싱글톤 패턴으로 1회만 실행)
  try {
    await ModelLoader.loadModels();
    console.log("✅ 모델 로딩 완료");
  } catch (err) {
    console.error("❌ 모델 로딩 실패:", err);
    // 모델 로딩 실패해도 UI는 활성화 (폴백 모드)
  }
  
  // ✅ UI 활성화 (모델 로딩 완료 후)
  enableUI();
  
  // liveAnalyzer를 window에 노출
  window.liveAnalyzer = liveAnalyzer;
  
  setTimeout(() => {
    if (window.liveAnalyzer && window.liveAnalyzer.analyzeCurrentSession) {
      window.liveAnalyzer.analyzeCurrentSession();
    }
  }, 500);
  
  // ✅ 파일 업로드 강제 연결
  bindFileInput();
  
  console.log("=== 초기화 완료 ===");
}

// ✅ UI 비활성화 함수
function disableUI() {
  const buttons = document.querySelectorAll('button, .btn');
  buttons.forEach(btn => {
    if (!btn.disabled) {
      btn.dataset.wasEnabled = 'true';
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    }
  });
  console.log("🔒 UI 비활성화 (모델 로딩 중)");
}

// ✅ UI 활성화 함수
function enableUI() {
  const buttons = document.querySelectorAll('button, .btn');
  buttons.forEach(btn => {
    if (btn.dataset.wasEnabled === 'true') {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      delete btn.dataset.wasEnabled;
    }
  });
  console.log("🔓 UI 활성화 (모델 로딩 완료)");
}

// ✅ 파일 업로드 핸들러
function handleFileUpload(file) {
  console.log("📌 업로드 감지:", file.name);
  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = () => {
    console.log("✅ 이미지 로드됨", img.width, img.height);
    // 기존 handleFileUpload 함수가 있으면 이벤트 객체 형태로 호출
    if (typeof window.handleFileUpload === 'function') {
      const mockEvent = {
        target: {
          files: [file]
        }
      };
      window.handleFileUpload(mockEvent);
    }
  };
  img.onerror = () => {
    console.error("❌ 이미지 로드 실패");
    alert("이미지를 불러올 수 없습니다.");
  };
}

// ✅ input 연결 강제 바인딩
function bindFileInput() {
  const filePicker = document.getElementById("filePicker");
  const cameraPicker = document.getElementById("cameraPicker");
  
  if (!filePicker && !cameraPicker) {
    console.warn("⚠️ filePicker/cameraPicker 없음 → 0.5초 후 재시도");
    setTimeout(bindFileInput, 500);
    return;
  }
  
  if (filePicker) {
    filePicker.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
      }
    });
    console.log("✅ filePicker 이벤트 연결 완료");
  }
  
  if (cameraPicker) {
    cameraPicker.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
      }
    });
    console.log("✅ cameraPicker 이벤트 연결 완료");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (initialized) return;
  initialized = true;
  initializeApp();
});
