import { useState } from 'react';
import jsPDF from 'jspdf';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import * as mpPose from '@mediapipe/pose';

function App() {
  const [angles, setAngles] = useState({ cva: 0, pelvis: 0, hip: 0 });
  const [feedback, setFeedback] = useState('');
  const [chartData, setChartData] = useState([{ date: 'Before', score: 60 }, { date: 'After', score: 85 }]);

  const calcAngle = (A: any, B: any, C: any) => {
    const rad = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
    let deg = Math.abs((rad * 180) / Math.PI);
    if (deg > 180) deg = 360 - deg;
    return Number(deg.toFixed(1));
  };

  const handlePose = async (e: any) => {
    const img = e.target.files[0];
    if (!img) return;
    const image = document.createElement('img');
    image.src = URL.createObjectURL(img);

    const pose = new mpPose.Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
    pose.setOptions({ modelComplexity: 1 });
    pose.onResults((res) => {
      if (!res.poseLandmarks) return;
      const lm = res.poseLandmarks;
      const cva = calcAngle(lm[7], lm[8], { x: lm[8].x + 0.1, y: lm[8].y });
      setAngles({ cva, pelvis: 12, hip: 6 });
      if (cva < 50) setFeedback('⚠️ 전방두 자세: 상부 승모근, SCM 단축 / 심부굴곡근 약화');
      else setFeedback('✅ 정렬 양호');
    });
    await pose.send({ image });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
    doc.setFont('NanumGothic');
    doc.setFontSize(18);
    doc.text('DIT 자세 분석 리포트', 20, 20);
    doc.setFontSize(12);
    doc.text(`CVA: ${angles.cva}°`, 20, 40);
    doc.text(`피드백: ${feedback}`, 20, 55, { maxWidth: 160 });
    doc.save('posture_report.pdf');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="glass w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Posture AI - KOR</h1>
        <input type="file" accept="image/*" onChange={handlePose} />
        <p className="mt-4">📐 CVA: {angles.cva}°</p>
        <p>{feedback}</p>
        <div className="mt-6 bg-white rounded-xl p-4">
          <LineChart width={300} height={180} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#a855f7" />
          </LineChart>
        </div>
        <button onClick={exportPDF}>📄 PDF 저장</button>
      </div>
    </div>
  );
}

export default App;

