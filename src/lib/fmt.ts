export const START = "2026-10-12";
export const PHASES = [
  { k: "F0", n: "Fundación", a: "2026-09-28", b: "2026-10-11" },
  { k: "F1", n: "Lanzamiento", a: "2026-10-12", b: "2026-11-08" },
  { k: "F2", n: "Tracción", a: "2026-11-09", b: "2026-12-07" },
  { k: "F3", n: "Crecimiento", a: "2026-12-08", b: "2027-01-31" },
];
const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
export const pd = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const days = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 864e5);
export const fd = (s?: string | null) => { if (!s) return ""; const d = pd(s); return `${d.getDate()} ${MES[d.getMonth()]}`; };
export const isoToday = () => { const d = today(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export const fmt = (n: number | null | undefined, dec = 1) =>
  n === null || n === undefined || Number.isNaN(n) ? "—" : Number(n).toLocaleString("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const num = (v: string): number | null => { const t = v.trim().replace(",", "."); if (!t) return null; const n = Number(t); return Number.isNaN(n) ? null : n; };
export const signed = (n: number | null) => (n === null ? "—" : `${n >= 0 ? "+" : ""}${fmt(n)}`);

export function currentPhase() {
  const t = today();
  return PHASES.find(p => t >= pd(p.a) && t <= pd(p.b)) || (t < pd(PHASES[0].a) ? PHASES[0] : PHASES[3]);
}
export function retoWeek() { const d = days(pd(START), today()); return d < 0 ? null : Math.min(8, Math.floor(d / 7)); }
