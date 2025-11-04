import React, { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { mapPosePoints } from "../utils/poseMapper";
import { calculateAngles } from "../utils/calculateAngles";

export default function PoseCanvas({ onAnalysisChange }) {
  const [imageURL, setImageURL] = useState(null);
  const [points, setPoints] = useState({
    ear: null,
    shoulder: null,
    hip: null,
    knee: null,
    ankle: null,
  });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [isDetecting, setIsDetecting] = useState(false);
  const imgRef = useRef(null);
  const landmarkerRef = useRef(null);

  // MediaPipe 초기화
  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          },
          runningMode: "IMAGE",
        });
        landmarkerRef.current = landmarker;
        console.log("MediaPipe 초기화 완료");
      } catch (error) {
        console.error("MediaPipe 초기화 실패:", error);
      }
    };
    initMediaPipe();
  }, []);

  // 파일 업로드 핸들러
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageURL(url);
  };

  // 이미지 로드 시 크기 설정
  const onImageLoad = (e) => {
    const img = e.target;
    const w = img.clientWidth || img.naturalWidth;
    const h = img.clientHeight || img.naturalHeight;
    setImgSize({ w, h });
    
    // 이미지가 로드되면 자동 인식
    if (landmarkerRef.current && url) {
      detectPose(img);
    }
  };

  // MediaPipe로 포즈 인식
  const detectPose = async (img) => {
    if (!landmarkerRef.current) {
      console.warn("MediaPipe가 아직 초기화되지 않았습니다.");
      return;
    }

    setIsDetecting(true);
    try {
      const result = landmarkerRef.current.detect(img);
      const landmarks = result?.landmarks?.[0] || [];
      
      if (landmarks.length === 0) {
        console.warn("포즈를 인식할 수 없습니다.");
        return;
      }

      const mapped = mapPosePoints(landmarks);
      
      // 정규화 좌표를 픽셀 좌표로 변환
      if (imgSize.w > 0 && imgSize.h > 0) {
        const normalizedToPixel = (point) => {
          if (!point) return null;
          return { x: point.x * imgSize.w, y: point.y * imgSize.h };
        };

        setPoints({
          ear: normalizedToPixel(mapped.ear),
          shoulder: normalizedToPixel(mapped.shoulder),
          hip: normalizedToPixel(mapped.hip),
          knee: normalizedToPixel(mapped.knee),
          ankle: normalizedToPixel(mapped.ankle),
        });
      } else {
        // 이미지 크기를 모를 경우 정규화 좌표 그대로 사용 (나중에 변환)
        setPoints({
          ear: mapped.ear,
          shoulder: mapped.shoulder,
          hip: mapped.hip,
          knee: mapped.knee,
          ankle: mapped.ankle,
        });
      }
    } catch (error) {
      console.error("포즈 인식 실패:", error);
    } finally {
      setIsDetecting(false);
    }
  };

  // 포인트 업데이트 핸들러
  const updatePoint = (key) => (p) => {
    // Draggable에서 받은 픽셀 좌표를 정규화 좌표로 변환
    const normalized = { x: p.x / imgSize.w, y: p.y / imgSize.h };
    setPoints((prev) => ({ ...prev, [key]: normalized }));
  };

  // 포인트 드래그 중 핸들러 (실시간 업데이트)
  const handleDrag = (key, e, data) => {
    const normalized = { x: data.x / imgSize.w, y: data.y / imgSize.h };
    setPoints((prev) => ({ ...prev, [key]: normalized }));
  };

  // 각도 계산 및 전달
  useEffect(() => {
    if (points.ear && points.shoulder && points.hip && points.knee && points.ankle && imgSize.w > 0) {
      // 이미 정규화 좌표인지 확인
      const normalized = {
        ear: points.ear.x <= 1 ? points.ear : { x: points.ear.x / imgSize.w, y: points.ear.y / imgSize.h },
        shoulder: points.shoulder.x <= 1 ? points.shoulder : { x: points.shoulder.x / imgSize.w, y: points.shoulder.y / imgSize.h },
        hip: points.hip.x <= 1 ? points.hip : { x: points.hip.x / imgSize.w, y: points.hip.y / imgSize.h },
        knee: points.knee.x <= 1 ? points.knee : { x: points.knee.x / imgSize.w, y: points.knee.y / imgSize.h },
        ankle: points.ankle.x <= 1 ? points.ankle : { x: points.ankle.x / imgSize.w, y: points.ankle.y / imgSize.h },
      };
      
      const newAngles = calculateAngles(normalized);
      onAnalysisChange(newAngles);
    }
  }, [points, imgSize, onAnalysisChange]);

  return (
    <div className="flex flex-col items-center my-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="mb-3 p-2 border rounded-lg"
        disabled={isDetecting}
      />
      {isDetecting && <div className="mb-2 text-sm text-gray-600">분석 중...</div>}
      {imageURL && (
        <div className="relative">
          <img
            ref={imgRef}
            src={imageURL}
            alt="posture"
            className="max-h-[600px] rounded-xl"
            onLoad={onImageLoad}
          />
          {Object.keys(points).map((key) => {
            const point = points[key];
            if (!point) return null;
            
            // 정규화 좌표인지 픽셀 좌표인지 확인
            const pixelPos = point.x <= 1 
              ? { x: point.x * imgSize.w, y: point.y * imgSize.h }
              : point;
            
            return (
              <Draggable
                key={key}
                position={pixelPos}
                onDrag={(e, data) => handleDrag(key, e, data)}
                onStop={(e, data) => updatePoint(key)({ x: data.x, y: data.y })}
              >
                <div
                  className="absolute w-4 h-4 rounded-full cursor-pointer border-2 border-white shadow-lg z-10"
                  style={{
                    backgroundColor:
                      key === "ear"
                        ? "#ff4081"
                        : key === "shoulder"
                        ? "#2196f3"
                        : key === "hip"
                        ? "#4caf50"
                        : key === "knee"
                        ? "#ff9800"
                        : "#9c27b0",
                  }}
                  title={key}
                />
              </Draggable>
            );
          })}
        </div>
      )}
    </div>
  );
}
