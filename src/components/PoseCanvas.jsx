import React, { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { mapPosePoints } from "../utils/poseMapper";
import { calculateAngles } from "../utils/calculateAngles";

export default function PoseCanvas({ onAnalysisChange }) {
  const [image, setImage] = useState(null);
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
      } catch (error) {
        console.error("MediaPipe 초기화 실패:", error);
      }
    };
    initMediaPipe();
  }, []);

  // 이미지 업로드 시 자동 인식
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    
    // 이미지 로드 후 자동 인식
    const img = new Image();
    img.src = url;
    img.onload = async () => {
      if (landmarkerRef.current) {
        await detectPose(img);
      }
    };
  };

  // MediaPipe로 포즈 인식
  const detectPose = async (img) => {
    setIsDetecting(true);
    try {
      const result = landmarkerRef.current.detect(img);
      const landmarks = result?.landmarks?.[0] || [];
      const mapped = mapPosePoints(landmarks);
      
      // 이미지 크기에 맞춰 좌표 변환
      if (imgRef.current && imgRef.current.complete) {
        const imgW = imgRef.current.clientWidth;
        const imgH = imgRef.current.clientHeight;
        
        const normalizedToPixel = (point, imgW, imgH) => {
          if (!point) return null;
          return { x: point.x * imgW, y: point.y * imgH };
        };

        setPoints({
          ear: normalizedToPixel(mapped.ear, imgW, imgH),
          shoulder: normalizedToPixel(mapped.shoulder, imgW, imgH),
          hip: normalizedToPixel(mapped.hip, imgW, imgH),
          knee: normalizedToPixel(mapped.knee, imgW, imgH),
          ankle: normalizedToPixel(mapped.ankle, imgW, imgH),
        });
      }
    } catch (error) {
      console.error("포즈 인식 실패:", error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleImageLoad = (e) => {
    const img = e.target;
    setImgSize({ w: img.clientWidth, h: img.clientHeight });
    
    // 이미지가 로드되면 자동 인식 시도
    if (landmarkerRef.current && image) {
      detectPose(img);
    }
  };

  // 포인트 드래그 핸들러
  const handleDrag = (key, e, data) => {
    setPoints((prev) => ({ ...prev, [key]: { x: data.x, y: data.y } }));
  };

  // 각도 계산 및 전달
  useEffect(() => {
    if (points.ear && points.shoulder && points.hip && points.knee && points.ankle && imgSize.w > 0) {
      // 픽셀 좌표를 정규화 좌표로 변환
      const normalized = {
        ear: { x: points.ear.x / imgSize.w, y: points.ear.y / imgSize.h },
        shoulder: { x: points.shoulder.x / imgSize.w, y: points.shoulder.y / imgSize.h },
        hip: { x: points.hip.x / imgSize.w, y: points.hip.y / imgSize.h },
        knee: { x: points.knee.x / imgSize.w, y: points.knee.y / imgSize.h },
        ankle: { x: points.ankle.x / imgSize.w, y: points.ankle.y / imgSize.h },
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
        onChange={handleFileChange}
        className="mb-3 p-2 border rounded-lg"
        disabled={isDetecting}
      />
      {isDetecting && <div className="mb-2 text-sm text-gray-600">분석 중...</div>}
      {image && (
        <div className="relative">
          <img
            ref={imgRef}
            src={image}
            alt="posture"
            className="max-h-[600px] rounded-xl"
            onLoad={handleImageLoad}
          />
          {Object.keys(points).map((key) => {
            const point = points[key];
            if (!point) return null;
            
            return (
              <Draggable
                key={key}
                position={point}
                onDrag={(e, data) => handleDrag(key, e, data)}
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
