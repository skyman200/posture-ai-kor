import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * 분석 결과를 PDF로 내보내기
 * @param {Object} options - PDF 생성 옵션
 * @param {HTMLElement} options.imageElement - 이미지 요소
 * @param {Object} options.angles - 각도 정보
 * @param {Object} options.analysis - 근육 분석 결과
 * @param {Object} options.points - 포인트 정보
 */
export async function exportToPDF({ imageElement, angles, analysis, points }) {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    let yPos = margin;
    
    // 제목
    pdf.setFontSize(20);
    pdf.setTextColor(108, 99, 255); // #6C63FF
    pdf.text('DIT 자세 분석 AI', margin, yPos);
    yPos += 10;

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('분석 결과 리포트', margin, yPos);
    yPos += 15;

    // 이미지 캡처 및 추가
    if (imageElement) {
      try {
        const canvas = await html2canvas(imageElement, {
          backgroundColor: '#f4f0ff',
          scale: 2,
          logging: false,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // 이미지가 페이지를 넘어가면 새 페이지
        if (yPos + imgHeight > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
        
        pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 10;
      } catch (err) {
        console.error('이미지 캡처 실패:', err);
        pdf.text('이미지를 불러올 수 없습니다.', margin, yPos);
        yPos += 10;
      }
    }

    // 각도 분석
    pdf.setFontSize(14);
    pdf.setTextColor(108, 99, 255);
    pdf.text('📊 분석 각도', margin, yPos);
    yPos += 8;

    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    
    if (angles.forwardHead !== null) {
      pdf.text(`머리 전방 변위 (CVA): ${angles.forwardHead.toFixed(1)}°`, margin, yPos);
      yPos += 6;
    }
    
    if (angles.trunk !== null) {
      pdf.text(`몸통 기울기: ${angles.trunk.toFixed(1)}°`, margin, yPos);
      yPos += 6;
    }
    
    if (angles.knee !== null) {
      pdf.text(`무릎 각도: ${angles.knee.toFixed(1)}°`, margin, yPos);
      yPos += 6;
    }

    pdf.text('기준: CVA 정상 ≥ 50°, 몸통 |각| ≤ 5°, 무릎 175°~185°', margin, yPos, {
      maxWidth: contentWidth,
      fontSize: 9,
    });
    yPos += 12;

    // 근육 상태 & 교정 제안
    if (analysis) {
      // 새 페이지 필요하면 추가
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(108, 99, 255);
      pdf.text('🧠 근육 상태 & 교정 제안', margin, yPos);
      yPos += 8;

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);

      // 머리/경추
      if (analysis.head) {
        pdf.setFont(undefined, 'bold');
        pdf.text('머리/경추:', margin, yPos);
        pdf.setFont(undefined, 'normal');
        yPos += 6;

        pdf.text(`상태: ${analysis.head.상태}`, margin + 5, yPos);
        yPos += 5;

        if (analysis.head.타이트?.length) {
          pdf.setTextColor(209, 45, 45); // #d12d2d
          pdf.text(`타이트: ${analysis.head.타이트.join(', ')}`, margin + 5, yPos);
          yPos += 5;
        }

        if (analysis.head.약화?.length) {
          pdf.setTextColor(36, 93, 219); // #245ddb
          pdf.text(`약화: ${analysis.head.약화.join(', ')}`, margin + 5, yPos);
          yPos += 5;
        }

        if (analysis.head.추천?.length) {
          pdf.setTextColor(0, 0, 0);
          pdf.text(`추천: ${analysis.head.추천.join(', ')}`, margin + 5, yPos, {
            maxWidth: contentWidth - 10,
          });
          yPos += 8;
        }

        pdf.setTextColor(0, 0, 0);
      }

      // 몸통/골반
      if (analysis.trunk) {
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFont(undefined, 'bold');
        pdf.text('몸통/골반:', margin, yPos);
        pdf.setFont(undefined, 'normal');
        yPos += 6;

        pdf.text(`상태: ${analysis.trunk.상태}`, margin + 5, yPos);
        yPos += 5;

        if (analysis.trunk.타이트?.length) {
          pdf.setTextColor(209, 45, 45);
          pdf.text(`타이트: ${analysis.trunk.타이트.join(', ')}`, margin + 5, yPos);
          yPos += 5;
        }

        if (analysis.trunk.약화?.length) {
          pdf.setTextColor(36, 93, 219);
          pdf.text(`약화: ${analysis.trunk.약화.join(', ')}`, margin + 5, yPos);
          yPos += 5;
        }

        if (analysis.trunk.추천?.length) {
          pdf.setTextColor(0, 0, 0);
          pdf.text(`추천: ${analysis.trunk.추천.join(', ')}`, margin + 5, yPos, {
            maxWidth: contentWidth - 10,
          });
          yPos += 8;
        }

        pdf.setTextColor(0, 0, 0);
      }

      // 무릎/하지
      if (analysis.knee) {
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFont(undefined, 'bold');
        pdf.text('무릎/하지:', margin, yPos);
        pdf.setFont(undefined, 'normal');
        yPos += 6;

        pdf.text(`상태: ${analysis.knee.상태}`, margin + 5, yPos);
        yPos += 5;

        if (analysis.knee.타이트?.length) {
          pdf.setTextColor(209, 45, 45);
          pdf.text(`타이트: ${analysis.knee.타이트.join(', ')}`, margin + 5, yPos);
          yPos += 5;
        }

        if (analysis.knee.약화?.length) {
          pdf.setTextColor(36, 93, 219);
          pdf.text(`약화: ${analysis.knee.약화.join(', ')}`, margin + 5, yPos);
          yPos += 5;
        }

        if (analysis.knee.추천?.length) {
          pdf.setTextColor(0, 0, 0);
          pdf.text(`추천: ${analysis.knee.추천.join(', ')}`, margin + 5, yPos, {
            maxWidth: contentWidth - 10,
          });
        }
      }
    }

    // 하단 푸터
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `※ 모든 처리는 브라우저 로컬에서 이루어집니다. 사진은 서버로 업로드되지 않습니다.`,
        margin,
        pageHeight - 10,
        { maxWidth: contentWidth }
      );
      pdf.text(
        `페이지 ${i} / ${totalPages}`,
        pageWidth - margin - 20,
        pageHeight - 10
      );
    }

    // PDF 다운로드
    const fileName = `posture-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    throw error;
  }
}

