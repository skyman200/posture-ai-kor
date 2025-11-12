true&&(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
}());

const scriptRel = 'modulepreload';const assetsURL = function(dep) { return "/posture-ai-kor/"+dep };const seen = {};const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (true && deps && deps.length > 0) {
    document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector(
      "meta[property=csp-nonce]"
    );
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = Promise.allSettled(
      deps.map((dep) => {
        dep = assetsURL(dep);
        if (dep in seen) return;
        seen[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link = document.createElement("link");
        link.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link.as = "script";
        }
        link.crossOrigin = "";
        link.href = dep;
        if (cspNonce) {
          link.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link);
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener("load", res);
            link.addEventListener(
              "error",
              () => rej(new Error(`Unable to preload CSS for ${dep}`))
            );
          });
        }
      })
    );
  }
  function handlePreloadError(err) {
    const e = new Event("vite:preloadError", {
      cancelable: true
    });
    e.payload = err;
    window.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw err;
    }
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};

// @mediapipe/pose를 전역에서 사용 가능하도록 먼저 로드
  (async function() {
    if (window.MP_Pose) {
      console.log('✅ @mediapipe/pose already loaded');
      return;
    }
    try {
      const mpModule = await __vitePreload(() => import('https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.164/pose.js'),true?[]:void 0);
      window.MP_Pose = mpModule.default || mpModule.Pose || mpModule;
      // 전역 변수로도 노출 (pose-detection 라이브러리 호환성)
      if (typeof window !== 'undefined' && !window.Pose) {
        window.Pose = window.MP_Pose;
      }
      console.log('✅ @mediapipe/pose preloaded globally');
    } catch (err) {
      console.warn('⚠️ @mediapipe/pose preload failed (will retry later):', err);
    }
  })();

// modelManager: front/side 모델을 분리 로드하고 UI 잠금/해제를 담당
  function lockUI(reason = 'loading') {
    document.getElementById('btnAIAnalysis');
    const overlayId = 'model-manager-overlay';
    let ov = document.getElementById(overlayId);
    if (!ov) {
      ov = document.createElement('div');
      ov.id = overlayId;
      ov.style.position = 'fixed';
      ov.style.top = '0';
      ov.style.left = '0';
      ov.style.width = '100%';
      ov.style.height = '100%';
      ov.style.background = 'rgba(0,0,0,0.25)';
      ov.style.display = 'flex';
      ov.style.alignItems = 'center';
      ov.style.justifyContent = 'center';
      ov.style.zIndex = '99999';
      ov.innerHTML = `<div style="padding:18px 20px; border-radius:12px; background:#0f1720; color:#fff; max-width:520px; font-family:var(--font-body); box-shadow:0 10px 30px rgba(0,0,0,0.6);">` +
        `<div style="font-weight:700; margin-bottom:8px;">모델 로딩 중…</div>` +
        `<div id="modelManagerStatus" style="font-size:13px; color:#cbd5e1; line-height:1.4;">잠시만 기다려주세요.</div>` +
        `</div>`;
      document.body.appendChild(ov);
    }
  }

  function unlockUI() {
    const aiBtn = document.getElementById('btnAIAnalysis');
    if (aiBtn) aiBtn.disabled = false;
    const ov = document.getElementById('model-manager-overlay');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
  }

    // 안전한 동적 import를 위한 폴백(브라우저가 importmap을 지원하지 않을 때)
    async function ensureMediapipePoseAvailable() {
      if (typeof window.MP_Pose !== 'undefined') return;
      try {
        // import map을 지원하면 importmap을 통해 매핑된 specifier가 해결됨
        // 없으면 CDN 경로로 직접 동적 import
        const url = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.164/pose.js';
        const mod = await import(url);
        // Some builds export default or named exports; provide a safe global
        window.MP_Pose = (mod && (mod.default || mod.Pose || mod)) || {};
        console.log('✅ @mediapipe/pose loaded via CDN fallback');
      } catch (err) {
        console.warn('⚠️ @mediapipe/pose 로드 실패 (CDN 시도):', err);
      }
    }

    // 모델 로더 래퍼: TF 먼저 로드하고, mediapipe specifier 문제를 우회
    async function loadPoseModelsSafe() {
      try {
        // 1) TF 불러오기 (기존의 loadTfOnce 사용)
        if (typeof window.loadTfOnce === 'function') {
          await window.loadTfOnce();
        } else if (typeof window.tf === 'undefined') {
          console.warn('⚠️ TensorFlow.js 로더가 없습니다.');
        }

        // 2) mediapipe fallback 확보
        await ensureMediapipePoseAvailable();

        // 3) 프로젝트의 기존 loadPoseModels가 있으면 호출
        if (typeof window.loadPoseModels === 'function') {
          await window.loadPoseModels();
        } else if (typeof window.loadModels === 'function') {
          await window.loadModels();
        } else {
          console.warn('⚠️ loadPoseModels / loadModels 함수가 없습니다.');
        }

        // 4) 해제
        unlockUI();
        const statusEl = document.getElementById('modelManagerStatus');
        if (statusEl) statusEl.textContent = '모델 로딩 완료.';
      } catch (err) {
        console.error('모델 로딩 중 오류:', err);
        const statusEl = document.getElementById('modelManagerStatus');
        if (statusEl) statusEl.textContent = '모델 로딩 실패: ' + (err && err.message ? err.message : String(err));
        // UI 잠금 해제는 상황에 따라 유지할 수 있도록 하지 않음 — 개발자가 상태 확인 후 수동으로 해제
      }
    }

    // 즉시 모델 로드 시도
    lockUI();
    // 비동기 로드 시작 (오래 걸리는 작업)
    setTimeout(() => {
      loadPoseModelsSafe().catch(err => console.error('loadPoseModelsSafe error', err));
    }, 0);
