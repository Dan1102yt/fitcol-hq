import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import type { Doc } from "./types";

// Todo el panel vive en UNA tabla (hq_docs): cada fila es un documento
// {collection, id, data}. Se carga una vez y luego se mantiene al día con
// Supabase Realtime, así lo que edites en el celular aparece en el PC al instante.
type Row = { collection: string; id: string; data: Record<string, any>; updated_at: string };
type Store = {
  ready: boolean;
  error: string | null;
  col: <T extends Doc>(name: string) => T[];
  get: <T = any>(name: string, id: string) => T | null;
  patch: (collection: string, id: string, data: Record<string, any>) => Promise<void>;
  add: (collection: string, data: Record<string, any>) => Promise<void>;
  remove: (collection: string, id: string) => Promise<void>;
};

const Ctx = createContext<Store | null>(null);
const key = (c: string, i: string) => `${c}/${i}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<Map<string, Row>>(new Map());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from("hq_docs").select("collection,id,data,updated_at").limit(5000);
      if (!alive) return;
      if (error) { setError(error.message); setReady(true); return; }
      setRows(new Map((data as Row[]).map(r => [key(r.collection, r.id), r])));
      setReady(true);
    })();
    const ch = supabase
      .channel("hq_docs_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "hq_docs" }, payload => {
        setRows(prev => {
          const next = new Map(prev);
          if (payload.eventType === "DELETE") {
            const o = payload.old as Partial<Row>;
            if (o.collection && o.id) next.delete(key(o.collection, o.id));
          } else {
            const n = payload.new as Row;
            next.set(key(n.collection, n.id), n);
          }
          return next;
        });
      })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  const col = useCallback(<T extends Doc>(name: string): T[] => {
    const out: T[] = [];
    rows.forEach(r => { if (r.collection === name) out.push({ id: r.id, ...r.data } as T); });
    return out;
  }, [rows]);

  const get = useCallback(<T,>(name: string, id: string): T | null => {
    const r = rows.get(key(name, id));
    return r ? (r.data as T) : null;
  }, [rows]);

  const upsertLocal = (collection: string, id: string, data: Record<string, any>) =>
    setRows(prev => new Map(prev).set(key(collection, id), { collection, id, data, updated_at: new Date().toISOString() }));

  const patch = useCallback(async (collection: string, id: string, data: Record<string, any>) => {
    const cur = rows.get(key(collection, id))?.data || {};
    upsertLocal(collection, id, { ...cur, ...data }); // respuesta inmediata en pantalla
    // hq_patch fusiona en el servidor (data || patch), sin pisar otros campos.
    const { error } = await supabase.rpc("hq_patch", { p_collection: collection, p_id: id, p_patch: data });
    if (error) setError(`No se guardó: ${error.message}`);
  }, [rows]);

  const add = useCallback(async (collection: string, data: Record<string, any>) => {
    const id = crypto.randomUUID().slice(0, 8);
    upsertLocal(collection, id, data);
    const { error } = await supabase.from("hq_docs").insert({ collection, id, data });
    if (error) setError(`No se guardó: ${error.message}`);
  }, []);

  const remove = useCallback(async (collection: string, id: string) => {
    setRows(prev => { const n = new Map(prev); n.delete(key(collection, id)); return n; });
    const { error } = await supabase.from("hq_docs").delete().match({ collection, id });
    if (error) setError(`No se borró: ${error.message}`);
  }, []);

  const value = useMemo(() => ({ ready, error, col, get, patch, add, remove }), [ready, error, col, get, patch, add, remove]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore fuera de StoreProvider");
  return s;
}
