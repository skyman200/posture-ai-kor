export const sessions = {
  Before: { 
    imgSide: null, 
    imgFront: null, 
    sidePoints: new Map(),
    frontPoints: new Map(),
    metrics: {}, 
    score: null, 
    analysis: null 
  },
  After: { 
    imgSide: null, 
    imgFront: null, 
    sidePoints: new Map(),
    frontPoints: new Map(),
    metrics: {}, 
    score: null, 
    analysis: null 
  }
};

// sessions를 window에 명시적으로 할당 (전역 접근 가능하도록)
if(typeof window !== 'undefined') {
  window.sessions = sessions;
  console.log("✅ sessions 객체가 window.sessions에 할당되었습니다.", { 
    hasBefore: !!window.sessions.Before, 
    hasAfter: !!window.sessions.After 
  });
}

