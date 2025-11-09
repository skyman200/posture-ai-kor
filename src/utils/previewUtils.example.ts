/**
 * PreviewDownloader 사용 예제
 * 
 * 이 파일은 참고용 예제입니다.
 * 실제 사용 시에는 아래 코드를 복사해서 사용하세요.
 */

// ============================================
// 예제 1: PDF 생성 후 미리보기
// ============================================

import { previewPDF } from './previewUtils';

async function example1_PDFPreview() {
  // jsPDF가 전역에 로드되어 있다고 가정
  if (typeof window !== 'undefined' && window.jspdf) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    pdf.setFontSize(20);
    pdf.text('자세 분석 리포트 미리보기 테스트', 10, 20);
    pdf.text('이 PDF는 미리보기로 표시됩니다.', 10, 30);
    
    // 미리보기 표시
    await previewPDF(pdf, 'Posture_Report.pdf');
  }
}

// ============================================
// 예제 2: 캔버스 이미지 미리보기
// ============================================

import { previewImage } from './previewUtils';

async function example2_ImagePreview() {
  const canvas = document.querySelector('canvas');
  if (canvas) {
    // 캔버스를 이미지로 변환 후 미리보기
    await previewImage(
      canvas,
      'posture_capture.jpg',
      0.7,              // 품질 (0.0 ~ 1.0)
      'image/jpeg'      // 포맷
    );
  }
}

// ============================================
// 예제 3: 직접 Blob 사용
// ============================================

import { showPreview } from './previewUtils';

async function example3_BlobPreview() {
  // 예: 텍스트 파일 생성
  const text = '자세 분석 리포트 내용...';
  const blob = new Blob([text], { type: 'text/plain' });
  showPreview(blob, 'report.txt');
  
  // 예: JSON 파일 생성
  const data = { name: '홍길동', score: 95 };
  const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  });
  showPreview(jsonBlob, 'data.json');
}

// ============================================
// 예제 4: 기존 exportDetailedPDF 사용
// ============================================

import { exportDetailedPDF } from '../ai/reportPdf';

async function example4_ExistingPDFFunction() {
  // 기존 함수는 이미 미리보기 기능이 통합되어 있음
  await exportDetailedPDF({
    centerName: '필라테스 센터',
    memberName: '홍길동',
    sessionName: '2024-01-15',
    analysis: {
      sections: [
        { section: 'side', summary: '측면 분석 결과...' }
      ],
      results: [],
      tightAll: ['승모근', '흉근'],
      weakAll: ['복근'],
      pilatesAll: []
    },
    before: { CVA: 65, PTA: 18 },
    after: { CVA: 70, PTA: 15 },
    charts: {
      overviewCanvas: document.getElementById('chart-overview'),
      sideChartCanvas: document.getElementById('chart-side'),
      frontChartCanvas: document.getElementById('chart-front')
    }
  });
  // → 자동으로 미리보기 창이 뜹니다!
}

// ============================================
// 예제 5: React 컴포넌트에서 직접 사용
// ============================================

import React from 'react';
import PreviewDownloader from '../components/PreviewDownloader';

function Example5_ReactComponent() {
  const [showPreview, setShowPreview] = React.useState(false);
  const [fileBlob, setFileBlob] = React.useState<Blob | null>(null);
  const [fileName, setFileName] = React.useState('');

  const handleGeneratePDF = async () => {
    if (typeof window !== 'undefined' && window.jspdf) {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.text('테스트 PDF', 10, 10);
      
      const blob = pdf.output('blob');
      setFileBlob(blob);
      setFileName('test.pdf');
      setShowPreview(true);
    }
  };

  return (
    <div>
      <button onClick={handleGeneratePDF}>PDF 생성</button>
      
      {showPreview && fileBlob && (
        <PreviewDownloader
          fileBlob={fileBlob}
          fileName={fileName}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

