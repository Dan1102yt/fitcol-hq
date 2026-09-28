import { useState } from "react";
import { useStore } from "../lib/store";
import { fd, fmt, num } from "../lib/fmt";
import type { Comparacion } from "../lib/types";

const FIELDS: [keyof Comparacion, string][] = [
  ["fitcol_kcal", "kcal Fitcol"], ["fitia_kcal", "kcal Fitia"], ["fitcol_prot", "prot Fitcol"],
  ["fitia_prot", "prot Fitia"], ["fitcol_seg", "s Fitcol"], ["fitia_seg", "s Fitia"],
];

export default function Comparativo() {
  const { col, add } = useStore();
  const rows = col<Comparacion>("comparativo").sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  const valid = rows.filter(r => r.fitcol_kcal != null && r.fitia_kcal != null);
  const avgDiff = valid.length ? (valid.reduce((s, r) => s + Math.abs(r.fitcol_kcal! - r.fitia_kcal!) / r.fitia_kcal!, 0) / valid.length) * 100 : null;
  const avg = (k: keyof Comparacion) => { const a = rows.filter(r => r[k] != null); return a.length ? a.reduce((s, r) => s + (r[k] as number), 0) / a.length : null; };

  const [form, setForm] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, any> = { fecha: form.fecha, comida: (form.comida || "").trim() };
    FIELDS.forEach(([k]) => { data[k as string] = num(form[k as string] || ""); });
    add("comparativo", data); setForm({});
  };

  return (
    <section className="flex flex-col gap-5">
      <div><h2 className="h2">Fitcol vs Fitia</h2><p className="sub">Misma comida registrada en ambas apps. Envía capturas de Fitia al chat y Claude carga las filas; también puedes añadirlas aquí.</p></div>
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="tile"><span className="tile-k">Comidas comparadas</span><span className="tile-v">{rows.length}</span></div>
        <div className="tile"><span className="tile-k">Diferencia media de kcal</span><span className="tile-v">{avgDiff === null ? "—" : `${fmt(avgDiff)} %`}</span><span className="text-xs text-muted">|Fitcol − Fitia| / Fitia</span></div>
        <div className="tile"><span className="tile-k">Tiempo por registro</span><span className="tile-v">{fmt(avg("fitcol_seg"), 0)} <small className="text-[13px] text-muted font-medium">s Fitcol</small></span><span className="text-xs text-muted">Fitia: {fmt(avg("fitia_seg"), 0)} s</span></div>
      </div>
      {rows.length ? (
        <div className="tbl"><table>
          <thead><tr><th>Fecha</th><th>Comida</th>{FIELDS.map(([, l]) => <th key={l} className="num">{l}</th>)}</tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r.id}><td className="font-mono">{fd(r.fecha)}</td><td>{r.comida}</td>
              {FIELDS.map(([k]) => <td key={String(k)} className="num">{fmt(r[k] as number | null, 0)}</td>)}</tr>
          ))}</tbody>
        </table></div>
      ) : <div className="p-6 text-center text-muted border border-dashed border-line rounded-lg">Aún no hay comidas comparadas.</div>}
      <form className="card flex flex-wrap gap-2 items-center" onSubmit={submit}>
        <h2 className="h2 w-full">Añadir comida</h2>
        <input className="inp py-1.5" type="date" aria-label="Fecha" required value={form.fecha || ""} onChange={e => set("fecha", e.target.value)} />
        <input className="inp py-1.5 flex-[1_1_180px]" placeholder="Comida" aria-label="Comida" required value={form.comida || ""} onChange={e => set("comida", e.target.value)} />
        {FIELDS.map(([k, l]) => (
          <input key={String(k)} className="inp-n py-1.5 w-24" inputMode="decimal" placeholder={l} aria-label={l} value={form[k as string] || ""} onChange={e => set(k as string, e.target.value)} />
        ))}
        <button className="btn">Añadir</button>
      </form>
    </section>
  );
}
