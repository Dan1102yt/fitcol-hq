import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "./lib/supabase";
import { StoreProvider, useStore } from "./lib/store";
import { Login } from "./components/Login";
import { START, currentPhase, days, pd, retoWeek, today } from "./lib/fmt";
import Resumen from "./views/Resumen";
import Reto from "./views/Reto";
import ContenidoView from "./views/Contenido";
import Kpis from "./views/Kpis";
import Agentes from "./views/Agentes";
import Tareas from "./views/Tareas";
import Comparativo from "./views/Comparativo";
import Identidad from "./views/Identidad";

const TABS: [string, string][] = [
  ["resumen", "Resumen"], ["reto", "Reto 8 semanas"], ["contenido", "Contenido"], ["kpis", "KPIs"],
  ["agentes", "Agentes"], ["tareas", "Tareas"], ["comparativo", "Fitcol vs Fitia"], ["identidad", "Identidad"],
];

type Access = "checking" | "ok" | "denied";

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [access, setAccess] = useState<Access>("checking");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    setAccess("checking");
    supabase.from("hq_usuarios").select("rol").eq("user_id", session.user.id).maybeSingle()
      .then(({ data }) => setAccess(data ? "ok" : "denied"));
  }, [session]);

  if (session === undefined) return <div className="p-8 text-muted">Cargando…</div>;
  if (!session) return <Login />;
  if (access === "checking") return <div className="p-8 text-muted">Verificando acceso…</div>;
  if (access === "denied") return <Denied userId={session.user.id} email={session.user.email} />;
  return <StoreProvider><Shell /></StoreProvider>;
}

function Denied({ userId, email }: { userId: string; email?: string }) {
  return (
    <div className="min-h-[100dvh] grid place-items-center px-4">
      <div className="card max-w-md flex flex-col gap-3">
        <h1 className="h2">Sin acceso</h1>
        <p className="m-0 text-muted">La cuenta {email} no está autorizada en Fitcol HQ. Para darle acceso, ejecuta en el SQL Editor de Supabase:</p>
        <pre className="bg-surface2 p-3 rounded-md text-xs whitespace-pre-wrap break-all font-mono m-0">{`insert into hq_usuarios (user_id, rol) values ('${userId}', 'admin');`}</pre>
        <button className="btn-ghost self-start" onClick={() => supabase.auth.signOut()}>Salir</button>
      </div>
    </div>
  );
}

function Shell() {
  const { ready, error } = useStore();
  const loc = useLocation();
  const d = days(today(), pd(START));
  const w = retoWeek();
  const ph = currentPhase();
  return (
    <div className="max-w-[1120px] mx-auto px-4 pt-5 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b-2 border-ink">
        <div>
          <h1 className="font-display uppercase text-[clamp(28px,5vw,40px)] leading-none m-0">Fitcol <span className="text-gold">HQ</span></h1>
          <p className="text-muted text-[13px] mt-1.5 mb-0">Cifras, no promesas · Panel de mando de la empresa</p>
        </div>
        <div className="text-right">
          {d > 0 ? (
            <>
              <div className="text-xs text-muted uppercase tracking-wider">Arranque del reto</div>
              <div className="font-mono font-bold text-3xl leading-none text-gold">{d} días</div>
              <div className="text-xs text-muted uppercase tracking-wider">lunes 12 oct 2026</div>
            </>
          ) : (
            <>
              <div className="text-xs text-muted uppercase tracking-wider">Reto en curso</div>
              <div className="font-mono font-bold text-3xl leading-none text-gold">Semana {w} / 8</div>
              <div className="text-xs text-muted uppercase tracking-wider">{ph.k} · {ph.n}</div>
            </>
          )}
        </div>
      </header>
      <nav className="flex gap-1 overflow-x-auto my-4 pb-0.5" aria-label="Secciones">
        {TABS.map(([k, l]) => (
          <NavLink key={k} to={`/${k}`}
            className={({ isActive }) => `font-semibold text-[13px] rounded-md px-3 py-2 whitespace-nowrap border ${isActive ? "text-ink bg-surface border-line shadow-[inset_0_-2px_0_var(--gold)]" : "text-muted border-transparent"}`}>
            {l}
          </NavLink>
        ))}
        <button className="ml-auto text-[13px] text-muted px-3 whitespace-nowrap" onClick={() => supabase.auth.signOut()}>Salir</button>
      </nav>
      {error && <div className="mb-4 bg-goldsoft border border-gold rounded-lg px-3.5 py-2.5 text-[13px]">{error}</div>}
      {!ready ? <div className="text-muted p-6">Cargando datos…</div> : (
        <AnimatePresence mode="wait">
          <motion.main key={loc.pathname} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0.4 }} transition={{ duration: 0.15 }}>
            <Routes location={loc}>
              <Route path="/resumen" element={<Resumen />} />
              <Route path="/reto" element={<Reto />} />
              <Route path="/contenido" element={<ContenidoView />} />
              <Route path="/kpis" element={<Kpis />} />
              <Route path="/agentes" element={<Agentes />} />
              <Route path="/tareas" element={<Tareas />} />
              <Route path="/comparativo" element={<Comparativo />} />
              <Route path="/identidad" element={<Identidad />} />
              <Route path="*" element={<Navigate to="/resumen" replace />} />
            </Routes>
          </motion.main>
        </AnimatePresence>
      )}
    </div>
  );
}
