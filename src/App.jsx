import React, { useRef, useState, useEffect } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import DraggableDot from "./components/DraggableDot.jsx";
import { mapPosePoints } from "./utils/poseMapper.js";
import { calcAngle, angleToVertical } from "./utils/calcAngle.js";
import { analyzeMuscles } from "./utils/muscleRules.js";

export default function App() {
  const [imageURL, setImageURL] = useState(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [points, setPoints] = useState({ ear:null, shoulder:null, hip:null, knee:null, ankle:null });
  const [angles, setAngles] = useState({ forwardHead: null, trunk: null, knee: null });
  const [analysis, setAnalysis] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const imgRef = useRef(null);

  const onImageLoad = () => {
    const img = imgRef.current;
    if (img) {
      setImgSize({ w: img.clientWidth, h: img.clientHeight });
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageURL(url);
  };

  useEffect(() => {
    if (!imageURL) return;
    detect(imageURL);
  }, [imageURL]);

  async function detect(url) {
    setIsDetecting(true);
    try {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm");
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
        },
        runningMode: "IMAGE"
      });

      const img = new Image();
      img.src = url;
      img.onload = async () => {
        const res = await landmarker.detect(img);
        const lms = res?.landmarks?.[0] ?? [];
        const mapped = mapPosePoints(lms);
        setPoints(mapped);
        computeAngles(mapped);
        setIsDetecting(false);
      };
    } catch (e) {
      console.error(e);
      setIsDetecting(false);
    }
  }

  const computeAngles = (pts) => {
    const { ear, shoulder, hip, knee, ankle } = pts;
    if (!(ear && shoulder && hip && knee && ankle)) return;

    // 1) Forward Head: 어깨→외이도 선의 수평 기준 각(°)
    const forwardHead = 180 - calcAngle(
      { x: shoulder.x + 0.5, y: shoulder.y }, // 수평 기준점
      shoulder, ear
    );

    // 2) Trunk Incline: 골반→어깨 선분이 수직(아래)과 이루는 각(°); 전방 기울면 +로 해석
    const trunkRaw = angleToVertical(hip, shoulder);
    // 전방 기울기(어깨가 골반보다 앞= x 증가)면 +, 뒤면 -
    const sign = (shoulder.x - hip.x) >= 0 ? 1 : -1;
    const trunk = trunkRaw * sign;

    // 3) Knee Angle: 엉덩이–무릎–발목
    const kneeAngle = calcAngle(hip, knee, ankle);

    setAngles({ forwardHead, trunk, knee: kneeAngle });
    setAnalysis(analyzeMuscles({ forwardHead, trunk, knee: kneeAngle }));
  };

  const updatePoint = (key) => (p) => {
    const next = { ...points, [key]: p };
    setPoints(next);
    computeAngles(next);
  };

  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ margin: 0 }}>📸 DIT 자세 분석 AI (한국어)</h2>
      <p style={{ marginTop: 6, color: "#555" }}>
        옆모습 사진을 업로드하면 자동 분석됩니다. (점은 드래그로 보정 가능)
      </p>

      <div className="card" style={{ marginTop: 8 }}>
        <div className="row" style={{ alignItems: "center" }}>
          <input type="file" accept="image/*" onChange={handleFile} />
          {isDetecting ? <span className="chip">분석 중…</span> : null}
        </div>

        <div style={{ position: "relative", display: "inline-block", marginTop: 12 }}>
          {imageURL && (
            <img
              ref={imgRef}
              src={imageURL}
              alt="업로드 이미지"
              onLoad={onImageLoad}
              style={{ width: "min(92vw, 420px)", borderRadius: 12 }}
            />
          )}

          {/* 가이드 라인 (어깨-외이도, 골반-어깨, 무릎-골반, 발목-무릎) */}
          <svg
            width={imgSize.w}
            height={imgSize.h}
            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
          >
            {points.shoulder && points.ear && (
              <line className="guide"
                x1={points.shoulder.x*imgSize.w} y1={points.shoulder.y*imgSize.h}
                x2={points.ear.x*imgSize.w} y2={points.ear.y*imgSize.h}
              />
            )}
            {points.hip && points.shoulder && (
              <line className="guide"
                x1={points.hip.x*imgSize.w} y1={points.hip.y*imgSize.h}
                x2={points.shoulder.x*imgSize.w} y2={points.shoulder.y*imgSize.h}
              />
            )}
            {points.knee && points.hip && (
              <line className="guide"
                x1={points.knee.x*imgSize.w} y1={points.knee.y*imgSize.h}
                x2={points.hip.x*imgSize.w} y2={points.hip.y*imgSize.h}
              />
            )}
            {points.ankle && points.knee && (
              <line className="guide"
                x1={points.ankle.x*imgSize.w} y1={points.ankle.y*imgSize.h}
                x2={points.knee.x*imgSize.w} y2={points.knee.y*imgSize.h}
              />
            )}
          </svg>

          {/* 드래그 핸들 */}
          <DraggableDot name="외이도"   p={points.ear}      imgW={imgSize.w} imgH={imgSize.h} onStop={updatePoint("ear")} />
          <DraggableDot name="어깨"     p={points.shoulder} imgW={imgSize.w} imgH={imgSize.h} onStop={updatePoint("shoulder")} />
          <DraggableDot name="골반"     p={points.hip}      imgW={imgSize.w} imgH={imgSize.h} onStop={updatePoint("hip")} />
          <DraggableDot name="무릎"     p={points.knee}     imgW={imgSize.w} imgH={imgSize.h} onStop={updatePoint("knee")} />
          <DraggableDot name="발목"     p={points.ankle}    imgW={imgSize.w} imgH={imgSize.h} onStop={updatePoint("ankle")} />
        </div>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <div className="card">
          <h4 style={{marginTop:0}}>📊 분석 각도</h4>
          <p>머리 전방 변위 (CVA): <b>{angles.forwardHead?.toFixed(1) ?? "-"}</b>°</p>
          <p>몸통 기울기: <b>{angles.trunk?.toFixed(1) ?? "-"}</b>°</p>
          <p>무릎 각도: <b>{angles.knee?.toFixed(1) ?? "-"}</b>°</p>
          <p style={{fontSize:12,color:"#666"}}>기준: CVA 정상 ≥ 50°, 몸통 |각| ≤ 5°, 무릎 175°~185°</p>
        </div>
      </div>

      <div className="row">
        <div className="card" style={{flex:1}}>
          <h4 style={{marginTop:0}}>🧠 근육 상태 & 교정 제안</h4>
          {!analysis ? <p>사진 분석 후에 표시됩니다.</p> : (
            <>
              <p><b>머리/경추:</b> {analysis.head?.상태}</p>
              {analysis.head?.타이트?.length ? <p>• <span className="tight">타이트</span>: {analysis.head.타이트.join(", ")}</p> : null}
              {analysis.head?.약화?.length ? <p>• <span className="weak">약화</span>: {analysis.head.약화.join(", ")}</p> : null}
              {analysis.head?.추천?.length ? <p>• 추천: {analysis.head.추천.join(", ")}</p> : null}

              <p><b>몸통/골반:</b> {analysis.trunk?.상태}</p>
              {analysis.trunk?.타이트?.length ? <p>• <span className="tight">타이트</span>: {analysis.trunk.타이트.join(", ")}</p> : null}
              {analysis.trunk?.약화?.length ? <p>• <span className="weak">약화</span>: {analysis.trunk.약화.join(", ")}</p> : null}
              {analysis.trunk?.추천?.length ? <p>• 추천: {analysis.trunk.추천.join(", ")}</p> : null}

              <p><b>무릎/하지:</b> {analysis.knee?.상태}</p>
              {analysis.knee?.타이트?.length ? <p>• <span className="tight">타이트</span>: {analysis.knee.타이트.join(", ")}</p> : null}
              {analysis.knee?.약화?.length ? <p>• <span className="weak">약화</span>: {analysis.knee.약화.join(", ")}</p> : null}
              {analysis.knee?.추천?.length ? <p>• 추천: {analysis.knee.추천.join(", ")}</p> : null}
            </>
          )}
        </div>
      </div>

      <div style={{marginTop:10,fontSize:12,color:"#666"}}>
        ※ 모든 처리는 브라우저 로컬에서 이루어집니다. 사진은 서버로 업로드되지 않습니다.
      </div>
    </div>
  );
}
