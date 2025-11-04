// 분석 규칙 및 근육 피드백
export const analysisRules = {
  cva(angle) {
    if (angle >= 50) {
      return {
        level: "정상",
        color: "green",
        muscles: "정상 범위",
        tips: "현재 자세가 양호합니다.",
      };
    } else if (angle >= 40) {
      return {
        level: "경미",
        color: "yellow",
        muscles: "타이트: 상부승모근, 견갑거근 | 약화: 심부경부굴근",
        tips: "심부경부굴근 활성화, 하부승모근 강화",
      };
    } else {
      return {
        level: "전방머리",
        color: "red",
        muscles: "타이트: 상부승모근, 견갑거근, SCM | 약화: 심부경부굴근, 하부승모근, 능형근",
        tips: "SCM/상부승모근 스트레칭, 심부경부굴근 활성화",
      };
    }
  },

  trunk(angle) {
    const absAngle = Math.abs(angle);
    if (absAngle <= 5) {
      return {
        level: "정상",
        color: "green",
        muscles: "정상 범위",
        tips: "현재 자세가 양호합니다.",
      };
    } else if (absAngle <= 10) {
      return {
        level: angle > 0 ? "전방 경미" : "후방 경미",
        color: "yellow",
        muscles: angle > 0 
          ? "타이트: 장요근, 요추기립근 | 약화: 복횡근, 둔근"
          : "타이트: 둔근, 햄스트링 | 약화: 요추기립근, 장요근",
        tips: angle > 0
          ? "장요근 스트레칭, 복압-복횡근 호흡 훈련"
          : "햄스트링 신장, 복부 안정성 훈련",
      };
    } else {
      return {
        level: angle > 0 ? "전방 체간" : "후방 체간",
        color: "red",
        muscles: angle > 0
          ? "타이트: 장요근, 요추기립근, 복직근 | 약화: 복횡근, 둔근, 햄스트링"
          : "타이트: 둔근, 햄스트링 | 약화: 요추기립근, 장요근",
        tips: angle > 0
          ? "장요근 스트레칭, 복압-복횡근 활성화, 둔근 강화"
          : "햄스트링 신장 후 복부/요추 안정성, 고관절 균형",
      };
    }
  },

  knee(angle) {
    if (angle >= 175 && angle <= 185) {
      return {
        level: "정상",
        color: "green",
        muscles: "정상 범위",
        tips: "현재 자세가 양호합니다.",
      };
    } else if (angle < 175) {
      return {
        level: "굴곡",
        color: "red",
        muscles: "타이트: 햄스트링, 비복근 | 약화: 대퇴사두근",
        tips: "햄스트링 스트레칭, 대퇴사두 강화",
      };
    } else {
      return {
        level: "과신전",
        color: "red",
        muscles: "타이트: 대퇴사두근, 전경골근 | 약화: 햄스트링, 비복근",
        tips: "햄스트링/비복근 강화, 사두/전경골근 유연성",
      };
    }
  },
};

export function generateSummary({ cva, trunk, knee }) {
  let summary = "=== 자세 분석 요약 ===\n\n";
  
  summary += `[머리/경추] ${cva.level}\n`;
  summary += `  - 각도: CVA 기준\n`;
  summary += `  - 근육: ${cva.muscles}\n`;
  summary += `  - 제안: ${cva.tips}\n\n`;
  
  summary += `[몸통/골반] ${trunk.level}\n`;
  summary += `  - 각도: Trunk 기준\n`;
  summary += `  - 근육: ${trunk.muscles}\n`;
  summary += `  - 제안: ${trunk.tips}\n\n`;
  
  summary += `[무릎/하지] ${knee.level}\n`;
  summary += `  - 각도: Knee 기준\n`;
  summary += `  - 근육: ${knee.muscles}\n`;
  summary += `  - 제안: ${knee.tips}\n\n`;
  
  summary += "※ 정기적인 자세 교정 운동을 권장합니다.";
  
  return summary;
}

