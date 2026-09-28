import { useStore } from "../lib/store";
import type { Empresa } from "../lib/types";

export default function Identidad() {
  const { get, patch } = useStore();
  const e = get<Empresa>("config", "empresa");
  if (!e) return <p className="text-muted">Sin datos de identidad.</p>;
  const toggle = (key: "canales" | "correos", i: number, v: boolean) => {
    const list = e[key].map((x, j) => (j === i ? { ...x, creado: v } : x));
    patch("config", "empresa", { [key]: list });
  };
  return (
    <section className="flex flex-col gap-5">
      <div><h2 className="h2">Identidad</h2><p className="sub">{e.mision}</p></div>
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="tile"><span className="tile-k">Tagline</span><span className="font-display uppercase text-xl">{e.tagline}</span></div>
        <div className="tile"><span className="tile-k">Dominio</span><span className="tile-v text-xl">{e.dominio}</span></div>
      </div>
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))]">
        <div className="tbl"><table>
          <thead><tr><th>Creado</th><th>Canal</th><th>Usuario</th><th>Uso</th></tr></thead>
          <tbody>{e.canales.map((x, i) => (
            <tr key={x.canal}><td><input type="checkbox" className="accent-[var(--gold)]" aria-label={`${x.canal} creado`} checked={x.creado} onChange={ev => toggle("canales", i, ev.target.checked)} /></td>
              <td>{x.canal}</td><td className="font-mono">{x.usuario}</td><td className="text-muted">{x.uso}</td></tr>
          ))}</tbody>
        </table></div>
        <div className="tbl"><table>
          <thead><tr><th>Creado</th><th>Correo</th><th>Para qué</th></tr></thead>
          <tbody>{e.correos.map((x, i) => (
            <tr key={x.correo}><td><input type="checkbox" className="accent-[var(--gold)]" aria-label={`${x.correo} creado`} checked={x.creado} onChange={ev => toggle("correos", i, ev.target.checked)} /></td>
              <td className="font-mono">{x.correo}</td><td className="text-muted">{x.uso}</td></tr>
          ))}</tbody>
        </table></div>
      </div>
      <div className="card">
        <h2 className="h2">Colores</h2>
        <div className="flex flex-wrap gap-4 mt-2">
          {e.colores.map(c => (
            <div key={c.hex} className="flex gap-2 items-center">
              <span className="w-7 h-7 rounded-md border border-line" style={{ background: c.hex }} />
              <span><b>{c.nombre}</b><br /><span className="font-mono text-muted">{c.hex}</span></span>
            </div>
          ))}
        </div>
        <p className="sub mt-3 mb-0">Bio: {e.bio}</p>
      </div>
    </section>
  );
}
