import { useEffect, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as mpPose from '@mediapipe/pose';
import * as mpDrawingUtils from '@mediapipe/drawing_utils';
import * as mpCameraUtils from '@mediapipe/camera_utils';

function statusDot(value: number | null, type: 'CVA' | 'TRUNK' | 'KNEE'): [string, string] {
  if (value == null || isNaN(value)) return ['⚪ 미측정', '—'];
  
  if (type === 'CVA') {
    if (value >= 50) return ['🟢 정상', '≥50°'];
    if (value >= 45) return ['🟡 경미', '45–49°'];
    return ['🔴 문제', '<45°'];
  }
  
  if (type === 'TRUNK') {
    const abs = Math.abs(value);
    if (abs <= 5) return ['🟢 정상', '|0–5°|'];
    if (abs <= 10) return ['🟡 경미', '|6–10°|'];
    return ['🔴 문제', '>10°'];
  }
  
  if (type === 'KNEE') {
    if (value >= 175) return ['🟢 정상', '175–185°'];
    if (value >= 165) return ['🟡 경미', '165–174°'];
    return ['🔴 문제', '<165°'];
  }
  
  return ['⚪ 미측정', '—'];
}

function getMuscleFeedback(cva: number | null, pelvic: number | null, knee: number | null) {
  const feedback: any = {
    cva: { tight: [], weak: [], suggestions: [] },
    trunk: { tight: [], weak: [], suggestions: [] },
    knee: { tight: [], weak: [], suggestions: [] }
  };

  if (cva != null) {
    if (cva < 50) {
      if (cva < 45) {
        feedback.cva.tight = ['상부승모근', '견갑거근', 'SCM'];
        feedback.cva.weak = ['심부경부굴근', '하부승모근'];
        feedback.cva.suggestions = ['심부경부굴근 활성화', '하부승모근 강화', '턱 당기기 운동'];
      } else {
        feedback.cva.tight = ['상부승모근', '견갑거근'];
        feedback.cva.weak = ['심부경부굴근'];
        feedback.cva.suggestions = ['심부경부굴근 활성화', '하부승모근 강화'];
      }
    }
  }

  if (pelvic != null) {
    const abs = Math.abs(pelvic);
    if (abs > 5) {
      if (pelvic > 0) {
        feedback.trunk.tight = ['장요근', '요추기립근'];
        feedback.trunk.weak = ['복횡근', '둔근'];
        feedback.trunk.suggestions = ['장요근 스트레칭', '복압-복횡근 호흡 훈련', '둔근 강화'];
      } else {
        feedback.trunk.tight = ['둔근', '햄스트링'];
        feedback.trunk.weak = ['복직근', '장요근'];
        feedback.trunk.suggestions = ['둔근 스트레칭', '복직근 강화', '장요근 활성화'];
      }
    }
  }

  if (knee != null) {
    if (knee < 175) {
      if (knee < 165) {
        feedback.knee.tight = ['햄스트링', '비복근', '가자미근'];
        feedback.knee.weak = ['대퇴사두근', '둔근'];
        feedback.knee.suggestions = ['햄스트링 스트레칭', '대퇴사두 강화', '비복근 스트레칭'];
      } else {
        feedback.knee.tight = ['햄스트링', '비복근'];
        feedback.knee.weak = ['대퇴사두근'];
        feedback.knee.suggestions = ['햄스트링 스트레칭', '대퇴사두 강화'];
      }
    }
  }

  return feedback;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);
  const [cur, setCur] = useState<'Before' | 'After'>('Before');
  const [sessions, setSessions] = useState({
    Before: { img: null as HTMLImageElement | null, pts: new Map(), score: null as number | null, metrics: {} as any, feedback: null as any },
    After: { img: null as HTMLImageElement | null, pts: new Map(), score: null as number | null, metrics: {} as any, feedback: null as any },
  });
  const [scoreHistory, setScoreHistory] = useState<Array<{ date: string; score: number }>>([]);

  const keypoints = [
    { key: 'Tragus', color: '#7c9cff' },
    { key: 'C7', color: '#7c9cff' },
    { key: 'Shoulder', color: '#7c9cff' },
    { key: 'Hip', color: '#7c9cff' },
    { key: 'Knee', color: '#7c9cff' },
    { key: 'Ankle', color: '#7c9cff' },
    { key: 'ASIS', color: '#ffb86c' },
    { key: 'PSIS', color: '#ffb86c' },
  ];

  useEffect(() => {
    const loadPose = async () => {
      if (poseRef.current) return;
      
      const pose = new mpPose.Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults((results: any) => {
        if (results.poseLandmarks && canvasRef.current) {
          const cv = canvasRef.current;
          const W = cv.width / (window.devicePixelRatio || 1);
          const H = cv.height / (window.devicePixelRatio || 1);
          
          const landmarks = results.poseLandmarks;
          const mapping: any = {
            'Tragus': 7,  // Left ear
            'C7': 0,      // Nose (approximate C7)
            'Shoulder': 11, // Left shoulder
            'Hip': 23,    // Left hip
            'Knee': 25,   // Left knee
            'Ankle': 27,  // Left ankle
            'ASIS': 23,   // Left hip (for ASIS)
            'PSIS': 24,   // Right hip (for PSIS approximation)
          };

          const newMap = new Map();
          for (const kp of keypoints) {
            const idx = mapping[kp.key];
            if (landmarks[idx]) {
              const lm = landmarks[idx];
              newMap.set(kp.key, {
                x: lm.x * W,
                y: lm.y * H
              });
            }
          }

          setSessions(prev => ({
            ...prev,
            [cur]: {
              ...prev[cur],
              pts: newMap
            }
          }));
        }
      });

      poseRef.current = pose;
    };

    loadPose();
  }, []);

  useEffect(() => {
    const loadHistory = () => {
      try {
        const saved = localStorage.getItem('postureScoreHistory');
        if (saved) {
          setScoreHistory(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    };
    loadHistory();
  }, []);

  const saveScore = () => {
    const score = sessions[cur].score;
    if (score == null) return;
    
    const newEntry = {
      date: new Date().toLocaleDateString('ko-KR'),
      score: score
    };
    
    const newHistory = [...scoreHistory, newEntry].slice(-10);
    setScoreHistory(newHistory);
    
    try {
      localStorage.setItem('postureScoreHistory', JSON.stringify(newHistory));
      alert('점수가 저장되었습니다!');
    } catch (e) {
      console.error('Failed to save:', e);
      alert('저장에 실패했습니다.');
    }
  };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;
    let dragKey: string | null = null;

    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
    const rad2deg = (r: number) => r * 180 / Math.PI;
    const angleBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.atan2(b.y - a.y, b.x - a.x);
    const internalAngle = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) => {
      const ab = Math.atan2(a.y - b.y, a.x - b.x);
      const cb = Math.atan2(c.y - b.y, c.x - b.x);
      let d = Math.abs(ab - cb);
      if (d > Math.PI) d = 2 * Math.PI - d;
      return d;
    };

    const resizeCanvasFor = (img: HTMLImageElement | null) => {
      if (!img) {
        draw();
        return;
      }
      const maxW = cv.parentElement!.clientWidth - 24;
      const maxH = cv.parentElement!.clientHeight - 24;
      const r = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight) || 1;
      const w = Math.round(img.naturalWidth * r);
      const h = Math.round(img.naturalHeight * r);
      cv.width = Math.round(w * DPR);
      cv.height = Math.round(h * DPR);
      cv.style.width = w + 'px';
      cv.style.height = h + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    const getPts = (session: 'Before' | 'After') => {
      const map = sessions[session].pts;
      const out: any = {};
      for (const k of keypoints) out[k.key] = map.get(k.key);
      return out;
    };

    const ensureDefaultPoints = (session: 'Before' | 'After') => {
      const S = sessions[session];
      const W = cv.width / DPR, H = cv.height / DPR;
      if (S.pts.size === 0 && S.img) {
        const defaults: any = {
          Tragus: { x: W * 0.35, y: H * 0.3 },
          C7: { x: W * 0.3, y: H * 0.35 },
          Shoulder: { x: W * 0.35, y: H * 0.4 },
          Hip: { x: W * 0.38, y: H * 0.6 },
          Knee: { x: W * 0.42, y: H * 0.8 },
          Ankle: { x: W * 0.44, y: H * 0.95 },
          ASIS: { x: W * 0.40, y: H * 0.58 },
          PSIS: { x: W * 0.35, y: H * 0.6 },
        };
        const newMap = new Map();
        for (const k of keypoints) {
          if (defaults[k.key]) {
            newMap.set(k.key, { ...defaults[k.key] });
          }
        }
        setSessions(prev => ({
          ...prev,
          [session]: { ...prev[session], pts: newMap }
        }));
      }
    };

    const draw = () => {
      const S = sessions[cur];
      const W = cv.width / DPR, H = cv.height / DPR;
      ctx.clearRect(0, 0, cv.width, cv.height);

      if (S.img) {
        ctx.drawImage(S.img, 0, 0, W, H);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '20px system-ui';
        ctx.fillText('이미지를 업로드하세요 (Before/After 각각)', 16, 32);
      }

      ensureDefaultPoints(cur);
      const P = getPts(cur);

      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);

      if (P.C7 && P.Tragus) {
        ctx.strokeStyle = 'rgba(124,156,255,0.9)';
        ctx.beginPath();
        ctx.moveTo(0, P.C7.y);
        ctx.lineTo(W, P.C7.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(P.C7.x, P.C7.y);
        ctx.lineTo(P.Tragus.x, P.Tragus.y);
        ctx.stroke();
      }

      if (P.Shoulder && P.Hip) {
        ctx.strokeStyle = 'rgba(124,156,255,0.8)';
        ctx.beginPath();
        ctx.moveTo(P.Shoulder.x, P.Shoulder.y);
        ctx.lineTo(P.Hip.x, P.Hip.y);
        ctx.stroke();
      }
      if (P.Hip && P.Knee) {
        ctx.beginPath();
        ctx.moveTo(P.Hip.x, P.Hip.y);
        ctx.lineTo(P.Knee.x, P.Knee.y);
        ctx.stroke();
      }
      if (P.Knee && P.Ankle) {
        ctx.beginPath();
        ctx.moveTo(P.Knee.x, P.Knee.y);
        ctx.lineTo(P.Ankle.x, P.Ankle.y);
        ctx.stroke();
      }

      if (P.ASIS && P.PSIS) {
        ctx.strokeStyle = 'rgba(255,184,108,0.95)';
        ctx.beginPath();
        ctx.moveTo(P.ASIS.x, P.ASIS.y);
        ctx.lineTo(P.PSIS.x, P.PSIS.y);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,184,108,0.4)';
        const midy = (P.ASIS.y + P.PSIS.y) / 2;
        ctx.beginPath();
        ctx.moveTo(0, midy);
        ctx.lineTo(W, midy);
        ctx.stroke();
      }

      ctx.setLineDash([]);

      for (const kp of keypoints) {
        const pt = P[kp.key];
        if (!pt) continue;
        drawHandle(pt.x, pt.y, kp.key, kp.color);
      }
    };

    const drawHandle = (x: number, y: number, label: string, color: string) => {
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '12px system-ui';
      const pad = 4;
      const text = label;
      const tw = ctx.measureText(text).width;
      const th = 16;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x + 10, y - 12, tw + pad * 2, th);
      ctx.fillStyle = '#e7eef7';
      ctx.fillText(text, x + 10 + pad, y + 1);
    };

    const computeAll = () => {
      const S = sessions[cur];
      const P = getPts(cur);
      let cva: number | null = null, pelvic: number | null = null, knee: number | null = null;

      if (P.C7 && P.Tragus) {
        const a = angleBetween(P.C7, P.Tragus);
        cva = Math.abs(rad2deg(a));
      }
      if (P.ASIS && P.PSIS) {
        const a = angleBetween(P.ASIS, P.PSIS);
        pelvic = rad2deg(a);
      }
      if (P.Hip && P.Knee && P.Ankle) {
        knee = rad2deg(internalAngle(P.Hip, P.Knee, P.Ankle));
      }

      const metrics = { cva, pelvic, knee };
      const feedback = getMuscleFeedback(cva, pelvic, knee);
      const sc = computeScore(cva, pelvic, knee);
      setSessions(prev => ({
        ...prev,
        [cur]: { ...prev[cur], metrics, score: sc, feedback }
      }));
    };

    const computeScore = (cva: number | null, pelvic: number | null, knee: number | null) => {
      let penalties = 0;
      if (cva != null) {
        const delta = Math.max(0, 50 - cva);
        penalties += Math.min(40, delta * 1.6);
      }
      if (pelvic != null) {
        const delta = Math.abs(pelvic);
        penalties += Math.min(30, delta * 2.0);
      }
      if (knee != null) {
        const delta = Math.max(0, 180 - knee);
        penalties += Math.min(30, delta * 1.0);
      }
      return Math.round(clamp(100 - penalties, 0, 100));
    };

    const handleMouseDown = (e: MouseEvent) => {
      const r = cv.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const P = getPts(cur);
      let best: string | null = null, bestD = 1e9;
      for (const k of keypoints) {
        const p = P[k.key];
        if (!p) continue;
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < 12 && d < bestD) {
          best = k.key;
          bestD = d;
        }
      }
      if (best) dragKey = best;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragKey) return;
      const r = cv.getBoundingClientRect();
      const x = clamp(e.clientX - r.left, 0, cv.width / DPR);
      const y = clamp(e.clientY - r.top, 0, cv.height / DPR);
      setSessions(prev => {
        const newMap = new Map(prev[cur].pts);
        const p = newMap.get(dragKey!);
        if (p) {
          p.x = x;
          p.y = y;
          newMap.set(dragKey!, p);
        }
        return {
          ...prev,
          [cur]: { ...prev[cur], pts: newMap }
        };
      });
    };

    const handleMouseUp = () => {
      dragKey = null;
    };

    if (sessions[cur].img) {
      resizeCanvasFor(sessions[cur].img);
    }

    cv.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    draw();
    computeAll();

    return () => {
      cv.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [cur, sessions]);

  const loadImage = async (slot: 'Before' | 'After', file: File | null) => {
    if (!file) return;
    const img = new Image();
    img.onload = async () => {
      setSessions(prev => ({
        ...prev,
        [slot]: { ...prev[slot], img }
      }));
      
      if (poseRef.current) {
        try {
          await poseRef.current.send({ image: img });
        } catch (e) {
          console.error('Pose detection failed:', e);
        }
      }
    };
    img.src = URL.createObjectURL(file);
  };

  const fmtDeg = (v: number | null) => (v == null || isNaN(v)) ? '—' : v.toFixed(1) + '°';

  const deltaStr = (b: number | null, a: number | null, suf: string = '') => {
    if (b == null || a == null || isNaN(b) || isNaN(a)) return '—';
    const d = a - b;
    const sign = d > 0 ? '+' : '';
    return sign + (Math.abs(d) < 0.05 ? d.toFixed(2) : d.toFixed(1)) + suf;
  };

  const exportPDF = async () => {
    if (typeof window === 'undefined' || !(window as any).html2canvas || !(window as any).jspdf) {
      alert('PDF 라이브러리를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const reportArea = document.querySelector('.analysis-report') || document.body;
    const html2canvas = (window as any).html2canvas;
    const jspdf = (window as any).jspdf;

    try {
      const canvas = await html2canvas(reportArea, { scale: 2, backgroundColor: '#0b0f14' });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('DIT_자세_분석_리포트.pdf');
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다.');
    }
  };

  const feedback = sessions[cur].feedback || getMuscleFeedback(
    sessions[cur].metrics.cva,
    sessions[cur].metrics.pelvic,
    sessions[cur].metrics.knee
  );

  const chartData = scoreHistory.length > 0 ? scoreHistory : [
    { date: 'Before', score: sessions.Before.score || 0 },
    { date: 'After', score: sessions.After.score || 0 }
  ].filter(d => d.score > 0);

  return (
    <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100vh', gap: '16px', padding: '16px', background: 'linear-gradient(180deg, #0b0f14 0%, #0e1520 100%)', color: '#e7eef7', fontFamily: 'system-ui' }}>
      <aside style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', overflow: 'auto' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>📸 DIT 자세 분석 — 로컬 어노테이션</div>
        <div style={{ color: '#9bb0c7', marginBottom: '12px', fontSize: '12px' }}>Before/After 각각 업로드 → MediaPipe 자동 인식 → 점(관절) 수동 조작 → 각도 및 점선 자동 계산</div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <button
            onClick={() => setCur('Before')}
            style={{ flex: 1, padding: '8px 10px', color: cur === 'Before' ? '#e7eef7' : '#9bb0c7', background: cur === 'Before' ? 'rgba(124,156,255,0.15)' : 'transparent', border: 0, cursor: 'pointer', borderRadius: '10px' }}
          >
            Before
          </button>
          <button
            onClick={() => setCur('After')}
            style={{ flex: 1, padding: '8px 10px', color: cur === 'After' ? '#e7eef7' : '#9bb0c7', background: cur === 'After' ? 'rgba(124,156,255,0.15)' : 'transparent', border: 0, cursor: 'pointer', borderRadius: '10px' }}
          >
            After
          </button>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#9bb0c7', fontSize: '12px', marginBottom: '6px' }}>{cur} 이미지 업로드</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.18)', background: 'rgba(124,156,255,0.06)', padding: '8px 10px', borderRadius: '999px', cursor: 'pointer', color: '#dce6ff', fontSize: '14px' }}>
              📷 파일 선택
              <input type="file" accept="image/*" onChange={(e) => loadImage(cur, e.target.files?.[0] || null)} style={{ display: 'none' }} />
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.18)', background: 'rgba(124,156,255,0.06)', padding: '8px 10px', borderRadius: '999px', cursor: 'pointer', color: '#dce6ff', fontSize: '14px' }}>
              📸 직접 촬영
              <input type="file" accept="image/*" capture="environment" onChange={(e) => loadImage(cur, e.target.files?.[0] || null)} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <div style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', marginBottom: '10px' }}>
          <div style={{ color: '#9bb0c7', marginBottom: '6px' }}>체형 종합 점수 (0–100)</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: sessions[cur].score != null ? (sessions[cur].score! >= 85 ? '#2ec4b6' : sessions[cur].score! >= 70 ? '#ffd166' : '#ff6b6b') : '#9bb0c7' }}>
            {sessions[cur].score != null ? sessions[cur].score : '—'}
          </div>
        </div>

        <div style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', marginBottom: '10px' }}>
          <div style={{ color: '#9bb0c7', marginBottom: '6px' }}>🔧 드래그로 점을 옮겨 수동 조정하세요</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ color: '#c8d6ee' }}>모드</div>
            <div style={{ color: '#e9f0ff' }}>{cur}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ color: '#c8d6ee' }}>CVA(°)</div>
            <div style={{ color: '#e9f0ff' }}>
              {fmtDeg(sessions[cur].metrics.cva)} {(() => {
                const [status] = statusDot(sessions[cur].metrics.cva, 'CVA');
                return <span style={{ marginLeft: '8px' }}>{status}</span>;
              })()}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ color: '#c8d6ee' }}>골반 기울기(°)</div>
            <div style={{ color: '#e9f0ff' }}>
              {fmtDeg(sessions[cur].metrics.pelvic)} {(() => {
                const [status] = statusDot(sessions[cur].metrics.pelvic, 'TRUNK');
                return <span style={{ marginLeft: '8px' }}>{status}</span>;
              })()}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ color: '#c8d6ee' }}>무릎 각(°)</div>
            <div style={{ color: '#e9f0ff' }}>
              {fmtDeg(sessions[cur].metrics.knee)} {(() => {
                const [status] = statusDot(sessions[cur].metrics.knee, 'KNEE');
                return <span style={{ marginLeft: '8px' }}>{status}</span>;
              })()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            <button
              onClick={() => {
                setSessions(prev => ({
                  ...prev,
                  [cur]: { ...prev[cur], pts: new Map() }
                }));
              }}
              style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e7eef7', cursor: 'pointer', fontSize: '14px' }}
            >
              ↺ 초기화
            </button>
            <button
              onClick={saveScore}
              style={{ padding: '8px 10px', background: 'rgba(46,196,182,0.2)', border: '1px solid rgba(46,196,182,0.3)', borderRadius: '10px', color: '#e7eef7', cursor: 'pointer', fontSize: '14px' }}
            >
              💾 점수 저장
            </button>
            <button
              onClick={exportPDF}
              style={{ padding: '8px 10px', background: 'rgba(124,156,255,0.2)', border: '1px solid rgba(124,156,255,0.3)', borderRadius: '10px', color: '#e7eef7', cursor: 'pointer', fontSize: '14px' }}
            >
              📄 PDF 저장
            </button>
          </div>
        </div>

        {feedback && (feedback.cva.tight.length > 0 || feedback.trunk.tight.length > 0 || feedback.knee.tight.length > 0) && (
          <div style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', marginBottom: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>💪 근육 피드백</div>
            {feedback.cva.tight.length > 0 && (
              <div style={{ marginBottom: '8px', fontSize: '12px' }}>
                <div style={{ color: '#ffd166', marginBottom: '4px' }}>CVA:</div>
                <div style={{ color: '#9bb0c7', marginLeft: '8px' }}>타이트: {feedback.cva.tight.join(', ')}</div>
                <div style={{ color: '#9bb0c7', marginLeft: '8px' }}>약화: {feedback.cva.weak.join(', ')}</div>
                <div style={{ color: '#7c9cff', marginLeft: '8px', marginTop: '4px' }}>제안: {feedback.cva.suggestions.join(', ')}</div>
              </div>
            )}
            {feedback.trunk.tight.length > 0 && (
              <div style={{ marginBottom: '8px', fontSize: '12px' }}>
                <div style={{ color: '#ffd166', marginBottom: '4px' }}>Trunk:</div>
                <div style={{ color: '#9bb0c7', marginLeft: '8px' }}>타이트: {feedback.trunk.tight.join(', ')}</div>
                <div style={{ color: '#9bb0c7', marginLeft: '8px' }}>약화: {feedback.trunk.weak.join(', ')}</div>
                <div style={{ color: '#7c9cff', marginLeft: '8px', marginTop: '4px' }}>제안: {feedback.trunk.suggestions.join(', ')}</div>
              </div>
            )}
            {feedback.knee.tight.length > 0 && (
              <div style={{ fontSize: '12px' }}>
                <div style={{ color: '#ffd166', marginBottom: '4px' }}>Knee:</div>
                <div style={{ color: '#9bb0c7', marginLeft: '8px' }}>타이트: {feedback.knee.tight.join(', ')}</div>
                <div style={{ color: '#9bb0c7', marginLeft: '8px' }}>약화: {feedback.knee.weak.join(', ')}</div>
                <div style={{ color: '#7c9cff', marginLeft: '8px', marginTop: '4px' }}>제안: {feedback.knee.suggestions.join(', ')}</div>
              </div>
            )}
          </div>
        )}

        {chartData.length > 0 && (
          <div style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', marginBottom: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>📈 점수 변화 그래프</div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#9bb0c7" style={{ fontSize: '10px' }} />
                <YAxis stroke="#9bb0c7" style={{ fontSize: '10px' }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'rgba(11,15,20,0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#e7eef7' }} />
                <Line type="monotone" dataKey="score" stroke="#7c9cff" strokeWidth={2} dot={{ fill: '#7c9cff', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>📊 Before / After 비교</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px', textAlign: 'left' }}>항목</th>
                <th style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px', textAlign: 'left' }}>Before</th>
                <th style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px', textAlign: 'left' }}>After</th>
                <th style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px', textAlign: 'left' }}>변화</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>CVA</td>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>{fmtDeg(sessions.Before.metrics.cva)}</td>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>{fmtDeg(sessions.After.metrics.cva)}</td>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>{deltaStr(sessions.Before.metrics.cva, sessions.After.metrics.cva, '°')}</td>
              </tr>
              <tr>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>골반 기울기</td>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>{fmtDeg(sessions.Before.metrics.pelvic)}</td>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>{fmtDeg(sessions.After.metrics.pelvic)}</td>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>{deltaStr(sessions.Before.metrics.pelvic, sessions.After.metrics.pelvic, '°')}</td>
              </tr>
              <tr>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>무릎 각</td>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>{fmtDeg(sessions.Before.metrics.knee)}</td>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>{fmtDeg(sessions.After.metrics.knee)}</td>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>{deltaStr(sessions.Before.metrics.knee, sessions.After.metrics.knee, '°')}</td>
              </tr>
              <tr>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>체형 점수</td>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>{sessions.Before.score != null ? sessions.Before.score : '—'}</td>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>{sessions.After.score != null ? sessions.After.score : '—'}</td>
                <td style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>{deltaStr(sessions.Before.score, sessions.After.score)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </aside>

      <main className="analysis-report" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <canvas
          ref={canvasRef}
          width={1600}
          height={1000}
          style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '16px', background: '#0a0e13' }}
          tabIndex={0}
        />
      </main>
    </div>
  );
}

export default App;
