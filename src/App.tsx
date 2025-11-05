import { useState, useEffect } from 'react'
import './App.css'

function App() {
  return (
    <div className="wrap">
      <aside className="panel sidebar">
        <div className="title">DIT 자세 분석</div>
        <div className="muted">사진 업로드 후 5포인트를 클릭하세요</div>
        {/* 사이드바 내용은 기존 HTML 구조를 유지하면서 React로 점진적 마이그레이션 */}
      </aside>
      <main className="panel canvasWrap">
        <canvas id="cv" width="1600" height="1000"></canvas>
      </main>
    </div>
  )
}

export default App
