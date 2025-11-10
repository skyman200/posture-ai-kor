// src/utils/csv.ts
// Lightweight CSV parser for UTF-8 files without external deps.

export type CSVRow = Record<string, string>;

export function parseCSV(text: string): CSVRow[] {
  if (!text) return [];

  const content = text.replace(/\r\n/g, "\n").replace(/\ufeff/g, "");
  const rawRows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n" && !inQuotes) {
      row.push(field);
      rawRows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length || row.length) {
    row.push(field);
    rawRows.push(row);
  }

  if (!rawRows.length) return [];

  const headers = rawRows[0].map((h) => h.trim());
  return rawRows.slice(1).map((cols) => {
    const record: CSVRow = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      record[header] = (cols[idx] ?? "").trim();
    });
    return record;
  });
}

export async function loadCSV(path: string): Promise<CSVRow[]> {
  const target = resolvePath(path);
  const res = await fetch(target);
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: ${target}`);
  }
  const text = await res.text();
  return parseCSV(text);
}

function resolvePath(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.replace(/^\/+/, "");
  if (
    typeof import.meta !== "undefined" &&
    typeof (import.meta as any)?.env?.BASE_URL === "string"
  ) {
    const base = (import.meta as any).env.BASE_URL || "/";
    const prefix = base.endsWith("/") ? base : `${base}/`;
    return `${prefix}${normalized}`;
  }
  if (
    typeof window !== "undefined" &&
    window.location?.origin &&
    typeof document !== "undefined"
  ) {
    const origin = window.location.origin;
    const baseHref = document.querySelector("base")?.getAttribute("href");
    const basePath = baseHref
      ? baseHref.replace(origin, "")
      : window.location.pathname.replace(/\/[^/]*$/, "/");
    const prefix = basePath.endsWith("/") ? basePath : `${basePath}/`;
    return `${origin}${prefix}${normalized}`;
  }
  return path;
}
