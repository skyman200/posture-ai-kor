import { sessions } from "./sessions.js";
import { resizeCanvasFor, draw, updateCompare } from "./utils.js";
import { computeMetricsOnly, liveAnalyzer } from "../ai/analyzer.js";
import { loadModels } from "../ai/modelLoader.js";

let initialized = false;

async function initializeApp() {
  console.log("🚀 initializeApp 실행됨");
  console.log("📦 sessions 상태:", sessions);
  
  // 전역 변수 보호: sessions가 window에 할당되었는지 확인
  if (typeof window !== 'undefined') {
    if (!window.sessions || !window.sessions.Before || !window.sessions.After) {
      window.sessions = sessions;
      console.log("✅ sessions를 window.sessions에 할당했습니다.");
    } else {
      console.log("✅ 기존 window.sessions 재사용");
    }
    
    // cur 보호
    if (typeof window.cur === 'undefined') {
      window.cur = "Before";
    }
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
  // initSessionButtons는 HTML에 정의된 전역 함수이므로 window를 통해 접근
  // 최대 3초 동안 재시도 (30번) - HTML 스크립트가 로드될 시간 확보
  let retryCount2 = 0;
  const maxRetries2 = 30;
  
  // 직접 버튼 연결 함수 (fallback)
  const setupSessionButtonsDirectly = () => {
    const btnBefore = document.getElementById("btnBefore");
    const btnAfter = document.getElementById("btnAfter");
    const btnOrientationSide = document.getElementById("btnOrientationSide");
    const btnOrientationFront = document.getElementById("btnOrientationFront");
    const btnReset = document.getElementById("btnReset");
    const btnCalibrate = document.getElementById("btnCalibrate");
    
    const addClickHandler = (btn, handler) => {
      if (btn) {
        // 기존 이벤트 리스너가 있는지 확인하고 추가
        // 중복 방지를 위해 once 옵션은 사용하지 않음 (여러 번 클릭 가능해야 함)
        btn.addEventListener('click', handler, { passive: true });
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          handler(e);
        }, { passive: false });
        console.log(`✅ ${btn.id} 직접 연결 완료`);
        return btn;
      }
      return null;
    };
    
    if (btnBefore) {
      const handler = () => {
        console.log("Before 버튼 클릭됨");
        if (typeof window.switchSession === 'function') {
          window.switchSession("Before");
        }
      };
      addClickHandler(btnBefore, handler);
    }
    
    if (btnAfter) {
      const handler = () => {
        console.log("After 버튼 클릭됨");
        if (typeof window.switchSession === 'function') {
          window.switchSession("After");
        }
      };
      addClickHandler(btnAfter, handler);
    }
    
    if (btnOrientationSide) {
      const handler = () => {
        console.log("옆모습 버튼 클릭됨");
        if (typeof window.setOrientation === 'function') {
          window.setOrientation("side", { manual: true });
        }
      };
      addClickHandler(btnOrientationSide, handler);
    }
    
    if (btnOrientationFront) {
      const handler = () => {
        console.log("정면 버튼 클릭됨");
        if (typeof window.setOrientation === 'function') {
          window.setOrientation("front", { manual: true });
        }
      };
      addClickHandler(btnOrientationFront, handler);
    }
    
    if (btnReset) {
      const handler = () => {
        console.log("Reset 버튼 클릭됨");
        const orientation = window.sessions?.[window.cur || "Before"]?.poseData?.orientation || "side";
        const currentSession = window.sessions?.[window.cur || "Before"];
        if (!currentSession) return;
        const currentPoints = orientation === "front" ? currentSession.frontPoints : currentSession.sidePoints;
        if (currentPoints && currentPoints.clear) currentPoints.clear();
        if (typeof window.draw === 'function') window.draw();
        if (typeof window.computeMetricsOnly === 'function') window.computeMetricsOnly();
      };
      addClickHandler(btnReset, handler);
    }
    
    if (btnCalibrate) {
      const handler = () => {
        console.log("캘리브레이션 버튼 클릭됨");
        if (typeof window.setupCalibrateButton === 'function') {
          // setupCalibrateButton이 이미 실행되었을 수 있으므로 직접 토글
          const panel = document.getElementById("calibrationPanel");
          if (panel) {
            const isVisible = panel.style.display !== "none";
            panel.style.display = isVisible ? "none" : "block";
          }
        }
      };
      addClickHandler(btnCalibrate, handler);
    }
  };
  
  const tryInitSessionButtons = () => {
    // 항상 직접 연결도 함께 실행 (이중 보호)
    setupSessionButtonsDirectly();
    
    if (typeof window.initSessionButtons === 'function') {
      try {
        window.initSessionButtons();
        console.log("✅ initSessionButtons 실행 완료");
      } catch (error) {
        console.error("❌ initSessionButtons 실행 실패:", error);
      }
    } else if (retryCount2 < maxRetries2) {
      retryCount2++;
      setTimeout(tryInitSessionButtons, 100);
    } else {
      console.warn("⚠️ initSessionButtons 함수를 찾을 수 없지만 직접 연결은 완료됨");
    }
  };
  
  tryInitSessionButtons();
  
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
  
  if (window.resizeCanvasFor) window.resizeCanvasFor(null);
  if (window.draw) window.draw();
  if (window.computeMetricsOnly) window.computeMetricsOnly();
  if (window.updateCompare) window.updateCompare();
  
  await loadModels();
  
  // liveAnalyzer를 window에 노출
  window.liveAnalyzer = liveAnalyzer;
  
  setTimeout(() => {
    if (window.liveAnalyzer && window.liveAnalyzer.analyzeCurrentSession) {
      window.liveAnalyzer.analyzeCurrentSession();
    }
  }, 500);
  
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
