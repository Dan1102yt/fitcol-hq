import { useStore } from "../lib/store";
import { fd } from "../lib/fmt";
import type { Tarea } from "../lib/types";

export function TaskRow({ t }: { t: Tarea }) {
  const { patch } = useStore();
  return (
    <label className="flex gap-2.5 items-start py-2 border-b border-line last:border-b-0 cursor-pointer">
      <input type="checkbox" className="mt-1 accent-[var(--gold)]" checked={!!t.hecho} onChange={e => patch("tareas", t.id, { hecho: e.target.checked })} />
      <span className={t.hecho ? "line-through text-muted" : ""}>{t.titulo} <span className="text-muted">· {t.responsable}</span></span>
      <span className="ml-auto text-xs text-muted font-mono whitespace-nowrap">{fd(t.fecha)}</span>
    </label>
  );
}
