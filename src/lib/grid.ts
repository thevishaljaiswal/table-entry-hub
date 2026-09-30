export type ColumnType = "text" | "number" | "date" | "time" | "select";

export interface Column {
  key: string;
  label: string;
  type: ColumnType;
  /** Allowed values for "select" columns. */
  options?: string[];
}

export interface Row {
  id: string;
  values: Record<string, string>;
}

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export const TRAVEL_MODES = ["Flight", "Train", "Bus", "Car", "Cab"];

export const DEFAULT_COLUMNS: Column[] = [
  { key: "from", label: "From", type: "text" },
  { key: "to", label: "To", type: "text" },
  { key: "travel_mode", label: "Travel Mode", type: "select", options: TRAVEL_MODES },
  { key: "departure_date", label: "Departure Date", type: "date" },
  { key: "departure_time", label: "Departure Time", type: "time" },
];

export const SAMPLE_ROWS: Row[] = [
  {
    id: uid(),
    values: {
      from: "Delhi",
      to: "Mumbai",
      travel_mode: "Flight",
      departure_date: "2026-10-12",
      departure_time: "09:45",
    },
  },
  {
    id: uid(),
    values: {
      from: "Chennai",
      to: "Bengaluru",
      travel_mode: "Train",
      departure_date: "2026-10-15",
      departure_time: "14:20",
    },
  },
  {
    id: uid(),
    values: {
      from: "Pune",
      to: "Goa",
      travel_mode: "Bus",
      departure_date: "2026-10-20",
      departure_time: "21:30",
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
