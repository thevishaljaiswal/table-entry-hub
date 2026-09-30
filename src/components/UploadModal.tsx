import { useRef, useState } from "react";
import type { Column, Row } from "@/lib/grid";
import { guessColumn, uid } from "@/lib/grid";
import { formatSize, parseFile, type ParsedFile } from "@/lib/parse-file";

interface Props {
  columns: Column[];
  onClose: () => void;
  onImport: (rows: Row[], newColumns: Column[]) => void;
}

type Mapping = Record<string, string>; // file header -> column key | "__new__" | "__skip__"

export function UploadModal({ columns, onClose, onImport }: Props) {
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const result = await parseFile(file);
      setParsed(result);
      const auto: Mapping = {};
      for (const h of result.headers) {
        auto[h] = guessColumn(h, columns) ?? "__new__";
      }
      setMapping(auto);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
      setParsed(null);
    }
  };

  const doImport = () => {
    if (!parsed) return;
    const newColumns: Column[] = [];
    const finalMapping: Record<string, string> = {};

    for (const header of parsed.headers) {
      const target = mapping[header];
      if (!target || target === "__skip__") continue;
      if (target === "__new__") {
        const key = `col_${header.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${uid().slice(-4)}`;
        newColumns.push({ key, label: header, type: "text" });
        finalMapping[header] = key;
      } else {
        finalMapping[header] = target;
      }
    }

    const rows: Row[] = parsed.rows.map((r) => {
      const values: Record<string, string> = {};
      parsed.headers.forEach((h, i) => {
        const key = finalMapping[h];
        if (key) values[key] = r[i] ?? "";
      });
      return { id: uid(), values };
    });

    onImport(rows, newColumns);
  };

  const previewRows = parsed?.rows.slice(0, 4) ?? [];

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-ink/25 p-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="animate-rise-d2 max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/60 bg-frost/85 p-6 shadow-[0_30px_80px_-30px_rgba(30,58,90,0.4)] ring-1 ring-black/5 backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Bulk upload"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold leading-tight text-ink">
              {parsed ? `Import ${parsed.name}` : "Bulk upload"}
            </h2>
            <p className="mt-1 text-sm text-steel">
              {parsed
                ? `${parsed.rows.length} rows detected · map each source column to a grid field, then import.`
                : "Drop a CSV, TSV, or Excel file to fill the grid in one pass."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/5 bg-white/60 px-3 py-1.5 text-sm text-ink transition-transform hover:-translate-y-px active:translate-y-0"
          >
            Close
          </button>
        </div>

        {!parsed && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void handleFile(f);
            }}
            className={`mt-5 flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 transition-colors ${
              dragOver
                ? "border-glacier bg-glacier/10"
                : "border-glacier/40 bg-white/40 hover:bg-white/60"
            }`}
          >
            <span className="text-2xl">⬆</span>
            <span className="mt-2 text-sm font-medium text-ink">
              Drop your file here, or click to browse
            </span>
            <span className="mt-1 font-mono text-[11px] text-steel">
              CSV · TSV · XLSX — first row is treated as headers
            </span>
          </button>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {parsed && (
          <>
            <div className="mt-5 rounded-xl border border-dashed border-glacier/40 bg-white/40 p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-white/70 font-mono text-[11px] font-medium text-glacier ring-1 ring-black/5">
                  {parsed.name.split(".").pop()?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {parsed.name}
                  </p>
                  <p className="font-mono text-[11px] text-steel">
                    {formatSize(parsed.size)} · {parsed.rows.length} rows ·{" "}
                    {parsed.headers.length} columns
                  </p>
                </div>
                <span className="ml-auto rounded-md bg-emerald-500/12 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  Parsed
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setParsed(null);
                    setMapping({});
                  }}
                  className="rounded-md border border-black/5 bg-white/60 px-2 py-0.5 text-[11px] text-steel"
                >
                  Replace
                </button>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-separate border-spacing-0 text-[13px]">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wide text-steel">
                      {parsed.headers.map((h) => (
                        <th
                          key={h}
                          className="bg-white/50 px-3 py-1.5 font-medium ring-1 ring-black/5"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[12px] text-ink/80">
                    {previewRows.map((r, i) => (
                      <tr key={i} className={i % 2 ? "bg-white/30" : ""}>
                        {parsed.headers.map((_, j) => (
                          <td
                            key={j}
                            className="border-t border-black/5 px-3 py-1.5 ring-1 ring-black/5"
                          >
                            {r[j] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.rows.length > previewRows.length && (
                  <p className="mt-2 font-mono text-[11px] text-steel">
                    …and {parsed.rows.length - previewRows.length} more rows
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[11px] uppercase tracking-wide text-steel">
                Column mapping
              </p>
              <div className="flex flex-wrap gap-3">
                {parsed.headers.map((h) => (
                  <label
                    key={h}
                    className="flex items-center gap-2 rounded-lg border border-black/5 bg-white/60 px-3 py-2 text-sm text-ink"
                  >
                    <span className="max-w-32 truncate font-mono text-[12px]">
                      {h}
                    </span>
                    <span className="text-steel">→</span>
                    <select
                      className="rounded-md border border-black/5 bg-white px-2 py-1 text-sm text-glacier outline-none"
                      value={mapping[h] ?? "__new__"}
                      onChange={(e) =>
                        setMapping({ ...mapping, [h]: e.target.value })
                      }
                    >
                      {columns.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                      <option value="__new__">+ New column</option>
                      <option value="__skip__">Skip</option>
                    </select>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-black/5 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-black/5 bg-white/60 px-4 py-2 text-sm font-medium text-ink transition-transform hover:-translate-y-px active:translate-y-0"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doImport}
                className="rounded-lg border border-glacier bg-glacier px-4 py-2 text-sm font-medium text-white shadow-[0_8px_20px_-8px_rgba(61,127,176,0.7)] ring-1 ring-glacier transition-transform hover:-translate-y-px active:translate-y-0"
              >
                Import {parsed.rows.length} rows
              </button>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
