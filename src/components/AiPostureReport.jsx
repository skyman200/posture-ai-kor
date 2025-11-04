import React from "react";
import { analysisRules, generateSummary } from "../utils/analysisRules";

export default function AiPostureReport({ cvaAngle, trunkTilt, kneeAngle }) {
  const cva = analysisRules.cva(cvaAngle);
  const trunk = analysisRules.trunk(trunkTilt);
  const knee = analysisRules.knee(kneeAngle);
  const report = generateSummary({ cva, trunk, knee });

  return (
    <div
      id="ai-report"
      className="p-6 rounded-2xl bg-white/30 backdrop-blur-md shadow-md max-w-2xl mx-auto text-gray-800"
    >
      <h2 className="text-2xl font-bold mb-4">🧠 AI 자세 분석 리포트</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {[
          { label: "CVA", data: cva, angle: cvaAngle },
          { label: "Trunk", data: trunk, angle: trunkTilt },
          { label: "Knee", data: knee, angle: kneeAngle },
        ].map((item) => (
          <div
            key={item.label}
            className={`p-4 rounded-xl shadow-md border-l-8 ${
              item.data.color === "green"
                ? "border-green-500"
                : item.data.color === "yellow"
                ? "border-yellow-400"
                : "border-red-500"
            }`}
          >
            <h3 className="font-bold text-lg mb-1">
              {item.label}: {item.data.level}
            </h3>
            <p className="text-xs mb-1 text-gray-600">각도: {item.angle}°</p>
            <p className="text-sm mb-1 text-gray-700">{item.data.muscles}</p>
            <p className="text-sm text-indigo-600">{item.data.tips}</p>
          </div>
        ))}
      </div>
      <pre className="bg-gray-50/70 p-3 rounded-lg text-sm whitespace-pre-wrap mb-4">
        {report}
      </pre>
    </div>
  );
}

