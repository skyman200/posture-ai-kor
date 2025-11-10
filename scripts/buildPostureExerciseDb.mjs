#!/usr/bin/env node
/**
 * Generate posture exercise recommendation DB (JSON + CSV) from Posture_Muscle_DB_Full.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const srcPath = path.join(rootDir, 'public', 'db', 'Posture_Muscle_DB_Full.json');
const jsonOutPath = path.join(rootDir, 'public', 'db', 'Posture_Exercise_Recommendations.json');
const csvOutPath = path.join(rootDir, 'public', 'db', 'Posture_Exercise_Recommendations.csv');

const raw = JSON.parse(readFileSync(srcPath, 'utf8'));

const rows = raw.map((item) => {
  const recommended = item.recommended_focus || {};
  const musclePattern = item.muscle_pattern || {};
  const stretch = Array.isArray(recommended.stretch) ? recommended.stretch : [];
  const strengthen = Array.isArray(recommended.strengthen) ? recommended.strengthen : [];
  const mobility = Array.isArray(recommended.mobility) ? recommended.mobility : [];
  const tightPrimary = Array.isArray(musclePattern.tight?.primary) ? musclePattern.tight.primary : [];
  const weakPrimary = Array.isArray(musclePattern.weak?.primary) ? musclePattern.weak.primary : [];

  const summaryParts = [];
  if (stretch.length) summaryParts.push(`스트레칭: ${stretch.join(', ')}`);
  if (strengthen.length) summaryParts.push(`강화: ${strengthen.join(', ')}`);
  if (mobility.length) summaryParts.push(`가동성: ${mobility.join(', ')}`);

  return {
    posture_key: item.key || item.posture_en,
    posture_ko: item.posture_ko || '',
    region: item.region || '',
    exercise_key: item.exercise_key || (item.key || '').replace(/\s+/g, '_'),
    tight_primary: tightPrimary.join(', '),
    weak_primary: weakPrimary.join(', '),
    stretch_focus: stretch.join(', '),
    strengthen_focus: strengthen.join(', '),
    mobility_focus: mobility.join(', '),
    recommended_summary: summaryParts.join(' | '),
    clinical_notes: Array.isArray(item.clinical_significance) ? item.clinical_significance.join('; ') : ''
  };
});

writeFileSync(jsonOutPath, JSON.stringify(rows, null, 2), 'utf8');

const header = Object.keys(rows[0]);
const csvLines = [
  header.join(','),
  ...rows.map((row) => header.map((key) => {
    const value = (row[key] ?? '').toString().replace(/"/g, '""');
    return `"${value}"`;
  }).join(','))
];
writeFileSync(csvOutPath, '\ufeff' + csvLines.join('\n'), 'utf8');

console.log(`Generated ${rows.length} posture exercise entries.`);
