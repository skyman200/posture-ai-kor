import { sessions } from "./sessions.js";
import { resizeCanvasFor, draw, updateCompare } from "./utils.js";
import { computeMetricsOnly, liveAnalyzer } from "../ai/analyzer.js";
import { loadModels } from "../ai/modelLoader.js";

let initialized = false;

async function initializeApp() {
  console.log("🚀 initializeApp 실행됨");
  console.log("📦 sessions 상태:", sessions);
  
  // sessions가 window에 할당되었는지 확인
  if (!window.sessions) {
    window.sessions = sessions;
    console.log("✅ sessions를 window.sessions에 할당했습니다.");
  }
  
  // 버튼 초기화 함수들 호출
  if (typeof setupFileUploads === 'function') {
    setupFileUploads();
  } else {
    console.warn("setupFileUploads 함수를 찾을 수 없습니다.");
  }
  
  if (typeof setupResetButton === 'function') {
    setupResetButton();
  } else {
    console.warn("setupResetButton 함수를 찾을 수 없습니다.");
  }
  
  if (typeof setupCalibrateButton === 'function') {
    setupCalibrateButton();
  } else {
    console.warn("setupCalibrateButton 함수를 찾을 수 없습니다.");
  }
  
  if (typeof setupCalibrationButtons === 'function') {
    setupCalibrationButtons();
  } else {
    console.warn("setupCalibrationButtons 함수를 찾을 수 없습니다.");
  }
  
  if (typeof setupPDFButton === 'function') {
    setupPDFButton();
  } else {
    console.warn("setupPDFButton 함수를 찾을 수 없습니다.");
  }
  
  if (typeof setupImageButton === 'function') {
    setupImageButton();
  } else {
    console.warn("setupImageButton 함수를 찾을 수 없습니다.");
  }
  
  // 세션별 포즈 정보 초기화
  if (!sessions.Before.poseData) {
    sessions.Before.poseData = { orientation: "side", landmarks: null, orientationMode: "auto" };
  }
  if (!sessions.After.poseData) {
    sessions.After.poseData = { orientation: "side", landmarks: null, orientationMode: "auto" };
  }
  
  // 버튼 이벤트 핸들러 초기화
  if (typeof initSessionButtons === 'function') {
    initSessionButtons();
  }
  
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
  
  resizeCanvasFor(null);
  draw();
  computeMetricsOnly();
  updateCompare();
  
  await loadModels();
  
  setTimeout(() => liveAnalyzer.analyzeCurrentSession(), 500);
  
  console.log("=== 초기화 완료 ===");
}

document.addEventListener("DOMContentLoaded", () => {
  if (initialized) return;
  initialized = true;
  initializeApp();
});

