// src/App.tsx

import React from "react";
import PostureResultTable from "./components/PostureResultTable";
import ReportHistoryView from "./components/ReportHistoryView";

function App() {
  return (
    <div className="min-h-screen p-10 bg-gradient-to-b from-purple-50 to-white">
      <h1 className="text-2xl font-extrabold text-purple-800 mb-6">
        AI 자세 분석 + DB 기반 리포트 시스템
      </h1>
      <PostureResultTable />
      <ReportHistoryView />
    </div>
  );
}

export default App;

