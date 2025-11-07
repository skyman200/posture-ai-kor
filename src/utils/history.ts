// src/utils/history.ts

import { Metrics } from "./analyzePosture";

const KEY = "posture_history";

export interface HistoryEntry {
  date: string;
  metrics: Metrics;
  summary: string;
}

export function saveHistory(entry: HistoryEntry) {
  const prev = loadHistory();
  const updated = [entry, ...prev].slice(0, 5); // 최근 5개만 유지
  localStorage.setItem(KEY, JSON.stringify(updated));
}

export function loadHistory(): HistoryEntry[] {
  try {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

