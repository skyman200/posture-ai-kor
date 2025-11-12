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
  
  // 버튼 초기화 함수들 호출 (HTML에 정의된 함수들)
  // 함수들이 아직 로드되지 않았을 수 있으므로 재시도 로직 추가
  const setupButtons = () => {
    const functions = [
      { name: 'setupFileUploads', required: true },
      { name: 'setupResetButton', required: true },
      { name: 'setupCalibrateButton', required: true },
      { name: 'setupCalibrationButtons', required: true },
      { name: 'setupPDFButton', required: true },
      { name: 'setupImageButton', required: true }
    ];
    
    let allReady = true;
    functions.forEach(({ name, required }) => {
      if (typeof window[name] === 'function') {
        try {
          window[name]();
          console.log(`✅ ${name} 실행 완료`);
        } catch (error) {
          console.error(`❌ ${name} 실행 실패:`, error);
        }
      } else if (required) {
        console.warn(`⚠️ ${name} 함수를 찾을 수 없습니다.`);
        allReady = false;
      }
    });
    
    return allReady;
  };
  
  // 함수들이 로드될 때까지 최대 2초 대기 (100ms 간격, 20번 시도)
  let retryCount = 0;
  const maxRetries = 20;
  const trySetupButtons = () => {
    if (setupButtons() || retryCount >= maxRetries) {
      if (retryCount >= maxRetries) {
        console.warn("⚠️ 일부 버튼 초기화 함수를 찾을 수 없지만 계속 진행합니다.");
      }
      return;
    }
    retryCount++;
    setTimeout(trySetupButtons, 100);
  };
  
  trySetupButtons();
  
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
  
  // ✅ 파일 업로드 강제 연결
  bindFileInput();
  
  console.log("=== 초기화 완료 ===");
}

// ✅ 파일 업로드 핸들러
function handleFileUpload(file) {
  console.log("📌 업로드 감지:", file.name);
  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = () => {
    console.log("✅ 이미지 로드됨", img.width, img.height);
    // 기존 handleFileUpload 함수가 있으면 이벤트 객체 형태로 호출
    if (typeof window.handleFileUpload === 'function') {
      const mockEvent = {
        target: {
          files: [file]
        }
      };
      window.handleFileUpload(mockEvent);
    }
  };
  img.onerror = () => {
    console.error("❌ 이미지 로드 실패");
    alert("이미지를 불러올 수 없습니다.");
  };
}

// ✅ input 연결 강제 바인딩
function bindFileInput() {
  const filePicker = document.getElementById("filePicker");
  const cameraPicker = document.getElementById("cameraPicker");
  
  if (!filePicker && !cameraPicker) {
    console.warn("⚠️ filePicker/cameraPicker 없음 → 0.5초 후 재시도");
    setTimeout(bindFileInput, 500);
    return;
  }
  
  if (filePicker) {
    filePicker.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
      }
    });
    console.log("✅ filePicker 이벤트 연결 완료");
  }
  
  if (cameraPicker) {
    cameraPicker.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
      }
    });
    console.log("✅ cameraPicker 이벤트 연결 완료");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (initialized) return;
  initialized = true;
  initializeApp();
});

