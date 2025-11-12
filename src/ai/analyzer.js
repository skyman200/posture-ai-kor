// src/ai/analyzer.js - 정면 앙상블 분석 통합

import { sessions } from "../core/sessions.js";
import { runFrontAnalysis } from "./ensemblePose.js";
import { ensureImageLoaded } from "../core/utils.js";

/**
 * 정면 이미지 분석 및 키포인트 추출
 * @param {HTMLImageElement} img - 정면 이미지
 * @param {string} sessionName - 세션 이름 ('Before' | 'After')
 * @returns {Promise<Object>} 키포인트 맵
 */
export async function analyzeFrontImage(img, sessionName = 'Before') {
  try {
    // 이미지 로드 확인
    await ensureImageLoaded(img);
    
    // 앙상블 분석 수행
    const keypoints = await runFrontAnalysis(img);
    
    // 세션에 저장
    const session = sessions[sessionName];
    if (session) {
      // frontPoints Map에 저장
      session.frontPoints.clear();
      Object.entries(keypoints).forEach(([key, point]) => {
        if (point && point.x !== undefined && point.y !== undefined) {
          session.frontPoints.set(key, { x: point.x, y: point.y, score: point.score || 0.5 });
        }
      });
      
      // poseData 업데이트
      if (!session.poseData) {
        session.poseData = { orientation: 'front', landmarks: null };
      }
      session.poseData.orientation = 'front';
      session.poseData.landmarks = keypoints;
      
      console.log(`✅ 정면 분석 완료 (${sessionName}):`, Object.keys(keypoints).length, '키포인트');
    }
    
    return keypoints;
  } catch (err) {
    console.error(`❌ 정면 분석 실패 (${sessionName}):`, err);
    throw err;
  }
}

/**
 * 현재 세션 분석 (정면/옆모습 자동 감지)
 */
export const liveAnalyzer = {
  async analyzeCurrentSession() {
    try {
      const sessionName = window.cur || "Before";
      const session = sessions[sessionName];
      
      if (!session) {
        console.warn("세션을 찾을 수 없습니다:", sessionName);
        return;
      }
      
      // 정면 이미지가 있으면 정면 분석
      if (session.imgFront) {
        console.log(`🔥 정면 이미지 분석 시작 (${sessionName})`);
        await analyzeFrontImage(session.imgFront, sessionName);
        
        // UI 업데이트
        if (typeof window.draw === 'function') {
          window.draw();
        }
        if (typeof window.computeMetricsOnly === 'function') {
          window.computeMetricsOnly();
        }
      }
      
      // 옆모습 이미지는 기존 로직 유지 (BlazePose 사용)
      if (session.imgSide) {
        console.log(`🔥 옆모습 이미지 분석 시작 (${sessionName})`);
        // 기존 옆모습 분석 로직은 그대로 유지
        if (typeof window.liveAnalyzer?.analyzeSideImage === 'function') {
          await window.liveAnalyzer.analyzeSideImage(session.imgSide, sessionName);
        }
      }
    } catch (err) {
      console.error("❌ 세션 분석 실패:", err);
    }
  }
};

/**
 * 메트릭만 계산 (분석 없이)
 */
export function computeMetricsOnly() {
  console.log("📊 computeMetricsOnly 실행(분석 X)");
  // TODO: 실제 구현은 기존 코드에서 가져와야 함
  // 현재는 최소 구현만
}

// ✅ window에 노출 (HTML 스크립트에서 접근 가능하도록)
if (typeof window !== 'undefined') {
  window.computeMetricsOnly = computeMetricsOnly;
  window.liveAnalyzer = liveAnalyzer;
  console.log("✅ computeMetricsOnly 및 liveAnalyzer를 window에 노출");
}
