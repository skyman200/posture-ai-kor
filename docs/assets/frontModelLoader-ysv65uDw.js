import { _ as __vitePreload } from './main-CHxw9PDl.js';

// tf는 window.loadTfOnce()로부터 받은 TensorFlow.js 인스턴스

async function loadFrontModel(tf) {
  console.log('frontModelLoader: loadFrontModel called');
  
  try {
    // @tensorflow-models/pose-detection에서 MoveNet 로드
    const poseDetection = await __vitePreload(() => import('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.esm.min.js'),true?[]:void 0);
    
    // MoveNet 모델 타입 확인
    const modelType = poseDetection.movenet?.modelType?.SINGLEPOSE_LIGHTNING || 'lightning';
    
    const moveNet = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: modelType
      }
    );
    
    // PoseNet도 함께 로드 (앙상블용)
    let poseNet = null;
    try {
      poseNet = await poseDetection.createDetector(
        poseDetection.SupportedModels.PoseNet,
        {
          architecture: 'MobileNetV1',
          outputStride: 16,
          multiplier: 0.75,
          quantBytes: 2
        }
      );
    } catch (err) {
      console.warn('⚠️ PoseNet 로드 실패, MoveNet만 사용:', err);
    }
    
    console.log('✅ frontModelLoader: 정면 모델 로드 완료 (MoveNet' + (poseNet ? ' + PoseNet' : '') + ')');
    
    return {
      name: 'front-ensemble',
      type: 'front',
      moveNet: moveNet,
      poseNet: poseNet,
      estimatePoses: async (img) => {
        // MoveNet 결과 우선 사용
        const moveResult = await moveNet.estimatePoses(img, { maxPoses: 1 });
        if (moveResult && moveResult.length > 0) {
          return moveResult;
        }
        // MoveNet 실패 시 PoseNet 사용
        if (poseNet) {
          const poseResult = await poseNet.estimatePoses(img, { maxPoses: 1 });
          return poseResult || [];
        }
        return [];
      }
    };
  } catch (err) {
    console.error('❌ frontModelLoader 로드 실패:', err);
    // 폴백: 더미 모델
    return {
      name: 'dummy-front-model',
      type: 'front',
      estimatePoses: async (img) => {
        console.warn('⚠️ frontModelLoader: 더미 모델 사용 중');
        return [];
      }
    };
  }
}

export { loadFrontModel };
