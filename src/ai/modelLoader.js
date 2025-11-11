import * as posedetection from "https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection/dist/pose-detection.esm.min.js";

export const detectors = { front: null, side: null };

export async function loadModels() {
  detectors.front = await posedetection.createDetector(
    posedetection.SupportedModels.BlazePose, 
    {runtime: "tfjs", modelType: "full"}
  );
  detectors.side = await posedetection.createDetector(
    posedetection.SupportedModels.BlazePose, 
    {runtime: "tfjs", modelType: "full"}
  );
  console.log("✅ BlazePose 모델 2개 로드 완료");
}

