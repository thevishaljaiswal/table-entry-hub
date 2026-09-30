import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DataGrid } from "@/components/DataGrid";
import { UploadModal } from "@/components/UploadModal";
import {
  DEFAULT_COLUMNS,
  SAMPLE_ROWS,
  uid,
  type Column,
  type Row,
} from "@/lib/grid";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ledgerworks — Excel-style data entry with bulk upload" },
      {
        name: "description",
        content:
          "A fast, Excel-like data entry grid with inline editing, row selection, and bulk upload of CSV and Excel files with column mapping.",
      },
      { property: "og:title", content: "Ledgerworks — data entry grid" },
      {
        property: "og:description",
        content:
          "Edit rows inline and bulk upload CSV or Excel files straight into the grid.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STORAGE_KEY = "ledgerworks-grid-v1";

function loadState(): { columns: Column[]; rows: Row[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
        return parsed;
      }
    }
  } catch {
    /* fall through to defaults */
  }
  return { columns: DEFAULT_COLUMNS, rows: SAMPLE_ROWS };
}

function Index() {
  const [state, setState] = useState(loadState);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const { columns, rows } = state;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — ignore */
    }
  }, [state]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      Object.values(r.values).some((v) => v.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const addColumn = () => {
    const label = window.prompt("Column name?");
    if (!label?.trim()) return;
    const key = `col_${label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${uid().slice(-4)}`;
    setState((s) => ({
      ...s,
      columns: [...s.columns, { key, label: label.trim(), type: "text" }],
    }));
  };

  const handleImport = (newRows: Row[], newColumns: Column[]) => {
    setState((s) => ({
      columns: [...s.columns, ...newColumns],
      rows: [...s.rows, ...newRows],
    }));
    setUploadOpen(false);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-display text-ink">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#eaf2f8] via-[#eef1f6] to-[#f7f4ee]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-aurora/25 blur-[120px]" />
      <div className="pointer-events-none absolute top-24 right-[-10%] h-[420px] w-[520px] rounded-full bg-glacier/20 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-15%] left-[-8%] h-[460px] w-[560px] rounded-full bg-[#d9c8f0]/30 blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-6 px-6 py-8">
        <section className="animate-rise rounded-3xl border border-white/60 bg-frost/55 shadow-[0_24px_70px_-30px_rgba(30,58,90,0.35)] ring-1 ring-black/5 backdrop-blur-2xl">
          <header className="flex flex-wrap items-center gap-4 border-b border-black/5 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-glacier to-aurora text-sm font-semibold text-white shadow-sm">
                ◧
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">
                  Ledgerworks
                </p>
                <p className="mt-1 text-[11px] text-steel">
                  Data entry grid
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-lg border border-black/5 bg-white/60 px-3 py-2 sm:flex">
                <span className="text-steel">⌕</span>
                <input
                  className="w-40 bg-transparent text-sm text-ink outline-none placeholder:text-steel"
                  placeholder="Search rows…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    rows: [...s.rows, { id: uid(), values: {} }],
                  }))
                }
                className="rounded-lg border border-black/5 bg-white/60 px-3 py-2 text-sm font-medium text-ink transition-transform hover:-translate-y-px active:translate-y-0"
              >
                Add row
              </button>
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="rounded-lg border border-glacier bg-glacier px-4 py-2 text-sm font-medium text-white shadow-[0_8px_20px_-8px_rgba(61,127,176,0.7)] ring-1 ring-glacier transition-transform hover:-translate-y-px active:translate-y-0"
              >
                Bulk upload
              </button>
            </div>
          </header>

          <div className="px-6 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">
                Data grid{" "}
                <span className="text-steel">
                  · {filteredRows.length}
                  {search && ` of ${rows.length}`} rows · {columns.length}{" "}
                  columns
                </span>
              </p>
              <p className="font-mono text-[11px] text-steel">
                click cell to edit · ⏎ confirm · esc cancel
              </p>
            </div>
          </div>

          <DataGrid
            columns={columns}
            rows={filteredRows}
            onChange={(next) => {
              if (search.trim()) {
                const visibleIds = new Set(filteredRows.map((r) => r.id));
                const nextIds = new Set(next.map((r) => r.id));
                const removed = rows.filter(
                  (r) => visibleIds.has(r.id) && !nextIds.has(r.id),
                );
                const removedIds = new Set(removed.map((r) => r.id));
                const updated = rows
                  .filter((r) => !removedIds.has(r.id))
                  .map((r) => next.find((n) => n.id === r.id) ?? r);
                setState((s) => ({ ...s, rows: updated }));
              } else {
                setState((s) => ({ ...s, rows: next }));
              }
            }}
            onAddColumn={addColumn}
          />
        </section>
      </div>

      {uploadOpen && (
        <UploadModal
          columns={columns}
          onClose={() => setUploadOpen(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}
