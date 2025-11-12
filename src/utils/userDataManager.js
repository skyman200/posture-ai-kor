/**
 * ✅ 사용자별 localStorage 데이터 관리 유틸리티
 * - 브라우저별로 완전히 분리된 데이터 저장
 * - 사용자 ID 기반 데이터 격리
 */

export const UserDataManager = (() => {
  // 사용자 ID 가져오기 (또는 생성)
  const getUserId = () => {
    let userId = localStorage.getItem('diposture_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('diposture_user_id', userId);
    }
    return userId;
  };

  // 키 생성 (사용자별 고유 키)
  const makeKey = (key) => {
    const userId = getUserId();
    return `diposture_${userId}_${key}`;
  };

  // 데이터 저장
  const save = (key, data) => {
    try {
      const storageKey = makeKey(key);
      const json = JSON.stringify(data);
      localStorage.setItem(storageKey, json);
      return true;
    } catch (err) {
      console.error('❌ 데이터 저장 실패:', err);
      return false;
    }
  };

  // 데이터 불러오기
  const load = (key, defaultValue = null) => {
    try {
      const storageKey = makeKey(key);
      const json = localStorage.getItem(storageKey);
      if (!json) return defaultValue;
      return JSON.parse(json);
    } catch (err) {
      console.error('❌ 데이터 로드 실패:', err);
      return defaultValue;
    }
  };

  // 데이터 삭제
  const remove = (key) => {
    try {
      const storageKey = makeKey(key);
      localStorage.removeItem(storageKey);
      return true;
    } catch (err) {
      console.error('❌ 데이터 삭제 실패:', err);
      return false;
    }
  };

  // 모든 사용자 데이터 삭제 (현재 사용자만)
  const clear = () => {
    try {
      const userId = getUserId();
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`diposture_${userId}_`)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (err) {
      console.error('❌ 데이터 초기화 실패:', err);
      return false;
    }
  };

  // 현재 사용자 ID 반환
  const getCurrentUserId = () => getUserId();

  return {
    save,
    load,
    remove,
    clear,
    getCurrentUserId
  };
})();











