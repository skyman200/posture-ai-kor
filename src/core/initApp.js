import { sessions } from "./sessions.js";
import { resizeCanvasFor, draw, updateCompare } from "./utils.js";
import { computeMetricsOnly, liveAnalyzer } from "../ai/analyzer.js";
import { ModelLoader } from "../ai/modelLoader.js";

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
  
  // 버튼 초기화 함수들 직접 구현 (HTML 인라인 스크립트가 번들에 포함되지 않으므로)
  const setupButtonsDirectly = () => {
    // setupResetButton 직접 구현
    if (typeof window.setupResetButton !== 'function') {
      window.setupResetButton = function() {
        const btnReset = document.getElementById("btnReset");
        if (!btnReset) {
          console.warn("Reset 버튼을 찾을 수 없습니다.");
          return;
        }
        const handler = () => {
          const orientation = window.sessions?.[window.cur || "Before"]?.poseData?.orientation || "side";
          const currentSession = window.sessions?.[window.cur || "Before"];
          if (!currentSession) return;
          const currentPoints = orientation === "front" ? currentSession.frontPoints : currentSession.sidePoints;
          if (currentPoints && currentPoints.clear) currentPoints.clear();
          if (typeof window.draw === 'function') window.draw();
          if (typeof window.computeMetricsOnly === 'function') window.computeMetricsOnly();
        };
        btnReset.addEventListener('click', handler, { passive: true });
        btnReset.addEventListener('touchstart', (e) => {
          e.preventDefault();
          handler(e);
        }, { passive: false });
        console.log("✅ Reset 버튼 이벤트 연결 완료");
      };
    }
    
    // setupCalibrateButton 직접 구현
    if (typeof window.setupCalibrateButton !== 'function') {
      let calibrationMode = false;
      window.setupCalibrateButton = function() {
        const btnCalibrate = document.getElementById("btnCalibrate");
        if (!btnCalibrate) {
          console.warn("캘리브레이션 버튼을 찾을 수 없습니다.");
          return;
        }
        const handler = () => {
          calibrationMode = !calibrationMode;
          const panel = document.getElementById("calibrationPanel");
          const S = window.sessions?.[window.cur || "Before"];
          const cv = document.getElementById("cv");
          
          if (calibrationMode) {
            if (panel) panel.style.display = "block";
            if (S) {
              S.calibrationPoint1 = null;
              S.calibrationPoint2 = null;
            }
            if (cv) cv.style.cursor = "crosshair";
            if (typeof window.draw === 'function') window.draw();
          } else {
            if (panel) panel.style.display = "none";
            if (cv) cv.style.cursor = "default";
            if (S) {
              S.calibrationPoint1 = null;
              S.calibrationPoint2 = null;
            }
            if (typeof window.draw === 'function') window.draw();
          }
        };
        btnCalibrate.addEventListener('click', handler, { passive: true });
        btnCalibrate.addEventListener('touchstart', (e) => {
          e.preventDefault();
          handler(e);
        }, { passive: false });
        console.log("✅ 캘리브레이션 버튼 이벤트 연결 완료");
      };
    }
    
    // setupCalibrationButtons 직접 구현 (간단 버전)
    if (typeof window.setupCalibrationButtons !== 'function') {
      window.setupCalibrationButtons = function() {
        const btnConfirm = document.getElementById("btnConfirmCalibration");
        const btnCancel = document.getElementById("btnCancelCalibration");
        
        if (btnConfirm) {
          const handler = () => {
            const S = window.sessions?.[window.cur || "Before"];
            if (!S || !S.calibrationPoint1 || !S.calibrationPoint2) {
              alert("두 점을 모두 선택해주세요.");
              return;
            }
            const realLengthCm = parseFloat(document.getElementById("calibrationLength")?.value || "0");
            if (!realLengthCm || realLengthCm <= 0) {
              alert("실제 길이(cm)를 올바르게 입력해주세요.");
              return;
            }
            // 캘리브레이션 로직은 기존 함수 사용
            if (typeof window.calibratePxPerCm === 'function') {
              try {
                const pxPerCm = window.calibratePxPerCm(S.calibrationPoint1, S.calibrationPoint2, realLengthCm);
                S.pxPerCm = pxPerCm;
                const resultEl = document.getElementById("calibrationResult");
                if (resultEl) {
                  resultEl.textContent = `✅ 캘리브레이션 완료: ${pxPerCm.toFixed(2)} px/cm`;
                  resultEl.style.color = "#2ec4b6";
                }
                if (typeof window.computeMetricsOnly === 'function') window.computeMetricsOnly();
                if (typeof window.setupCalibrateButton === 'function') window.setupCalibrateButton();
              } catch (error) {
                alert(`캘리브레이션 실패: ${error.message}`);
              }
            }
          };
          btnConfirm.addEventListener('click', handler, { passive: true });
          btnConfirm.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handler(e);
          }, { passive: false });
        }
        
        if (btnCancel) {
          const handler = () => {
            if (typeof window.setupCalibrateButton === 'function') window.setupCalibrateButton();
          };
          btnCancel.addEventListener('click', handler, { passive: true });
          btnCancel.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handler(e);
          }, { passive: false });
        }
        console.log("✅ 캘리브레이션 관련 버튼 이벤트 연결 완료");
      };
    }
    
    // setupPDFButton 직접 구현
    if (typeof window.setupPDFButton !== 'function') {
      window.setupPDFButton = function() {
        const btnPDF = document.getElementById("btnPDF");
        if (!btnPDF) {
          console.warn("PDF 버튼을 찾을 수 없습니다.");
          return;
        }
        // 기존 이벤트 리스너 제거 (중복 방지)
        const newBtn = btnPDF.cloneNode(true);
        btnPDF.parentNode.replaceChild(newBtn, btnPDF);
        
        newBtn.addEventListener('click', async () => {
          try {
            const btn = document.getElementById("btnPDF");
            const originalText = btn.textContent;
            btn.textContent = "⏳ PDF 생성 중...";
            btn.disabled = true;
            
            let centerName = prompt("센터 이름을 입력하세요:", localStorage.getItem('centerName') || "") || null;
            if(centerName) localStorage.setItem('centerName', centerName);
            
            let memberName = prompt("회원 이름을 입력하세요:", localStorage.getItem('memberName') || "") || null;
            if(memberName) localStorage.setItem('memberName', memberName);
            
            if(!centerName || !memberName) {
              if(!confirm("센터 이름 또는 회원 이름이 입력되지 않았습니다. 계속하시겠습니까?")) {
                btn.textContent = originalText;
                btn.disabled = false;
                return;
              }
            }
            
            // 라이브러리 로드 대기
            let retryCount = 0;
            while ((typeof html2canvas === 'undefined' || !window.jspdf) && retryCount < 30) {
              await new Promise(resolve => setTimeout(resolve, 100));
              retryCount++;
            }
            
            const S = window.sessions?.[window.cur || "Before"];
            const hasSidePoints = S?.sidePoints && (S.sidePoints.size > 0 || Object.keys(S.sidePoints).length > 0);
            const hasFrontPoints = S?.frontPoints && (S.frontPoints.size > 0 || Object.keys(S.frontPoints).length > 0);
            if (!S || (!hasSidePoints && !hasFrontPoints)) {
              alert("먼저 이미지를 업로드하고 분석을 완료해주세요.");
              btn.textContent = originalText;
              btn.disabled = false;
              return;
            }
            
            if (typeof window.exportAsPdf === 'function') {
              await window.exportAsPdf({
                userName: localStorage.getItem('userName') || memberName || "사용자",
                centerName: centerName,
                memberName: memberName,
                appName: 'DIT 자세 분석 AI'
              });
            } else {
              alert("PDF 생성 함수를 찾을 수 없습니다.");
            }
            
            btn.textContent = originalText;
            btn.disabled = false;
          } catch(error) {
            console.error("❌ PDF 생성 실패:", error);
            alert("PDF 생성에 실패했습니다: " + (error.message || '알 수 없는 오류'));
            const btn = document.getElementById("btnPDF");
            if (btn) {
              btn.textContent = "📄 PDF 저장";
              btn.disabled = false;
            }
          }
        });
        console.log("✅ PDF 버튼 이벤트 연결 완료");
      };
    }
    
    // setupImageButton 직접 구현
    if (typeof window.setupImageButton !== 'function') {
      window.setupImageButton = function() {
        const btnImage = document.getElementById("btnImage");
        if (!btnImage) {
          console.warn("이미지 버튼을 찾을 수 없습니다.");
          return;
        }
        
        btnImage.onclick = async () => {
          const btn = document.getElementById("btnImage");
          const originalText = btn.textContent;
          btn.textContent = "⏳ 이미지 생성 중...";
          btn.disabled = true;
          try {
            if (typeof html2canvas === 'undefined') {
              throw new Error("html2canvas 라이브러리가 로드되지 않았습니다.");
            }
            const memberNameDisplay = localStorage.getItem('memberName') || window.memberName || '회원';
            const centerNameDisplay = localStorage.getItem('centerName') || window.centerName || '';
            
            if (typeof window.captureReportCanvases === 'function' && typeof window.combineCanvasesVertical === 'function' && typeof window.downloadCanvasAsImage === 'function') {
              const pageData = await window.captureReportCanvases({
                centerName: centerNameDisplay,
                memberName: memberNameDisplay,
                appName: 'DIT 자세 분석 AI',
                logoUrl: null
              });
              const orderedCanvases = [
                pageData.canvases.cover,
                ...(pageData.includeHeatmapPage && pageData.canvases.heatmap ? [pageData.canvases.heatmap] : []),
                pageData.canvases.metrics,
                pageData.canvases.aiSummary,
                pageData.canvases.pilates,
                pageData.canvases.aiDeep,
                pageData.canvases.conclusion
              ].filter(Boolean);
              if (!orderedCanvases.length) {
                throw new Error("저장할 페이지가 없습니다.");
              }
              const combinedCanvas = window.combineCanvasesVertical(orderedCanvases);
              const imageFileName = `${centerNameDisplay || 'DIT'}_${memberNameDisplay || '회원'}_자세분석리포트_${new Date().toISOString().split('T')[0]}.png`;
              await window.downloadCanvasAsImage(combinedCanvas, imageFileName, btn, originalText);
            } else {
              throw new Error("이미지 생성 함수를 찾을 수 없습니다.");
            }
          } catch (error) {
            console.error("전체 이미지 생성 실패:", error);
            alert("이미지 생성 중 오류가 발생했습니다: " + (error?.message || "알 수 없는 오류"));
            btn.textContent = originalText || "🖼️ 이미지 저장";
            btn.disabled = false;
          }
        };
        console.log("✅ 이미지 버튼 이벤트 연결 완료");
      };
    }
    
    // 직접 구현한 함수들 실행
    if (typeof window.setupResetButton === 'function') window.setupResetButton();
    if (typeof window.setupCalibrateButton === 'function') window.setupCalibrateButton();
    if (typeof window.setupCalibrationButtons === 'function') window.setupCalibrationButtons();
    if (typeof window.setupPDFButton === 'function') window.setupPDFButton();
    if (typeof window.setupImageButton === 'function') window.setupImageButton();
  };
  
  setupButtonsDirectly();
  
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
    
    // 버튼별 리스너 등록 여부 추적
    const buttonListeners = new WeakMap();
    
    const addClickHandler = (btn, handler) => {
      if (btn) {
        // 기존 리스너가 있으면 제거 (중복 방지)
        if (buttonListeners.has(btn)) {
          const oldHandler = buttonListeners.get(btn);
          btn.removeEventListener('click', oldHandler.click);
          btn.removeEventListener('touchstart', oldHandler.touch);
        }
        
        // 새 리스너 등록
        const clickHandler = (e) => {
          e.stopPropagation();
          handler(e);
        };
        const touchHandler = (e) => {
          e.preventDefault();
          e.stopPropagation();
          handler(e);
        };
        
        btn.addEventListener('click', clickHandler, { passive: true });
        btn.addEventListener('touchstart', touchHandler, { passive: false });
        
        // 리스너 저장 (나중에 제거하기 위해)
        buttonListeners.set(btn, { click: clickHandler, touch: touchHandler });
        
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
  
  // 직접 연결은 한 번만 실행 (중복 방지)
  let sessionButtonsSetup = false;
  const tryInitSessionButtons = () => {
    // 직접 연결은 한 번만 실행
    if (!sessionButtonsSetup) {
      setupSessionButtonsDirectly();
      sessionButtonsSetup = true;
    }
    
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
  
  // ✅ UI 비활성화 (모델 로딩 전까지)
  disableUI();
  
  if (window.resizeCanvasFor) window.resizeCanvasFor(null);
  if (window.draw) window.draw();
  if (window.computeMetricsOnly) window.computeMetricsOnly();
  if (window.updateCompare) window.updateCompare();
  
  // ✅ 모델 로딩 (싱글톤 패턴으로 1회만 실행)
  try {
    await ModelLoader.loadModels();
    console.log("✅ 모델 로딩 완료");
  } catch (err) {
    console.error("❌ 모델 로딩 실패:", err);
    // 모델 로딩 실패해도 UI는 활성화 (폴백 모드)
  }
  
  // ✅ UI 활성화 (모델 로딩 완료 후)
  enableUI();
  
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

// ✅ UI 비활성화 함수
function disableUI() {
  const buttons = document.querySelectorAll('button, .btn');
  buttons.forEach(btn => {
    if (!btn.disabled) {
      btn.dataset.wasEnabled = 'true';
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    }
  });
  console.log("🔒 UI 비활성화 (모델 로딩 중)");
}

// ✅ UI 활성화 함수
function enableUI() {
  const buttons = document.querySelectorAll('button, .btn');
  buttons.forEach(btn => {
    if (btn.dataset.wasEnabled === 'true') {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      delete btn.dataset.wasEnabled;
    }
  });
  console.log("🔓 UI 활성화 (모델 로딩 완료)");
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
