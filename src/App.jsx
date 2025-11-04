import React, { useState, useEffect } from "react";
import PoseCanvas from "./components/PoseCanvas";
import AiPostureReport from "./components/AiPostureReport";
import BeforeAfterCompare from "./components/BeforeAfterCompare";
import { analysisRules, generateSummary } from "./utils/analysisRules";
import ScoreChart from "./components/ScoreChart";

export default function App() {
  const [angles, setAngles] = useState({ cva: 45, trunk: 7, knee: 165 });
  const [savedBefore, setSavedBefore] = useState(null);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("postureScores");
    if (saved) {
      try {
        setScores(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved scores:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (scores.length > 0) {
      localStorage.setItem("postureScores", JSON.stringify(scores));
    }
  }, [scores]);

  const handleAnalysisChange = (newAngles) => {
    setAngles(newAngles);
  };

  const handleSaveSession = () => {
    const totalScore = calculateScore(angles);
    const newScore = {
      time: new Date().toLocaleTimeString(),
      score: totalScore,
    };
    setScores((prev) => [...prev, newScore]);
    alert(`점수 ${totalScore}점이 저장되었습니다!`);
  };

  const calculateScore = ({ cva, trunk, knee }) => {
    let score = 0;
    score += cva >= 50 ? 33 : cva >= 40 ? 25 : 15;
    score += Math.abs(trunk) < 5 ? 33 : Math.abs(trunk) < 10 ? 25 : 15;
    score += knee >= 175 && knee <= 185 ? 34 : knee < 175 ? 25 : 15;
    return Math.round(score);
  };

  const report = generateSummary({
    cva: analysisRules.cva(angles.cva),
    trunk: analysisRules.trunk(angles.trunk),
    knee: analysisRules.knee(angles.knee),
  });

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-purple-100 to-indigo-100">
      <h1 className="text-3xl font-bold text-center mb-6 text-indigo-700">
        📸 DIT 자세 분석 AI (로컬 완성형)
      </h1>
      <PoseCanvas onAnalysisChange={handleAnalysisChange} />

      <div id="capture-area">
        <AiPostureReport
          cvaAngle={angles.cva}
          trunkTilt={angles.trunk}
          kneeAngle={angles.knee}
        />
      </div>

      <div className="flex justify-center gap-4 mt-4 flex-wrap">
        <button
          onClick={() => {
            setSavedBefore(angles);
            alert("Before 상태가 저장되었습니다!");
          }}
          className="bg-yellow-400 px-4 py-2 rounded-lg hover:bg-yellow-500 transition"
        >
          📷 Before 저장
        </button>
        <button
          onClick={() => {
            if (window.exportPDF) {
              window.exportPDF();
            } else {
              alert("PDF 내보내기 기능을 로드하는 중입니다. 잠시 후 다시 시도해주세요.");
            }
          }}
          className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition"
        >
          📄 PDF 저장
        </button>
        <button
          onClick={handleSaveSession}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
        >
          💾 점수 저장
        </button>
      </div>

      {savedBefore && <BeforeAfterCompare before={savedBefore} after={angles} />}

      <ScoreChart data={scores} />
    </div>
  );
}
