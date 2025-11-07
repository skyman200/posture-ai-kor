// src/ai/analyzerWithDB.js
// ✅ 모든 해석/운동 추천은 Posture_Muscle_DB_Full.json(DB)만 기준으로 수행
// 파일 위치: /public/db/Posture_Muscle_DB_Full.json (fetch('/db/...'))

let POSTURE_DB_CACHE = null;

/**
 * DB 로드 (캐시)
 * @returns {Promise<object>} DB 객체
 */
export async function loadPostureDB() {
  if (POSTURE_DB_CACHE) return POSTURE_DB_CACHE;

  try {
    const res = await fetch('/db/Posture_Muscle_DB_Full.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('DB 로드 실패');
    POSTURE_DB_CACHE = await res.json();
    console.log('✅ DB Loaded:', Object.keys(POSTURE_DB_CACHE).length, 'metrics');
    return POSTURE_DB_CACHE;
  } catch (err) {
    console.error('❌ DB 로드 실패:', err);
    POSTURE_DB_CACHE = {};
    return POSTURE_DB_CACHE;
  }
}

/**
 * 숫자 범위 판단 유틸 (DB가 {min,max} or rule 문자열 둘 다 지원)
 * @param {number} value - 측정값
 * @param {object|string} normal - 정상 범위 (객체 또는 문자열)
 * @returns {boolean|null} 정상 범위 내이면 true, 밖이면 false, 판단 불가면 null
 */
function inRange(value, normal) {
  if (!normal) return null;

  // 객체 형태: {min, max}
  if (typeof normal === 'object' && normal.min != null && normal.max != null) {
    return value >= normal.min && value <= normal.max;
  }

  // 문자열 규칙 예: '≥50°', '≤2cm', '0-10°', '0–10°'
  const s = String(normal).replace(/\s/g, '');
  
  // ≥ 형태: '≥50°' → value >= 50
  if (/^≥/.test(s)) {
    const num = parseFloat(s.replace(/^≥/, '').replace(/[°cm]/, ''));
    return !isNaN(num) ? value >= num : null;
  }
  
  // ≤ 형태: '≤2cm' → value <= 2
  if (/^≤/.test(s)) {
    const num = parseFloat(s.replace(/^≤/, '').replace(/[°cm]/, ''));
    return !isNaN(num) ? value <= num : null;
  }
  
  // 범위 형태: '0-10°' 또는 '0–10°' → value >= 0 && value <= 10
  const rangeMatch = s.match(/^(-?\d+(?:\.\d+)?)[–-](-?\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1]);
    const hi = parseFloat(rangeMatch[2]);
    return !isNaN(lo) && !isNaN(hi) ? value >= lo && value <= hi : null;
  }

  return null;
}

/**
 * 상태 라벨링
 * @param {number} value - 측정값
 * @param {object|string} normal - 정상 범위
 * @returns {string} '정상' | '이상' | '참고'
 */
function statusLabel(value, normal) {
  const ok = inRange(value, normal);
  if (ok === null) return '참고';
  return ok ? '정상' : '이상';
}

/**
 * 하나의 지표를 DB 규칙에 따라 해석
 * @param {string} metricKey - 지표 키 (CVA, PTA, etc.)
 * @param {number} value - 측정값
 * @param {object} dbItem - DB 항목
 * @returns {object} 분석 결과
 */
function analyzeOneMetric(metricKey, value, dbItem) {
  // DB 필드명 매핑 (다양한 필드명 지원)
  const unit = dbItem.unit || dbItem['측정단위'] || '';
  const normal = dbItem.normalRange ?? dbItem.normal ?? dbItem.range ?? dbItem['정상범위'];
  const status = statusLabel(value, normal);

  // 코멘트/패턴/운동은 DB에 있는 걸 그대로 신뢰
  const comment = (dbItem.aiComment && typeof dbItem.aiComment === 'function')
    ? dbItem.aiComment(value, normal)
    : (dbItem.aiComment || dbItem['문제설명'] || '');

  // 근육 패턴
  const tight = dbItem.tight_muscles || dbItem.tight || dbItem['긴장근육(주요)'] || [];
  const weak = dbItem.weak_muscles || dbItem.weak || dbItem['약화근육(주요)'] || [];
  
  // 배열이 아닌 문자열인 경우 분리
  const tightArray = Array.isArray(tight) ? tight : (typeof tight === 'string' ? tight.split(/[,\s]+/).filter(Boolean) : []);
  const weakArray = Array.isArray(weak) ? weak : (typeof weak === 'string' ? weak.split(/[,\s]+/).filter(Boolean) : []);

  // 필라테스 세션
  let pilates = dbItem.pilates || dbItem.pilatesSession || [];
  
  // DB가 객체 형태로 저장된 경우 배열로 변환
  if (!Array.isArray(pilates) && typeof pilates === 'object') {
    pilates = [];
    ['mat', 'reformer', 'cadillac', 'chair', 'barrel'].forEach(equipment => {
      const key = `필라테스운동(${equipment.charAt(0).toUpperCase() + equipment.slice(1)})`;
      const value = dbItem[key] || dbItem[equipment];
      if (value) {
        pilates.push({
          equipment: equipment,
          name: value,
          purpose: dbItem[`${equipment}_purpose`] || ''
        });
      }
    });
  }

  // 정상 범위 텍스트 생성
  let normalText = '';
  if (typeof normal === 'object' && normal.min != null && normal.max != null) {
    normalText = `${normal.min}~${normal.max}${unit}`;
  } else if (normal) {
    normalText = String(normal);
  }

  return {
    metric: metricKey,
    name: dbItem.name || dbItem['지표명'] || metricKey,
    value,
    unit,
    normalText,
    status,
    pattern: dbItem.pattern || dbItem.patternSummary || dbItem['임상적의미'] || '',
    tight: tightArray,
    weak: weakArray,
    pilates: Array.isArray(pilates) ? pilates : [],
    exerciseGuide: dbItem.exerciseGuide || dbItem.coaching || dbItem['교정운동(도수/자가)'] || ''
  };
}

