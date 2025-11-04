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
        console.log("✅ MediaPipe 초기화 완료");
      } catch (error) {
        console.error("❌ MediaPipe 초기화 실패:", error);
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
    // 포인트 초기화
    setPoints({
      ear: null,
      shoulder: null,
      hip: null,
      knee: null,
      ankle: null,
    });
  };

  // 이미지 로드 시 크기 설정 및 자동 인식
  const onImageLoad = (e) => {
    const img = e.target;
    const w = img.clientWidth || img.naturalWidth;
    const h = img.clientHeight || img.naturalHeight;
    setImgSize({ w, h });
    console.log("📐 이미지 크기:", w, h);
    
    // 이미지가 로드되고 MediaPipe가 준비되면 자동 인식
    if (landmarkerRef.current && imageURL) {
      setTimeout(() => {
        detectPose(img);
      }, 200);
    }
  };

  // MediaPipe로 포즈 인식
  const detectPose = async (img) => {
    if (!landmarkerRef.current) {
      console.warn("⚠️ MediaPipe가 아직 초기화되지 않았습니다.");
      return;
    }

    setIsDetecting(true);
    try {
      console.log("🔍 포즈 인식 시작...");
      const result = landmarkerRef.current.detect(img);
      const landmarks = result?.landmarks?.[0] || [];
      
      if (landmarks.length === 0) {
        console.warn("⚠️ 포즈를 인식할 수 없습니다.");
        setIsDetecting(false);
        return;
      }

      console.log("✅ 포즈 인식 성공:", landmarks.length, "개 랜드마크");
      const mapped = mapPosePoints(landmarks);
      console.log("📍 매핑된 포인트:", mapped);
      
      // 정규화 좌표 그대로 저장 (픽셀 변환은 렌더링 시)
      setPoints({
        ear: mapped.ear,
        shoulder: mapped.shoulder,
        hip: mapped.hip,
        knee: mapped.knee,
        ankle: mapped.ankle,
      });
    } catch (error) {
      console.error("❌ 포즈 인식 실패:", error);
    } finally {
      setIsDetecting(false);
    }
  };

  // 포인트 드래그 핸들러 (실시간 업데이트)
  const handleDrag = (key, e, data) => {
    if (imgSize.w === 0 || imgSize.h === 0) return;
    
    // 픽셀 좌표를 정규화 좌표로 변환
    const normalized = { 
      x: Math.max(0, Math.min(1, data.x / imgSize.w)), 
      y: Math.max(0, Math.min(1, data.y / imgSize.h)) 
    };
    setPoints((prev) => ({ ...prev, [key]: normalized }));
  };

  // 포인트 드래그 종료 핸들러
  const handleDragStop = (key, e, data) => {
    if (imgSize.w === 0 || imgSize.h === 0) return;
    
    // 픽셀 좌표를 정규화 좌표로 변환
    const normalized = { 
      x: Math.max(0, Math.min(1, data.x / imgSize.w)), 
      y: Math.max(0, Math.min(1, data.y / imgSize.h)) 
    };
    setPoints((prev) => ({ ...prev, [key]: normalized }));
  };

  // 각도 계산 및 전달 (실시간 업데이트)
  useEffect(() => {
    if (points.ear && points.shoulder && points.hip && points.knee && points.ankle) {
      console.log("📊 각도 계산 시작:", points);
      const newAngles = calculateAngles(points);
      console.log("📐 계산된 각도:", newAngles);
      onAnalysisChange(newAngles);
    }
  }, [points, onAnalysisChange]);

  return (
    <div className="flex flex-col items-center my-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="mb-3 p-2 border rounded-lg"
        disabled={isDetecting}
      />
      {isDetecting && (
        <div className="mb-2 text-sm text-blue-600 font-semibold">
          🔍 분석 중...
        </div>
      )}
      {imageURL && (
        <div className="relative inline-block">
          <img
            ref={imgRef}
            src={imageURL}
            alt="posture"
            className="max-h-[600px] rounded-xl"
            onLoad={onImageLoad}
          />
          {Object.keys(points).map((key) => {
            const point = points[key];
            if (!point || imgSize.w === 0 || imgSize.h === 0) return null;
            
            // 정규화 좌표를 픽셀 좌표로 변환
            const pixelPos = { 
              x: point.x * imgSize.w, 
              y: point.y * imgSize.h 
            };
            
            return (
              <Draggable
                key={key}
                position={pixelPos}
                onDrag={(e, data) => handleDrag(key, e, data)}
                onStop={(e, data) => handleDragStop(key, e, data)}
              >
                <div
                  className="absolute w-4 h-4 rounded-full cursor-move border-2 border-white shadow-lg z-10"
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
