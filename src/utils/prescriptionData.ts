// src/utils/prescriptionData.ts
import { loadCSV, CSVRow } from "./csv";

export type PostureMetricEntry = {
  indexCode: string;
  metricCode: string;
  nameKo: string;
  nameEn: string;
  deviationLabel: string;
  tightMuscles: string[];
  weakMuscles: string[];
  strategy: string;
  notes: string;
};

export type ExerciseEntry = {
  id: string;
  order: number;
  source: "Mat" | "Reformer" | "Cadillac" | "WundaChair" | "Barrel";
  nameKo: string;
  nameEn: string;
  strengthenMuscles: string[];
  stretchMuscles: string[];
  howTo: string;
  spring?: string;
  reps?: string;
  breathing?: string;
  references?: string;
};

export type PrescriptionDataset = {
  postureMetrics: Record<string, PostureMetricEntry>;
  exercises: ExerciseEntry[];
};

const exerciseFiles = [
  { path: "/db/Pilates_Mat_34_Classical.csv", source: "Mat" as const },
  { path: "/db/Pilates_Reformer_42_Classical.csv", source: "Reformer" as const },
  { path: "/db/Pilates_Cadillac_58_Classical.csv", source: "Cadillac" as const },
  { path: "/db/Pilates_WundaChair_28_Classical.csv", source: "WundaChair" as const },
  { path: "/db/Pilates_Barrel_22_Classical.csv", source: "Barrel" as const },
];

let cachedDataset: Promise<PrescriptionDataset> | null = null;

export async function loadPrescriptionDataset(): Promise<PrescriptionDataset> {
  if (cachedDataset) return cachedDataset;

  cachedDataset = (async () => {
    const [metricRows, exerciseGroups] = await Promise.all([
      loadCSV("/db/posture_metrics_full.csv"),
      Promise.all(exerciseFiles.map(async (info) => {
        const rows = await loadCSV(info.path);
        return rows.map((row) => mapExerciseRow(row, info.source));
      })),
    ]);

    const postureMetrics: Record<string, PostureMetricEntry> = {};
    metricRows.forEach((row) => {
      const entry = mapMetricRow(row);
      if (entry.indexCode) {
        postureMetrics[entry.indexCode] = entry;
      }
    });

    const exercises = exerciseGroups.flat().sort((a, b) => {
      if (a.source === b.source) return a.order - b.order;
      const priority: Record<ExerciseEntry["source"], number> = {
        Mat: 1,
        Reformer: 2,
        Cadillac: 3,
        WundaChair: 4,
        Barrel: 5,
      };
      return priority[a.source] - priority[b.source];
    });

    return { postureMetrics, exercises };
  })();

  return cachedDataset;
}

function mapMetricRow(row: CSVRow): PostureMetricEntry {
  return {
    indexCode: (row.Index_Code || row.index_code || "").trim().toUpperCase(),
    metricCode: (row.Metric_Code || row.metric_code || row.Index_Code || "").trim().toUpperCase(),
    nameKo: row.Metric_Name_KR || row.metric_name_kr || "",
    nameEn: row.Metric_Name_EN || row.metric_name_en || "",
    deviationLabel: row.Deviation_Label || row.deviation_label || "",
    tightMuscles: splitMuscles(row.Tight_Muscle || row.tight_muscle),
    weakMuscles: splitMuscles(row.Weak_Muscle || row.weak_muscle),
    strategy: row.Recommended_Strategy || row.recommended_strategy || "",
    notes: row.Notes || row.notes || "",
  };
}

function mapExerciseRow(row: CSVRow, source: ExerciseEntry["source"]): ExerciseEntry {
  const orderRaw = row.csvOrder || row.order || "";
  return {
    id: `${source}-${orderRaw || row.Exercise_Name_EN}`,
    order: Number(orderRaw) || 0,
    source,
    nameKo: row.Exercise_Name_KR || row.name_ko || "",
    nameEn: row.Exercise_Name_EN || row.name_en || "",
    strengthenMuscles: splitMuscles(row.Main_Strengthen_Muscles),
    stretchMuscles: splitMuscles(row.Main_Stretch_Muscles),
    howTo: row.How_to_Perform_Step_by_Step || row.How_to || "",
    spring: row.Spring_Traditional || row.Spring || "",
    reps: row.Reps || "",
    breathing: row.Breathing_Pattern || row.Breathing || "",
    references: row.References || "",
  };
}

function splitMuscles(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/[,/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