/**
 * ✅ DB 기반 통합 분석
 * @param {object} measured - 측정값 객체
 *   예: { side: {CVA: 53.1, PTA: 28.1, ...}, front: {STA: 2.1, POA: 4.3, ...} }
 *   또는: { CVA: 53.1, PTA: 28.1, STA: 2.1, ... } (flat 구조)
 * @returns {Promise<object>} 분석 결과
 *   - results: 지표별 상세 분석 배열
 *   - sections: 섹션별 요약
 *   - tightAll: 긴장 근육 통합
 *   - weakAll: 약화 근육 통합
 *   - pilatesAll: 필라테스 추천 통합
 */
export async function analyzeWithDB(measured) {
  const db = await loadPostureDB();

  const results = [];
  const sections = [];

  // 섹션별(측면/정면)로 있든, 단일로 있든 전부 flat하게 순회
  const flatPairs = [];
  
  for (const [groupKey, groupVal] of Object.entries(measured || {})) {
    if (typeof groupVal === 'object' && groupVal !== null && !Array.isArray(groupVal)) {
      // 섹션 객체 (side, front 등)
      for (const [metric, value] of Object.entries(groupVal)) {
        if (value != null && !Number.isNaN(Number(value))) {
          flatPairs.push([metric, value, groupKey]); // groupKey: 'side' | 'front' 등
        }
      }
    } else if (typeof groupVal === 'number' && !Number.isNaN(groupVal)) {
      // 직접 값 (flat 구조)
      flatPairs.push([groupKey, groupVal, '']);
    }
  }

  // DB에서 각 지표 찾아서 분석
  for (const [metricKey, value, group] of flatPairs) {
    // DB에서 지표 찾기 (다양한 키 형태 지원)
    let dbItem = db[metricKey];
    
    // DB가 배열 형태인 경우 (기존 구조 호환)
    if (Array.isArray(db)) {
      dbItem = db.find(item => {
        const dbCode = String(item['지표코드'] || item.metric || item.code || '').toUpperCase();
        return dbCode === metricKey.toUpperCase();
      });
    } else if (!dbItem) {
      // 키가 정확히 일치하지 않으면 대소문자 무시 검색
      const upperKey = metricKey.toUpperCase();
      dbItem = db[upperKey] || Object.values(db).find(item => {
        const itemKey = String(item['지표코드'] || item.metric || item.code || '').toUpperCase();
        return itemKey === upperKey;
      });
    }

    if (!dbItem) {
      console.warn(`⚠️ DB에 ${metricKey} 지표가 없습니다.`);
      continue; // DB에 정의된 지표만 해석
    }

    const r = analyzeOneMetric(metricKey, Number(value), dbItem);
    r.section = group;
    results.push(r);
  }

  // 섹션 요약 (문장)
  const bySection = results.reduce((acc, r) => {
    const sec = r.section || 'general';
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(r);
    return acc;
  }, {});

  for (const [sec, arr] of Object.entries(bySection)) {
    const txt = arr.map(a => 
      `${a.name}: ${a.value}${a.unit} (${a.status}${a.normalText ? ` / 정상:${a.normalText}` : ''})`
    ).join(' · ');
    sections.push({ section: sec, summary: txt });
  }

  // 종합 권고(근육/운동) — DB 데이터 그대로 묶어서 중복 제거
  const tightAll = [...new Set(results.flatMap(r => r.tight).filter(Boolean))];
  const weakAll = [...new Set(results.flatMap(r => r.weak).filter(Boolean))];
  const pilatesAll = [];
  
  const pilatesMap = new Map();
  results.forEach(r => {
    (Array.isArray(r.pilates) ? r.pilates : []).forEach(p => {
      const key = `${p?.equipment || ''}:${p?.name || ''}`;
      if (!pilatesMap.has(key)) {
        pilatesMap.set(key, p);
        pilatesAll.push(p);
      }
    });
  });

  return {
    results,          // 지표별 상세
    sections,         // 섹션 한 줄 요약
    tightAll,         // 긴장 근육 통합
    weakAll,          // 약화 근육 통합
    pilatesAll        // 필라테스 통합(중복 제거)
  };
}


