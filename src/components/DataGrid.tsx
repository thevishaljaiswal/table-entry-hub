import { useMemo, useState } from "react";
import type { Column, Row } from "@/lib/grid";
import { statusTone, uid } from "@/lib/grid";

interface Props {
  columns: Column[];
  rows: Row[];
  onChange: (rows: Row[]) => void;
  onAddColumn: () => void;
}

const TYPE_TAG: Record<Column["type"], string> = {
  text: "TEXT",
  number: "NUM",
  date: "DATE",
  time: "TIME",
  select: "SELECT",
};

export function DataGrid({ columns, rows, onChange, onAddColumn }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ rowId: string; key: string } | null>(
    null,
  );

  const allSelected = rows.length > 0 && selected.size === rows.length;

  const toggleAll = () => {
    setSelected(
      allSelected ? new Set() : new Set(rows.map((r) => r.id)),
    );
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const updateCell = (rowId: string, key: string, value: string) => {
    onChange(
      rows.map((r) =>
        r.id === rowId ? { ...r, values: { ...r.values, [key]: value } } : r,
      ),
    );
  };

  const addRow = () => {
    const empty: Row = { id: uid(), values: {} };
    onChange([...rows, empty]);
    setEditing({ rowId: empty.id, key: columns[0]?.key ?? "" });
  };

  const deleteSelected = () => {
    onChange(rows.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
  };

  const deleteRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
    const next = new Set(selected);
    next.delete(id);
    setSelected(next);
  };

  const cellClass = useMemo(
    () =>
      "border-t border-black/5 px-4 py-2 ring-1 ring-black/5",
    [],
  );

  return (
    <div className="overflow-x-auto px-6 pb-6">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-steel">
            <th className="w-10 rounded-l-lg bg-white/40 px-4 py-2.5 font-medium ring-1 ring-black/5">
              <input
                type="checkbox"
                className="size-3.5 accent-glacier"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all rows"
              />
            </th>
            <th className="w-10 bg-white/40 px-2 py-2.5 font-medium ring-1 ring-black/5">
              #
            </th>
            {columns.map((c) => (
              <th
                key={c.key}
                className="bg-white/40 px-4 py-2.5 font-medium ring-1 ring-black/5"
              >
                {c.label}
                <span className="ml-1 font-mono text-[9px] text-steel/70">
                  {TYPE_TAG[c.type]}
                </span>
              </th>
            ))}
            <th className="w-12 rounded-r-lg bg-white/40 px-4 py-2.5 font-medium ring-1 ring-black/5">
              ⋯
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + 3}
                className="border-t border-black/5 px-4 py-10 text-center text-sm text-steel ring-1 ring-black/5"
              >
                No rows yet — add a row or bulk upload a file to get started.
              </td>
            </tr>
          )}
          {rows.map((row, i) => {
            const isSelected = selected.has(row.id);
            return (
              <tr
                key={row.id}
                className={`transition-colors ${
                  isSelected
                    ? "bg-glacier/10"
                    : i % 2 === 0
                      ? "bg-white/45 hover:bg-white/75"
                      : "bg-white/30 hover:bg-white/75"
                }`}
              >
                <td className={cellClass}>
                  <input
                    type="checkbox"
                    className="size-3.5 accent-glacier"
                    checked={isSelected}
                    onChange={() => toggleRow(row.id)}
                    aria-label={`Select row ${i + 1}`}
                  />
                </td>
                <td className={`${cellClass} px-2 font-mono text-[11px] text-steel`}>
                  {String(i + 1).padStart(2, "0")}
                </td>
                {columns.map((c) => {
                  const isEditing =
                    editing?.rowId === row.id && editing.key === c.key;
                  const value = row.values[c.key] ?? "";
                  return (
                    <td
                      key={c.key}
                      className={`${cellClass} ${
                        c.type === "number" || c.type === "date" || c.type === "time"
                          ? "font-mono"
                          : ""
                      } ${isEditing ? "ring-2 ring-glacier/50" : ""}`}
                      onDoubleClick={() =>
                        setEditing({ rowId: row.id, key: c.key })
                      }
                    >
                      {isEditing && c.type === "select" ? (
                        <select
                          autoFocus
                          className="w-full cursor-pointer rounded-md border border-black/10 bg-white/70 px-1.5 py-1 text-sm text-ink outline-none"
                          value={value}
                          onChange={(e) =>
                            updateCell(row.id, c.key, e.target.value)
                          }
                          onBlur={() => setEditing(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Escape")
                              setEditing(null);
                          }}
                        >
                          <option value="">—</option>
                          {c.options?.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : isEditing ? (
                        <input
                          autoFocus
                          type={
                            c.type === "number"
                              ? "number"
                              : c.type === "date"
                                ? "date"
                                : c.type === "time"
                                  ? "time"
                                  : "text"
                          }
                          className="w-full bg-transparent text-sm outline-none"
                          value={value}
                          onChange={(e) =>
                            updateCell(row.id, c.key, e.target.value)
                          }
                          onBlur={() => setEditing(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Escape")
                              setEditing(null);
                          }}
                        />
                      ) : c.type === "select" ? (
                        <select
                          className={`w-full cursor-pointer appearance-none rounded-md px-2 py-0.5 text-center text-[11px] font-medium outline-none transition-colors ${
                            value
                              ? statusTone(value)
                              : "bg-zinc-500/12 text-zinc-600"
                          }`}
                          value={value}
                          onChange={(e) =>
                            updateCell(row.id, c.key, e.target.value)
                          }
                          aria-label={c.label}
                        >
                          <option value="">—</option>
                          {c.options?.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({ rowId: row.id, key: c.key })
                          }
                          className={`block w-full cursor-text text-left ${
                            value
                              ? c.type === "text" && c.key === columns[0]?.key
                                ? "font-medium text-ink"
                                : "text-ink"
                              : "text-steel"
                          }`}
                        >
                          {value || "—"}
                        </button>
                      )}
                    </td>
                  );
                })}
                <td className={`${cellClass} text-steel`}>
                  <button
                    type="button"
                    onClick={() => deleteRow(row.id)}
                    className="rounded px-1 hover:text-destructive"
                    aria-label={`Delete row ${i + 1}`}
                    title="Delete row"
                  >
                    ⋯
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border border-black/5 bg-white/50 px-2.5 py-1 text-steel transition-transform hover:-translate-y-px active:translate-y-0"
        >
          + New row
        </button>
        <button
          type="button"
          onClick={onAddColumn}
          className="rounded-md border border-black/5 bg-white/50 px-2.5 py-1 text-steel transition-transform hover:-translate-y-px active:translate-y-0"
        >
          + New column
        </button>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={deleteSelected}
            className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-destructive transition-transform hover:-translate-y-px active:translate-y-0"
          >
            Delete {selected.size} selected
          </button>
        )}
        <p className="ml-auto font-mono text-[11px] text-steel">
          {selected.size} selected · click a cell to edit
        </p>
      </div>
    </div>
  );
}
