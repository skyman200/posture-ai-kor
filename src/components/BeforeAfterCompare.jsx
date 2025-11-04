import React from "react";
import { analysisRules } from "../utils/analysisRules";

export default function BeforeAfterCompare({ before, after }) {
  const categories = ["cva", "trunk", "knee"];

  return (
    <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl shadow-md max-w-3xl mx-auto mt-6">
      <h2 className="text-2xl font-bold mb-4">📷 Before / After 비교</h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-indigo-100 text-indigo-700">
            <th className="p-2 text-left">항목</th>
            <th className="p-2">Before</th>
            <th className="p-2">After</th>
            <th className="p-2">변화</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const beforeData = analysisRules[cat](before[cat]);
            const afterData = analysisRules[cat](after[cat]);
            const diff = after[cat] - before[cat];
            const trend = diff > 0 ? "📈 개선" : diff < 0 ? "📉 악화" : "➖ 동일";

            return (
              <tr key={cat} className="border-t border-gray-200">
                <td className="p-2 font-semibold">{cat.toUpperCase()}</td>
                <td className="p-2">
                  {beforeData.level} ({before[cat]}°)
                </td>
                <td className="p-2">
                  {afterData.level} ({after[cat]}°)
                </td>
                <td className="p-2 text-center">{trend}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

