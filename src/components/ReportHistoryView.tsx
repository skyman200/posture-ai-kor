// src/components/ReportHistoryView.tsx

import React, { useEffect, useState } from "react";
import { loadHistory } from "../utils/history";

export default function ReportHistoryView() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  if (!history.length)
    return <p className="text-gray-500">최근 분석 기록이 없습니다.</p>;

  return (
    <div className="p-6 bg-white/60 backdrop-blur-xl rounded-2xl shadow-md mt-6">
      <h2 className="text-lg font-bold mb-3 text-purple-700">📜 최근 분석 히스토리</h2>
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-purple-100">
            <th className="p-2">날짜</th>
            <th className="p-2">요약</th>
            <th className="p-2">PDS</th>
            <th className="p-2">PTA</th>
            <th className="p-2">CVA</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h, i) => (
            <tr key={i} className="border-b border-gray-200 hover:bg-purple-50">
              <td className="p-2">{new Date(h.date).toLocaleString()}</td>
              <td className="p-2">{h.summary}</td>
              <td className="p-2">{h.metrics?.PDS ?? "—"}</td>
              <td className="p-2">{h.metrics?.PTA ?? "—"}</td>
              <td className="p-2">{h.metrics?.CVA ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

