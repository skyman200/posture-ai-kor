import React from "react";
import Draggable from "react-draggable";

// imgW,imgH: 실제 렌더된 이미지 크기, p: 0~1 좌표
export default function DraggableDot({ name, p, imgW, imgH, onStop }) {
  if (!p) return null;
  return (
    <Draggable
      position={{ x: p.x * imgW, y: p.y * imgH }}
      onStop={(e, data) => {
        onStop({ x: data.x / imgW, y: data.y / imgH });
      }}
    >
      <div className="dot" title={name} style={{ position: "absolute", cursor: "grab" }} />
    </Draggable>
  );
}

