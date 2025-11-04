import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";
import { calculateAngles } from "../utils/calculateAngles";

export default function PoseCanvas({ onAnalysisChange }) {
  const [image, setImage] = useState(null);
  const [points, setPoints] = useState({
    ear: { x: 200, y: 150 },
    shoulder: { x: 180, y: 250 },
    hip: { x: 170, y: 350 },
    knee: { x: 160, y: 480 },
    ankle: { x: 150, y: 580 },
  });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const newAngles = calculateAngles(points);
    onAnalysisChange(newAngles);
  }, [points, onAnalysisChange]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
  };

  const handleDrag = (key, e, data) => {
    setPoints((prev) => ({ ...prev, [key]: { x: data.x, y: data.y } }));
  };

  const handleImageLoad = (e) => {
    const img = e.target;
    setImgSize({ w: img.clientWidth, h: img.clientHeight });
    // 이미지 크기에 맞춰 초기 포인트 위치 조정
    if (img.clientWidth > 0 && img.clientHeight > 0) {
      setPoints({
        ear: { x: img.clientWidth * 0.5, y: img.clientHeight * 0.15 },
        shoulder: { x: img.clientWidth * 0.5, y: img.clientHeight * 0.3 },
        hip: { x: img.clientWidth * 0.5, y: img.clientHeight * 0.5 },
        knee: { x: img.clientWidth * 0.5, y: img.clientHeight * 0.7 },
        ankle: { x: img.clientWidth * 0.5, y: img.clientHeight * 0.9 },
      });
    }
  };

  return (
    <div className="flex flex-col items-center my-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-3 p-2 border rounded-lg"
      />
      {image && (
        <div className="relative">
          <img 
            src={image} 
            alt="posture" 
            className="max-h-[600px] rounded-xl"
            onLoad={handleImageLoad}
          />
          {Object.keys(points).map((key) => (
            <Draggable
              key={key}
              position={points[key]}
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
          ))}
        </div>
      )}
    </div>
  );
}

