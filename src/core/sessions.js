// 전역 변수 보호: 기존 sessions가 있으면 재사용, 없으면 새로 생성
const createSessions = () => ({
  Before: { 
    imgSide: null, 
    imgFront: null, 
    sidePoints: new Map(),
    frontPoints: new Map(),
    metrics: {}, 
    score: null, 
    analysis: null,
    poseData: null
  },
  After: { 
    imgSide: null, 
    imgFront: null, 
    sidePoints: new Map(),
    frontPoints: new Map(),
    metrics: {}, 
    score: null, 
    analysis: null,
    poseData: null
  }
});

// 전역 보호: window.sessions가 이미 있으면 재사용
export const sessions = (typeof window !== 'undefined' && window.sessions && 
                        window.sessions.Before && window.sessions.After) 
  ? window.sessions 
  : createSessions();

// sessions를 window에 명시적으로 할당 (전역 접근 가능하도록)
if(typeof window !== 'undefined') {
  if (!window.sessions || !window.sessions.Before || !window.sessions.After) {
    window.sessions = sessions;
    console.log("✅ sessions 객체가 window.sessions에 할당되었습니다.", { 
      hasBefore: !!window.sessions.Before, 
      hasAfter: !!window.sessions.After 
    });
  } else {
    console.log("✅ 기존 window.sessions 재사용");
  }
}

