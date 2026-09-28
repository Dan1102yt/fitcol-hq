import { useStore } from "../lib/store";
import { PHASES, currentPhase, fmt, fd, pd, signed, today } from "../lib/fmt";
import type { Contenido, Kpi, RetoWeek, Tarea } from "../lib/types";
import { TaskRow } from "../components/TaskRow";

const lastVal = (k: Kpi) => { const v = (k.values || []).filter(x => x.v != null); return v.length ? v[v.length - 1].v : null; };

export default function Resumen() {
  const { col } = useStore();
  const kpis = col<Kpi>("kpis");
  const reto = col<RetoWeek>("reto").sort((a, b) => a.semana - b.semana);
  const contenido = col<Contenido>("contenido");
  const tareas = col<Tarea>("tareas");

  const north = kpis.find(k => k.north);
  const w0 = reto.find(r => r.semana === 0 && r.peso != null);
  const lastW = [...reto].reverse().find(r => r.peso != null);
  const delta = w0 && lastW ? lastW.peso! - w0.peso! : null;
  const vids = contenido.filter(c => c.tipo === "Video del reto");
  const pub = vids.filter(c => c.estado === "Publicado").length;
  const ph = currentPhase();
  const tPh = tareas.filter(t => t.fase === ph.k);
  const tDone = tPh.filter(t => t.hecho).length;
  const pct = tPh.length ? Math.round((tDone / tPh.length) * 100) : 0;
  const pick = ["Seguidores IG + TikTok", "Usuarios registrados", "Usuarios Fitcol Pro"].map(n => kpis.find(k => k.nombre === n)).filter(Boolean) as Kpi[];
  const next = tPh.filter(t => !t.hecho).sort((a, b) => (a.fecha || "").localeCompare(b.fecha || "")).slice(0, 6);
  const nv = north ? lastVal(north) : null;

  return (
    <section className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
        {PHASES.map(p => (
          <div key={p.k} className={`px-2.5 py-2 rounded-md text-xs ${p === ph ? "bg-goldsoft outline outline-1 outline-gold" : "bg-surface2"} ${today() > pd(p.b) ? "opacity-55" : ""}`}>
            <b className="block text-[13px]">{p.k} · {p.n}</b>{fd(p.a)} – {fd(p.b)}
          </div>
        ))}
      </div>
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {north && (
          <div className="tile border-gold bg-goldsoft">
            <span className="tile-k">Métrica norte · {north.nombre}</span>
            <span className="tile-v">{fmt(nv, 0)} <small className="text-[13px] text-muted font-medium">/ {north.meta_dic} a 7 dic</small></span>
            <div className="bar"><i style={{ width: `${Math.min(100, ((nv || 0) / Number(north.meta_dic)) * 100)}%` }} /></div>
            <span className="text-xs text-muted">Registran comida 3+ días en la semana</span>
          </div>
        )}
        <div className="tile">
          <span className="tile-k">Reto · cambio de peso</span>
          <span className="tile-v">{signed(delta)} <small className="text-[13px] text-muted font-medium">kg · meta +3 a 4</small></span>
          <span className="text-xs text-muted">{lastW ? `Última medición: semana ${lastW.semana} · ${fmt(lastW.peso)} kg` : "Sin mediciones aún · semana 0 el 10 oct"}</span>
        </div>
        <div className="tile">
          <span className="tile-k">Videos del reto publicados</span>
          <span className="tile-v">{pub} <small className="text-[13px] text-muted font-medium">/ {vids.length || 9}</small></span>
          <div className="bar"><i style={{ width: `${vids.length ? (pub / vids.length) * 100 : 0}%` }} /></div>
          <span className="text-xs text-muted">Cada lunes 7:00 p. m.</span>
        </div>
        <div className="tile">
          <span className="tile-k">Tareas {ph.k} · {ph.n}</span>
          <span className="tile-v">{pct}% <small className="text-[13px] text-muted font-medium">{tDone}/{tPh.length}</small></span>
          <div className="bar"><i style={{ width: `${pct}%` }} /></div>
          <span className="text-xs text-muted">Puerta de fase: todo en verde</span>
        </div>
      </div>
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))]">
        <div className="card">
          <h2 className="h2">Próximas tareas</h2><p className="sub">Fase actual, por fecha.</p>
          {next.length ? next.map(t => <TaskRow key={t.id} t={t} />) : <p className="text-muted">Todo listo en esta fase.</p>}
        </div>
        <div className="card">
          <h2 className="h2">KPIs clave</h2><p className="sub">Último valor registrado vs meta a 7 dic.</p>
          <div className="tbl"><table><thead><tr><th>KPI</th><th className="num">Actual</th><th className="num">Meta dic</th></tr></thead><tbody>
            {pick.map(k => <tr key={k.id}><td>{k.nombre}</td><td className="num">{fmt(lastVal(k), k.dec ?? 0)}</td><td className="num">{k.meta_dic}</td></tr>)}
          </tbody></table></div>
        </div>
      </div>
    </section>
  );
}
