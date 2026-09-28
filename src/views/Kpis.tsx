import { useState } from "react";
import { useStore } from "../lib/store";
import { fd, fmt, isoToday, num } from "../lib/fmt";
import type { Kpi } from "../lib/types";

function LogCell({ k }: { k: Kpi }) {
  const { patch } = useStore();
  const [txt, setTxt] = useState("");
  const save = () => {
    const v = num(txt); if (v === null) return;
    const iso = isoToday();
    const vals = (k.values || []).filter(x => x.fecha !== iso).concat([{ fecha: iso, v }]);
    patch("kpis", k.id, { values: vals }); setTxt("");
  };
  return (
    <div className="flex gap-2 items-center">
      <input className="inp-n" inputMode="decimal" aria-label={`Valor de ${k.nombre}`} value={txt}
        onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === "Enter" && save()} />
      <button className="btn-ghost" onClick={save}>Guardar</button>
    </div>
  );
}

export default function Kpis() {
  const { col } = useStore();
  const rows = col<Kpi>("kpis").sort((a, b) => (a.orden || 0) - (b.orden || 0));
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="h2">KPIs de la empresa</h2>
        <p className="sub">Registra el valor cada lunes. Las metas se recalibran el 9 de noviembre con los datos de la Fase 1.</p>
      </div>
      <div className="tbl"><table>
        <thead><tr><th>Área</th><th>KPI</th><th>Cómo se mide</th><th className="num">Último</th><th>Fecha</th><th className="num">Meta 7 dic</th><th className="num">Meta 31 mar</th><th>Registrar hoy</th></tr></thead>
        <tbody>
          {rows.map(k => {
            const l = (k.values || []).at(-1);
            return (
              <tr key={k.id}>
                <td className="text-muted">{k.area}</td>
                <td><b>{k.nombre}</b>{k.north && <span className="pill text-gold ml-1.5">norte</span>}</td>
                <td className="text-muted">{k.como}</td>
                <td className="num">{l ? fmt(l.v, k.dec ?? 0) : "—"}</td>
                <td className="font-mono text-muted">{l ? fd(l.fecha) : ""}</td>
                <td className="num">{k.meta_dic}</td>
                <td className="num">{k.meta_mar}</td>
                <td><LogCell k={k} /></td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
    </section>
  );
}
