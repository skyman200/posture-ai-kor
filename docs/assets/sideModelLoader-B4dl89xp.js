import { _ as __vitePreload } from './main-C8TgFrnp.js';

// tf는 window.loadTfOnce()로부터 받은 TensorFlow.js 인스턴스

async function loadSideModel(tf) {
  console.log('sideModelLoader: loadSideModel called');
  
  try {
    // @tensorflow-models/pose-detection에서 BlazePose 로드
    const poseDetection = await __vitePreload(() => import('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.esm.min.js'),true?[]:void 0);
    
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.BlazePose,
      { 
        runtime: "tfjs", 
        modelType: "full",
        enableSmoothing: true
      }
    );
    
    console.log('✅ sideModelLoader: 옆모습 모델 로드 완료 (BlazePose)');
    
    return {
      name: 'blazepose-side',
      type: 'side',
      detector: detector,
      estimatePoses: async (img) => {
        return await detector.estimatePoses(img, { maxPoses: 1 });
      }
    };
  } catch (err) {
    console.error('❌ sideModelLoader 로드 실패:', err);
    // 폴백: 더미 모델
    return {
      name: 'dummy-side-model',
      type: 'side',
      estimatePoses: async (img) => {
        console.warn('⚠️ sideModelLoader: 더미 모델 사용 중');
        return [];
      }
    };
  }
}

export { loadSideModel };
