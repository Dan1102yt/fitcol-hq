import { useStore } from "../lib/store";
import { fd } from "../lib/fmt";
import type { Contenido } from "../lib/types";
import { NumInput } from "../components/NumInput";

const ESTADOS = ["Idea", "Guion listo", "Grabado", "Publicado"];

export default function ContenidoView() {
  const { col, patch } = useStore();
  const rows = col<Contenido>("contenido").sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="h2">Calendario de contenido</h2>
        <p className="sub">Un video del reto cada lunes y una pieza de apoyo en la cuenta oficial. El agente de Marketing entrega el guion el sábado.</p>
      </div>
      <div className="tbl"><table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Pieza</th><th>Canal</th><th>Estado</th><th className="num">Vistas</th><th className="num">Guardados</th></tr></thead>
        <tbody>
          {rows.map(c => (
            <tr key={c.id}>
              <td className="font-mono">{fd(c.fecha)}</td>
              <td>{c.tipo}</td>
              <td>{c.titulo}</td>
              <td className="text-muted">{c.canal}</td>
              <td>
                <select className={`inp ${c.estado === "Publicado" ? "text-good" : c.estado === "Grabado" ? "text-gold" : c.estado === "Guion listo" ? "text-warn" : ""}`}
                  aria-label="Estado" value={c.estado} onChange={e => patch("contenido", c.id, { estado: e.target.value })}>
                  {ESTADOS.map(e => <option key={e}>{e}</option>)}
                </select>
              </td>
              <td className="num"><NumInput label="Vistas" value={c.vistas} onSave={v => patch("contenido", c.id, { vistas: v })} /></td>
              <td className="num"><NumInput label="Guardados" value={c.guardados} onSave={v => patch("contenido", c.id, { guardados: v })} /></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </section>
  );
}
