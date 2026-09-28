import { useState } from "react";
import { supabase } from "../lib/supabase";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const google = async () => {
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) setMsg(error.message);
  };
  const withPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMsg("Correo o contraseña incorrectos. Usa la misma cuenta de fitcol.fit.");
  };

  return (
    <div className="min-h-[100dvh] grid place-items-center px-4">
      <div className="card w-full max-w-sm flex flex-col gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase leading-none m-0">Fitcol <span className="text-gold">HQ</span></h1>
          <p className="text-muted mt-2 mb-0">Panel de mando. Entra con tu cuenta de Fitcol.</p>
        </div>
        <button className="btn w-full" onClick={google}>Entrar con Google</button>
        <div className="text-center text-muted text-xs uppercase tracking-wider">o con correo</div>
        <form onSubmit={withPassword} className="flex flex-col gap-2">
          <label htmlFor="email" className="text-xs text-muted">Correo</label>
          <input id="email" type="email" className="inp py-2" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <label htmlFor="password" className="text-xs text-muted">Contraseña</label>
          <input id="password" type="password" className="inp py-2" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          <button className="btn-ghost mt-2" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
        </form>
        {msg && <p className="text-rojo text-sm m-0">{msg}</p>}
      </div>
    </div>
  );
}
