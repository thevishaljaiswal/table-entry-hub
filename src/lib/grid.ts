export type ColumnType = "text" | "number" | "date";

export interface Column {
  key: string;
  label: string;
  type: ColumnType;
}

export interface Row {
  id: string;
  values: Record<string, string>;
}

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export const DEFAULT_COLUMNS: Column[] = [
  { key: "vendor", label: "Vendor", type: "text" },
  { key: "region", label: "Region", type: "text" },
  { key: "contact", label: "Contact", type: "text" },
  { key: "spend", label: "Spend", type: "number" },
  { key: "renewal", label: "Renewal", type: "date" },
  { key: "status", label: "Status", type: "text" },
];

export const SAMPLE_ROWS: Row[] = [
  {
    id: uid(),
    values: {
      vendor: "Northwind Foods",
      region: "EMEA",
      contact: "A. Whitfield",
      spend: "84200",
      renewal: "2026-03-14",
      status: "Active",
    },
  },
  {
    id: uid(),
    values: {
      vendor: "Meridian Textiles",
      region: "APAC",
      contact: "R. Tanaka",
      spend: "12650",
      renewal: "2025-11-02",
      status: "Pending",
    },
  },
  {
    id: uid(),
    values: {
      vendor: "Comet Analytics",
      region: "AMER",
      contact: "S. Rivera",
      spend: "9040",
      renewal: "2026-01-20",
      status: "Draft",
    },
  },
];

/** Fuzzy-match a file header to a grid column key. */
export function guessColumn(header: string, columns: Column[]): string | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const h = norm(header);
  if (!h) return null;
  for (const c of columns) {
    if (norm(c.label) === h || norm(c.key) === h) return c.key;
  }
  for (const c of columns) {
    const l = norm(c.label);
    if (l && (h.includes(l) || l.includes(h))) return c.key;
  }
  return null;
}

export function statusTone(status: string): string {
  const s = status.toLowerCase();
  if (["active", "open", "done", "paid", "approved"].includes(s))
    return "bg-emerald-500/12 text-emerald-700";
  if (["pending", "review", "in progress", "on hold"].includes(s))
    return "bg-amber-500/14 text-amber-700";
  if (["draft", "new", ""].includes(s)) return "bg-zinc-500/12 text-zinc-600";
  if (["blocked", "overdue", "failed", "cancelled"].includes(s))
    return "bg-red-500/12 text-red-700";
  return "bg-glacier/12 text-glacier";
}
