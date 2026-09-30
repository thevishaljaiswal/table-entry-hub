import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedFile {
  name: string;
  size: number;
  headers: string[];
  rows: string[][];
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "csv" || ext === "tsv" || ext === "txt") {
    return parseCsv(file, ext === "tsv" ? "\t" : undefined);
  }
  if (ext === "xlsx" || ext === "xls") {
    return parseExcel(file);
  }
  throw new Error(`Unsupported file type ".${ext}". Use CSV, TSV, or XLSX.`);
}

function parseCsv(file: File, delimiter?: string): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      delimiter,
      skipEmptyLines: true,
      complete: (result) => {
        const data = result.data.filter((r) => r.some((c) => c?.trim()));
        const [head, ...rest] = data;
        if (!head) return reject(new Error("The file is empty."));
        resolve({
          name: file.name,
          size: file.size,
          headers: head.map((h, i) => h?.trim() || `Column ${i + 1}`),
          rows: rest,
        });
      },
      error: (err) => reject(new Error(`Could not parse file: ${err.message}`)),
    });
  });
}

async function parseExcel(file: File): Promise<ParsedFile> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("The workbook has no sheets.");
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error("Could not read the first sheet.");
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  const clean = data.filter((r) => r.some((c) => String(c).trim()));
  const [head, ...rest] = clean;
  if (!head) throw new Error("The file is empty.");
  return {
    name: file.name,
    size: file.size,
    headers: head.map((h, i) => String(h).trim() || `Column ${i + 1}`),
    rows: rest.map((r) => r.map((c) => String(c))),
  };
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
