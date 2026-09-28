import { useEffect, useState } from "react";
import { num } from "../lib/fmt";

// Campo numérico que guarda al salir del campo (o con Enter), no en cada tecla.
// Si otro dispositivo cambia el valor, se actualiza solo mientras no lo estés editando.
export function NumInput({ value, onSave, label, width = "w-20" }: {
  value: number | null | undefined; onSave: (v: number | null) => void; label: string; width?: string;
}) {
  const [txt, setTxt] = useState(value == null ? "" : String(value));
  const [focus, setFocus] = useState(false);
  useEffect(() => { if (!focus) setTxt(value == null ? "" : String(value)); }, [value, focus]);
  const commit = () => { const v = num(txt); if (v !== (value ?? null)) onSave(v); };
  return (
    <input
      className={`inp ${width} text-right font-mono`}
      inputMode="decimal"
      aria-label={label}
      value={txt}
      onFocus={() => setFocus(true)}
      onChange={e => setTxt(e.target.value)}
      onBlur={() => { setFocus(false); commit(); }}
      onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    />
  );
}
