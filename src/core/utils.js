// 이 함수들은 index.html에 정의되어 있으므로 window에서 참조
export const resizeCanvasFor = (...args) => window.resizeCanvasFor?.(...args);
export const draw = (...args) => window.draw?.(...args);
export const updateCompare = (...args) => window.updateCompare?.(...args);

