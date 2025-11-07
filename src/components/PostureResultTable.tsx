// src/components/PostureResultTable.tsx

import React, { useEffect, useState } from "react";
import { analyzePostureWithDB } from "../utils/analyzePosture";
import { saveHistory } from "../utils/history";

export default function PostureResultTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const measured = {
    CVA: 65.7,
    HPD: 1.0,
    TIA: 4.0,
    SAA: 15.1,
    PTA: 18.0,
    KA: 176.2,
    Tibial: 2.5,
    GSB: 0.2,
    HPA: 12.0,
    PDS: 6.0,
  };

  useEffect(() => {
    (async () => {
      const res = await analyzePostureWithDB(measured);
      setData(res);
      saveHistory({
        date: new Date().toISOString(),
        metrics: measured,
        summary: "AI 분석 완료",
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>🔍 분석 중...</p>;

  return (
    <div className="p-6 bg-white/60 backdrop-blur-xl rounded-2xl shadow-md overflow-x-auto">
      <h2 className="text-lg font-bold mb-3 text-purple-800">
        AI 자세 분석 결과 (DB 기반)
      </h2>
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-purple-100">
            <th className="p-2">항목</th>
            <th className="p-2">측정값</th>
            <th className="p-2">상태</th>
            <th className="p-2">관련 근육</th>
            <th className="p-2">추천 운동</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} className="border-b border-gray-200 hover:bg-purple-50">
              <td className="p-2">{r.key}</td>
              <td className="p-2">{r.value ?? "—"}</td>
              <td
                className={`p-2 font-semibold ${
                  r.status.includes("↑") || r.status.includes("↓")
                    ? "text-red-600"
                    : "text-green-700"
                }`}
              >
                {r.status}
              </td>
              <td className="p-2">{r.muscles.join(", ") || "—"}</td>
              <td className="p-2">{r.exercises.join(", ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

