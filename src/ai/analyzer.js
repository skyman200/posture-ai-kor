import { sessions } from "../core/sessions.js";

export const liveAnalyzer = { 
  analyzeCurrentSession() { 
    console.log("🔥 liveAnalyzer 실행됨", sessions); 
  } 
};

export function computeMetricsOnly() { 
  console.log("📊 computeMetricsOnly 실행(분석 X)"); 
  // TODO: 실제 구현은 기존 코드에서 가져와야 함
  // 현재는 최소 구현만
}

