import { useState } from "react";
import { useStore } from "../lib/store";
import { PHASES, currentPhase, fd } from "../lib/fmt";
import type { Tarea } from "../lib/types";
import { TaskRow } from "../components/TaskRow";

export default function Tareas() {
  const { col, add } = useStore();
  const tareas = col<Tarea>("tareas");
  const [titulo, setTitulo] = useState("");
  const [fase, setFase] = useState(currentPhase().k);
  const [fecha, setFecha] = useState("");
  const [resp, setResp] = useState("Oscar");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    add("tareas", { titulo: titulo.trim(), fase, fecha: fecha || null, responsable: resp, hecho: false });
    setTitulo(""); setFecha("");
  };

  return (
    <section className="flex flex-col gap-5">
      <div><h2 className="h2">Tareas por fase</h2><p className="sub">Una fase se cierra cuando todas sus tareas están hechas.</p></div>
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))]">
        {PHASES.map(p => {
          const ts = tareas.filter(t => t.fase === p.k).sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
          const d = ts.filter(t => t.hecho).length;
          return (
            <div key={p.k} className="card">
              <div className="flex justify-between items-center"><h2 className="h2">{p.k} · {p.n}</h2>
                <span className={`pill ${d === ts.length && ts.length ? "text-good" : "text-muted"}`}>{d}/{ts.length}</span></div>
              <p className="sub">{fd(p.a)} – {fd(p.b)}</p>
              {ts.length ? ts.map(t => <TaskRow key={t.id} t={t} />) : <p className="text-muted">Sin tareas.</p>}
            </div>
          );
        })}
      </div>
      <form className="card flex flex-wrap gap-2 items-center" onSubmit={submit}>
        <h2 className="h2 w-full">Nueva tarea</h2>
        <input className="inp py-1.5 flex-[1_1_240px]" placeholder="Qué hay que hacer" aria-label="Tarea" value={titulo} onChange={e => setTitulo(e.target.value)} required />
        <select className="inp py-1.5" aria-label="Fase" value={fase} onChange={e => setFase(e.target.value)}>
          {PHASES.map(p => <option key={p.k} value={p.k}>{p.k} · {p.n}</option>)}
        </select>
        <input className="inp py-1.5" type="date" aria-label="Fecha" value={fecha} onChange={e => setFecha(e.target.value)} />
        <select className="inp py-1.5" aria-label="Responsable" value={resp} onChange={e => setResp(e.target.value)}><option>Oscar</option><option>Claude</option></select>
        <button className="btn">Añadir</button>
      </form>
    </section>
  );
}
