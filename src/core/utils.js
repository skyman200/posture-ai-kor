// src/core/utils.js - 이미지 로드/NaN 방어 및 유틸리티 함수

/**
 * 이미지가 완전히 로드되었는지 확인
 * @param {HTMLImageElement} img - 확인할 이미지
 * @returns {Promise<HTMLImageElement>}
 */
export async function ensureImageLoaded(img) {
  if (!img) {
    throw new Error("이미지가 제공되지 않았습니다.");
  }
  
  if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
    return img;
  }
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img);
      } else {
        reject(new Error("이미지 로드 실패: 유효하지 않은 크기"));
      }
    };
    img.onerror = () => {
      reject(new Error("이미지 로드 실패"));
    };
    
    // 이미 로드 중이면 이벤트 리스너만 추가
    if (img.src && !img.complete) {
      // 이미지가 로딩 중이면 onload를 기다림
      return;
    }
    
    // 이미 완료되었지만 크기가 0이면 에러
    reject(new Error("이미지 크기가 0입니다"));
  });
}

/**
 * NaN/Infinity 좌표 필터링
 * @param {number} value - 검사할 값
 * @param {number} maxValue - 최대값 (기본값: 10000)
 * @returns {number|null} - 유효한 값 또는 null
 */
export function filterValidCoordinate(value, maxValue = 10000) {
  if (typeof value !== 'number') return null;
  if (Number.isNaN(value) || !Number.isFinite(value)) return null;
  if (value < 0 || value > maxValue) return null;
  return value;
}

/**
 * 키포인트 객체의 좌표 검증 및 필터링
 * @param {Object} point - {x, y, score?} 형태의 키포인트
 * @param {number} imgWidth - 이미지 너비
 * @param {number} imgHeight - 이미지 높이
 * @returns {Object|null} - 검증된 키포인트 또는 null
 */
export function validateKeypoint(point, imgWidth, imgHeight) {
  if (!point || typeof point !== 'object') return null;
  
  const x = filterValidCoordinate(point.x, imgWidth);
  const y = filterValidCoordinate(point.y, imgHeight);
  
  if (x === null || y === null) return null;
  
  return {
    x,
    y,
    score: typeof point.score === 'number' && !Number.isNaN(point.score) 
      ? Math.max(0, Math.min(1, point.score)) 
      : 0.5
  };
}

/**
 * 좌표 배열 검증
 * @param {Array} points - 키포인트 배열
 * @param {number} imgWidth - 이미지 너비
 * @param {number} imgHeight - 이미지 높이
 * @returns {Array} - 검증된 키포인트 배열
 */
export function validateKeypoints(points, imgWidth, imgHeight) {
  if (!Array.isArray(points)) return [];
  
  return points
    .map(p => validateKeypoint(p, imgWidth, imgHeight))
    .filter(p => p !== null);
}

// 이 함수들은 index.html에 정의되어 있으므로 window에서 참조
export const resizeCanvasFor = (...args) => window.resizeCanvasFor?.(...args);
export const draw = (...args) => window.draw?.(...args);
export const updateCompare = (...args) => window.updateCompare?.(...args);
