// src/components/PostureResultTable.tsx

import React, { useEffect, useState } from "react";
import {
  analyzePostureWithDB,
  AnalysisWithDBResult,
} from "../utils/analyzePosture";
import { saveHistory } from "../utils/history";

export default function PostureResultTable() {
  const [analysis, setAnalysis] = useState<AnalysisWithDBResult | null>(null);
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
      setAnalysis(res);
      saveHistory({
        date: new Date().toISOString(),
        metrics: measured,
        summary: "AI 분석 완료",
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !analysis) return <p>🔍 분석 중...</p>;

  const { metrics, stretchRecommendations, strengthenRecommendations } =
    analysis;

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
            <th className="p-2">Tight 근육</th>
            <th className="p-2">Weak 근육</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((r) => (
            <tr
              key={r.key}
              className="border-b border-gray-200 hover:bg-purple-50"
            >
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
              <td className="p-2">
                {r.tightMuscles.length ? r.tightMuscles.join(", ") : "—"}
              </td>
              <td className="p-2">
                {r.weakMuscles.length ? r.weakMuscles.join(", ") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <RecommendationTable
          title="긴장 근육 스트레칭 우선 (Stretch 20)"
          data={stretchRecommendations}
          accent="from-rose-100 to-rose-50"
        />
        <RecommendationTable
          title="약화 근육 강화 우선 (Strengthen 20)"
          data={strengthenRecommendations}
          accent="from-sky-100 to-sky-50"
        />
      </div>
    </div>
  );
}

type RecommendationTableProps = {
  title: string;
  data: AnalysisWithDBResult["stretchRecommendations"];
  accent: string;
};

function RecommendationTable({ title, data, accent }: RecommendationTableProps) {
  return (
    <div className={`p-4 rounded-2xl shadow-inner bg-gradient-to-br ${accent}`}>
      <h3 className="text-base font-semibold text-gray-800 mb-3">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500">필요한 처방이 없습니다.</p>
      ) : (
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr className="text-left text-gray-600 border-b border-gray-200">
              <th className="py-1 pr-2">기구</th>
              <th className="py-1 pr-2">동작</th>
              <th className="py-1 pr-2">매칭 근육</th>
              <th className="py-1 pr-2">Reps/호흡</th>
            </tr>
          </thead>
          <tbody>
            {data.map((ex) => (
              <tr key={ex.id} className="border-b border-gray-100">
                <td className="py-1 pr-2 font-medium">{ex.source}</td>
                <td className="py-1 pr-2">
                  <div className="font-semibold text-gray-900">{ex.nameKo}</div>
                  <div className="text-[11px] text-gray-500">{ex.nameEn}</div>
                </td>
                <td className="py-1 pr-2 text-gray-700">
                  {ex.matchedMuscles.join(", ")}
                </td>
                <td className="py-1 pr-2 text-gray-500">
                  {ex.reps || "-"}
                  {ex.breathing ? ` / ${ex.breathing}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
