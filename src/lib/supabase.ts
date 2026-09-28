import { createClient } from "@supabase/supabase-js";

// Mismo proyecto Supabase de la app Fitcol. La anon key es pública por diseño:
// la seguridad real vive en las políticas RLS de supabase/schema.sql
// (solo usuarios registrados en hq_usuarios leen o escriben).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://vooelhxkmidmbqsehmax.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvb2VsaHhrbWlkbWJxc2VobWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NDgyMTEsImV4cCI6MjA5NDAyNDIxMX0.iYbvqGt_Ww3sLM_lMMrAS9dyYAPAeTSHutJUtRRGni8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
