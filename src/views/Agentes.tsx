import { useState } from "react";
import { useStore } from "../lib/store";
import type { Agente } from "../lib/types";

function CopyBtn({ text }: { text: string }) {
  const [label, setLabel] = useState("Copiar");
  return (
    <button className="btn-ghost" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setLabel("Copiado"); }
      catch { setLabel("No se pudo copiar: selecciónalo a mano"); }
      setTimeout(() => setLabel("Copiar"), 2000);
    }}>{label}</button>
  );
}

export default function Agentes() {
  const { col, patch } = useStore();
  const rows = col<Agente>("agentes").sort((a, b) => (a.orden || 0) - (b.orden || 0));
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="h2">Agentes</h2>
        <p className="sub">Cada agente es un rol que invocas en un chat con Claude. Copia su instrucción, añade los datos de la semana y recibe el entregable en su formato fijo.</p>
      </div>
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))]">
        {rows.map(a => (
          <div key={a.id} className="card flex flex-col gap-2">
            <div className="flex justify-between gap-2 items-start">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted">{a.area} · {a.fase}</div>
                <h3 className="m-0 text-[15px] font-semibold">{a.nombre}</h3>
              </div>
              <select className={`inp ${a.estado === "Activo" ? "text-good" : ""}`} aria-label="Estado del agente" value={a.estado}
                onChange={e => patch("agentes", a.id, { estado: e.target.value })}>
                {["Activo", "Pendiente", "Pausado"].map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <p className="m-0 text-muted">{a.mision}</p>
            <ul className="m-0 pl-4 text-muted text-[13px] list-disc">{(a.entregables || []).map(x => <li key={x}>{x}</li>)}</ul>
            <details>
              <summary className="cursor-pointer font-semibold text-[13px]">Instrucción para invocarlo</summary>
              <pre className="whitespace-pre-wrap font-mono text-xs bg-surface2 p-2.5 rounded-md my-2">{a.prompt}</pre>
              <CopyBtn text={a.prompt} />
            </details>
          </div>
        ))}
      </div>
    </section>
  );
}
