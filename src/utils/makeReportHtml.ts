/**
 * 리포트 HTML 생성 유틸리티
 * 분석 데이터를 기반으로 리포트 HTML을 생성
 */

export interface PostureResult {
  [key: string]: number | null;
}

export interface ActivePattern {
  posture_ko: string;
  posture_en?: string;
  summary?: string;
  description?: string;
  muscle_pattern?: {
    tight?: {
      primary?: string[];
      secondary?: string[];
    };
    weak?: {
      primary?: string[];
      secondary?: string[];
    };
  };
}

export interface MuscleStatus {
  tight: string[];
  weak: string[];
}

export interface PilatesExercise {
  exercise_ko?: string;
  name_ko?: string;
  equipment_ko?: string;
  equipment_en?: string;
  purpose?: string;
  how_to_do?: string;
  sets_reps?: string;
  precaution?: string;
  contra?: string;
}

export interface ReportData {
  memberName: string;
  centerName: string;
  postureResults: PostureResult;
  activePatterns: ActivePattern[];
  muscleStatus: MuscleStatus;
  exercises: PilatesExercise[];
}

/**
 * 리포트 HTML 생성
 * @param data - 리포트 데이터
 * @returns HTML 문자열
 */
export function generateReportHtml(data: ReportData): string {
  const {
    memberName,
    centerName,
    postureResults,
    activePatterns,
    muscleStatus,
    exercises,
  } = data;

  const now = new Date().toLocaleString("ko-KR");

  // 헤더
  const header = `
    <div style="font-family: 'Noto Sans KR', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color:#222; padding: 20px; max-width: 800px; margin: 0 auto;">
      <h1 style="margin:0; padding:8px 0; font-size: 24px; color: #2c3e50;">${centerName} 자세 분석 리포트</h1>
      <div style="font-size:0.9rem; color:#666; margin-top: 8px;">
        회원: <strong>${memberName}</strong> · 생성일: ${now}
      </div>
      <hr style="border:none; border-top:2px solid #e6e6e6; margin:16px 0;">
    </div>
  `;

  // 측정값 표
  const measureRows = Object.entries(postureResults)
    .filter(([_, v]) => v !== null && v !== undefined)
    .map(([k, v]) => {
      const value = typeof v === "number" ? v.toFixed(1) : String(v);
      return `<tr>
        <td style="padding:8px 12px; border-bottom:1px dashed #eee; font-weight: 600;">${k}</td>
        <td style="padding:8px 12px; border-bottom:1px dashed #eee;">${value}</td>
      </tr>`;
    })
    .join("");

  const measuresSection = `
    <section style="margin-top:16px; padding: 0 20px;">
      <h3 style="margin-bottom:10px; font-size: 18px; color: #34495e;">측정 결과 요약</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.95rem; color:#333; background: #f9f9f9; border-radius: 6px; overflow: hidden;">
        <thead>
          <tr style="background: #ecf0f1;">
            <th style="padding:10px 12px; text-align: left; border-bottom: 2px solid #bdc3c7;">지표</th>
            <th style="padding:10px 12px; text-align: left; border-bottom: 2px solid #bdc3c7;">측정값</th>
          </tr>
        </thead>
        <tbody>
          ${measureRows || "<tr><td colspan='2' style='padding:12px; text-align:center; color:#999;'>측정 데이터가 없습니다.</td></tr>"}
        </tbody>
      </table>
    </section>
  `;

  // 근육 상태
  const tightHtml =
    muscleStatus.tight && muscleStatus.tight.length > 0
      ? muscleStatus.tight.map((m) => `<li style="margin: 4px 0;">${m}</li>`).join("")
      : "<li style='color:#999;'>해당 없음</li>";

  const weakHtml =
    muscleStatus.weak && muscleStatus.weak.length > 0
      ? muscleStatus.weak.map((m) => `<li style="margin: 4px 0;">${m}</li>`).join("")
      : "<li style='color:#999;'>해당 없음</li>";

  const muscleSection = `
    <section style="margin-top:20px; padding: 0 20px;">
      <h3 style="margin-bottom:12px; font-size: 18px; color: #34495e;">근육 상태 분석</h3>
      <div style="display:flex; gap:24px; flex-wrap:wrap;">
        <div style="flex:1; min-width:250px; background: #fff5f5; padding: 16px; border-radius: 8px; border-left: 4px solid #e74c3c;">
          <h4 style="margin:0 0 10px 0; font-size: 16px; color: #c0392b;">긴장(Short/Tight)</h4>
          <ul style="line-height:1.8; color:#333; margin: 0; padding-left: 20px;">${tightHtml}</ul>
        </div>
        <div style="flex:1; min-width:250px; background: #f0f9ff; padding: 16px; border-radius: 8px; border-left: 4px solid #3498db;">
          <h4 style="margin:0 0 10px 0; font-size: 16px; color: #2980b9;">약화(Weak)</h4>
          <ul style="line-height:1.8; color:#333; margin: 0; padding-left: 20px;">${weakHtml}</ul>
        </div>
      </div>
    </section>
  `;

  // 운동 루틴
  const exercisesHtml =
    exercises && exercises.length > 0
      ? exercises
          .map((ex) => {
            const name = ex.exercise_ko || ex.name_ko || "운동명 없음";
            const equipment = ex.equipment_ko || ex.equipment_en || "";
            const purpose = ex.purpose || "";
            const howToDo = ex.how_to_do || "";
            const setsReps = ex.sets_reps || "";
            const contra = ex.contra || ex.precaution || "주의사항 없음";

            return `
              <div style="margin-bottom:16px; padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #27ae60;">
                <h4 style="margin:0 0 8px 0; font-size: 16px; color: #27ae60;">
                  ${name} <small style="color:#666; font-weight: normal;">(${equipment})</small>
                </h4>
                ${purpose ? `<div style="font-size:0.95rem; color:#333; margin: 6px 0;"><strong>목적:</strong> ${purpose}</div>` : ""}
                ${howToDo ? `<div style="font-size:0.9rem; color:#444; margin-top:8px; line-height: 1.6; white-space: pre-line;">${howToDo}</div>` : ""}
                ${setsReps ? `<div style="font-size:0.9rem; color:#555; margin-top:8px;"><strong>세트/반복:</strong> ${setsReps}</div>` : ""}
                <div style="font-size:0.85rem; color:#c0392b; margin-top:8px; padding: 8px; background: #fff5f5; border-radius: 4px;">
                  <strong>주의:</strong> ${contra}
                </div>
              </div>
            `;
          })
          .join("")
      : "<div style='padding: 16px; text-align: center; color: #999;'>추천 운동이 없습니다.</div>";

  const exercisesSection = `
    <section style="margin-top:20px; padding: 0 20px;">
      <h3 style="margin-bottom:12px; font-size: 18px; color: #34495e;">맞춤 필라테스 루틴</h3>
      ${exercisesHtml}
    </section>
  `;

  // 결론 및 향후 권장사항 (교수님 확정 문구 포함)
  const patternsList =
    activePatterns && activePatterns.length > 0
      ? activePatterns
          .map(
            (p) =>
              `<li style="margin: 8px 0; line-height: 1.6;"><strong>${p.posture_ko}</strong> — ${p.summary || p.description || ""}</li>`
          )
          .join("")
      : "<li style='color:#999;'>특이 패턴 없음</li>";

  const conclusion = `
    <section style="margin-top:24px; padding: 0 20px;">
      <div style="background:#f6fff7; border-left:6px solid #27ae60; padding:20px; border-radius:8px; margin-top:14px;">
        <h3 style="margin-top:0; margin-bottom: 12px; color:#27ae60; font-size: 20px;">결론 및 향후 권장사항</h3>
        <p style="line-height:1.8; color:#333; margin-bottom: 16px;">
          <strong>${memberName}님</strong>의 검사 결과와 AI 분석을 종합해보면, 관찰된 주요 패턴은 다음과 같습니다:
        </p>
        <ul style="line-height:1.8; color:#333; margin-bottom: 20px; padding-left: 24px;">
          ${patternsList}
        </ul>
        <p style="line-height:1.8; color:#333; margin-bottom: 20px;">
          위 패턴은 특정 근육군의 <strong>긴장(짧아짐)</strong>과 <strong>약화(약해짐)</strong>이 동반되는 전형적인 임상 소견입니다. 
          아래의 권장사항을 일관되게 6~12주 동안 적용하면 증상 완화와 자세 개선이 기대됩니다.
        </p>

        <h4 style="margin:16px 0 8px 0; font-size: 16px; color: #2c3e50;">단기(1~4주)</h4>
        <ol style="line-height:1.8; color:#333; margin-bottom: 16px; padding-left: 24px;">
          <li>긴장 근육 이완 중심(폼롤러, 근막 이완, 정적 스트레칭) — 하루 1회 10~15분</li>
          <li>호흡 조절과 함께하는 코어 기본운동 (Dead Bug, Pelvic Tilt) — 매일 5~10분</li>
          <li>일상 생활에서의 자세 리셋(30~40분마다) — 습관화</li>
        </ol>

        <h4 style="margin:16px 0 8px 0; font-size: 16px; color: #2c3e50;">중기(4~8주)</h4>
        <ol style="line-height:1.8; color:#333; margin-bottom: 16px; padding-left: 24px;">
          <li>약화 근육 활성화 (둔근, 복횡근 등) — 주 3회, 점진적 부하</li>
          <li>필라테스 기구 운동을 포함한 통합 프로그램 — 주 2~3회</li>
          <li>정기 재평가로 프로그램 조정 (3~4주마다)</li>
        </ol>

        <h4 style="margin:16px 0 8px 0; font-size: 16px; color: #2c3e50;">장기(8~12주 이상)</h4>
        <p style="line-height:1.8; color:#333; margin-bottom: 20px;">
          통합적 기능 회복을 목표로 일상화 및 운동강도 증진을 권장합니다. 근력, 유연성, 신경근 제어가 모두 개선되면 자세 개선 효과는 장기적으로 유지됩니다.
        </p>

        <p style="margin-top:20px; padding-top: 16px; border-top: 1px solid #bdc3c7; text-align: center;">
          <em style="color:#2c3e50; font-size: 16px; font-style: normal; font-weight: 600;">
            "우리는 걱정 대신 근거(데이터)로 움직입니다."
          </em>
        </p>
      </div>
    </section>
  `;

  // 푸터
  const footer = `
    <footer style="margin-top:32px; padding: 20px; font-size:0.85rem; color:#666; text-align: center; border-top: 1px solid #e6e6e6;">
      <div>Generated by DIT 자세 분석 AI · ${centerName}</div>
    </footer>
  `;

  // 최종 HTML 조립
  const html = `
    ${header}
    ${measuresSection}
    ${muscleSection}
    ${exercisesSection}
    ${conclusion}
    ${footer}
    </div>
  `;

  return html;
}

