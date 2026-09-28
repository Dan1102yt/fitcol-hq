import { useStore } from "../lib/store";
import { fd, fmt, signed } from "../lib/fmt";
import type { RetoWeek } from "../lib/types";
import { NumInput } from "../components/NumInput";

function Chart({ rows }: { rows: RetoWeek[] }) {
  const w0 = rows.find(r => r.semana === 0 && r.peso != null);
  const pts = rows.filter(r => r.peso != null);
  const W = 720, H = 260, L = 48, R = 20, T = 20, B = 36;
  const base = w0 ? w0.peso! : null;
  let lo = base != null ? base - 1 : 66, hi = base != null ? base + 5 : 74;
  pts.forEach(p => { lo = Math.min(lo, p.peso! - 0.5); hi = Math.max(hi, p.peso! + 0.5); });
  lo = Math.floor(lo); hi = Math.ceil(hi);
  const X = (w: number) => L + (w * (W - L - R)) / 8;
  const Y = (v: number) => T + ((hi - v) * (H - T - B)) / (hi - lo);
  const ticks: number[] = []; for (let v = lo; v <= hi; v++) ticks.push(v);
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label="Peso semanal del reto frente a la franja objetivo">
      {ticks.map(v => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke="var(--line)" />
          <text x={L - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" fontFamily="JetBrains Mono, monospace">{v}</text>
        </g>
      ))}
      {Array.from({ length: 9 }, (_, w) => <text key={w} x={X(w)} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--muted)">S{w}</text>)}
      {base != null && (
        <>
          <path d={`M${X(0)} ${Y(base)} L${X(8)} ${Y(base + 4)} L${X(8)} ${Y(base + 3)} Z`} fill="var(--gold-soft)" stroke="var(--gold)" strokeDasharray="3 3" />
          <text x={X(8) - 6} y={Y(base + 4) - 6} textAnchor="end" fontSize="11" fill="var(--gold)">meta +3 a 4 kg</text>
        </>
      )}
      {pts.length > 1 && <polyline points={pts.map(p => `${X(p.semana)},${Y(p.peso!)}`).join(" ")} fill="none" stroke="var(--blue)" strokeWidth="2.5" />}
      {pts.map((p, i) => (
        <circle key={p.id} cx={X(p.semana)} cy={Y(p.peso!)} r={i === pts.length - 1 ? 5 : 3.5}
          fill={i === pts.length - 1 ? "var(--blue)" : "var(--surface)"} stroke="var(--blue)" strokeWidth="2" />
      ))}
      {last && <text x={X(last.semana) + 8} y={Y(last.peso!) - 8} fontSize="12" fontWeight="700" fill="var(--ink)" fontFamily="JetBrains Mono, monospace">{fmt(last.peso)} kg</text>}
      {!pts.length && <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="13" fill="var(--muted)">Registra la semana 0 para ver la franja objetivo</text>}
    </svg>
  );
}

const FIELDS: [keyof RetoWeek, string][] = [["peso", "Peso kg"], ["grasa", "% grasa"], ["musculo", "Músculo kg"], ["cintura", "Cintura cm"], ["kcal", "kcal prom"], ["proteina", "Proteína g"]];

export default function Reto() {
  const { col, patch } = useStore();
  const rows = col<RetoWeek>("reto").sort((a, b) => a.semana - b.semana);
  const w0 = rows.find(r => r.semana === 0);
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="h2">Reto 8 semanas · +3 a 4 kg medido</h2>
        <p className="sub">Peso = promedio de la semana en ayunas. Bioimpedancia en semanas 0, 4 y 8. Si la cintura sube más de 1 cm dos semanas seguidas, se baja el superávit.</p>
      </div>
      <div className="card"><Chart rows={rows} /></div>
      <div className="tbl"><table>
        <thead><tr><th>Semana</th><th>Medición</th><th className="num">Peso kg</th><th className="num">Cambio</th>{FIELDS.slice(1).map(([, l]) => <th key={l} className="num">{l}</th>)}<th>Video</th></tr></thead>
        <tbody>
          {rows.map(r => {
            const d = w0?.peso != null && r.peso != null ? r.peso - w0.peso : null;
            return (
              <tr key={r.id}>
                <td className="font-mono">S{r.semana}</td>
                <td>{fd(r.medicion)}</td>
                <td className="num"><NumInput label={`Peso semana ${r.semana}`} value={r.peso} onSave={v => patch("reto", r.id, { peso: v })} /></td>
                <td className="num">{signed(d)}</td>
                {FIELDS.slice(1).map(([k, l]) => (
                  <td key={String(k)} className="num"><NumInput label={`${l} semana ${r.semana}`} value={r[k] as number | null} onSave={v => patch("reto", r.id, { [k]: v })} /></td>
                ))}
                <td>{fd(r.video)}</td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
    </section>
  );
}
