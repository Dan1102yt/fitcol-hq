-- =====================================================
-- Fitcol HQ — esquema en Supabase (mismo proyecto de la app Fitcol)
-- Ejecutar UNA vez en: Supabase → SQL Editor → New query → Run.
-- Es idempotente: se puede volver a correr sin duplicar nada.
-- =====================================================

-- 1) Quién puede entrar al panel: admin (lee y edita) o miembro (solo lee)
create table if not exists public.hq_usuarios (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  rol        text not null default 'miembro' check (rol in ('admin', 'miembro')),
  created_at timestamptz not null default now()
);
alter table public.hq_usuarios enable row level security;
drop policy if exists "hq_usuarios_ver_propia" on public.hq_usuarios;
create policy "hq_usuarios_ver_propia" on public.hq_usuarios
  for select to authenticated using (user_id = auth.uid());

-- Rol del usuario actual (security definer para poder usarlo en otras políticas)
create or replace function public.hq_rol() returns text
  language sql stable security definer set search_path = public
as $$ select rol from public.hq_usuarios where user_id = auth.uid() $$;

-- 2) Todo el panel en una tabla de documentos JSON
create table if not exists public.hq_docs (
  collection text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (collection, id)
);
alter table public.hq_docs enable row level security;

drop policy if exists "hq_docs_leer" on public.hq_docs;
drop policy if exists "hq_docs_insertar" on public.hq_docs;
drop policy if exists "hq_docs_editar" on public.hq_docs;
drop policy if exists "hq_docs_borrar" on public.hq_docs;
create policy "hq_docs_leer" on public.hq_docs for select to authenticated using (public.hq_rol() is not null);
create policy "hq_docs_insertar" on public.hq_docs for insert to authenticated with check (public.hq_rol() = 'admin');
create policy "hq_docs_editar" on public.hq_docs for update to authenticated using (public.hq_rol() = 'admin') with check (public.hq_rol() = 'admin');
create policy "hq_docs_borrar" on public.hq_docs for delete to authenticated using (public.hq_rol() = 'admin');

-- Fusiona campos en un documento sin pisar los demás (lo usa el panel al editar).
-- security invoker: respeta las políticas de arriba.
create or replace function public.hq_patch(p_collection text, p_id text, p_patch jsonb) returns void
  language sql security invoker set search_path = public
as $$
  insert into public.hq_docs (collection, id, data) values (p_collection, p_id, p_patch)
  on conflict (collection, id) do update
    set data = public.hq_docs.data || excluded.data, updated_at = now(), updated_by = auth.uid();
$$;
grant execute on function public.hq_patch(text, text, jsonb) to authenticated;

-- 3) Tiempo real: los cambios llegan al instante a todos los dispositivos abiertos
do $$ begin
  alter publication supabase_realtime add table public.hq_docs;
exception when duplicate_object then null; end $$;

-- 4) Oscar como admin (por correo o por el id de su cuenta de Fitcol)
insert into public.hq_usuarios (user_id, rol)
select id, 'admin' from auth.users
where email = 'davidroa1102@gmail.com' or id = '936ab9eb-7b0c-4862-b4a2-06637ed09b9f'
on conflict (user_id) do update set rol = 'admin';

-- 5) Datos iniciales (copiados del panel de claude.ai el 27 sep 2026)
insert into public.hq_docs (collection, id, data) values
  ('agentes', 'com', $j${"area": "Crecer", "entregables": ["Plantillas de respuesta", "FAQ", "Reporte de quejas y pedidos"], "estado": "Pendiente", "fase": "Fase 2 · nov", "mision": "Responde comentarios, DMs y correos con tono de marca.", "nombre": "Comunidad y Soporte", "orden": 5, "prompt": "Actúa como el agente de Comunidad y Soporte de Fitcol. Aquí van los comentarios, DMs o correos de la semana: [ ]. Redacta respuestas en tono de marca (cercano, con cifras, sin prometer), agrupa las preguntas repetidas para la FAQ y lista pedidos de funciones."}$j$::jsonb),
  ('agentes', 'dat', $j${"area": "Operar", "entregables": ["Reporte del lunes", "Alertas si un KPI cae", "Comparativo Fitcol vs Fitia"], "estado": "Activo", "fase": "Fase 1 · oct", "mision": "Mide todo, actualiza el dashboard y el comparativo con Fitia.", "nombre": "Datos y KPIs", "orden": 3, "prompt": "Actúa como el agente de Datos de Fitcol. Lee el panel Fitcol HQ (KPIs, reto, contenido) y las cifras que te paso: [capturas / números]. Carga los datos en el panel y entrega el reporte del lunes: 3 cifras que subieron, 3 que bajaron, 1 decisión recomendada, en menos de 150 palabras."}$j$::jsonb),
  ('agentes', 'dis', $j${"area": "Crecer", "entregables": ["Banners de la app", "Carruseles de calorías y técnica", "Tarjeta de datos semanal", "Plantillas Canva"], "estado": "Activo", "fase": "Fase 1 · oct", "mision": "Cuida el manual de marca y produce las piezas.", "nombre": "Diseño y Marca", "orden": 1, "prompt": "Actúa como el agente de Diseño y Marca de Fitcol. Paleta: Negro cóndor #111111, Oro andino #F2B705, Rojo bandera #CE1126 (máx 10 %), Azul cielo #3FA9F5, Hueso #F5F1E8. Tipos: Archivo Black (títulos), Inter (texto), JetBrains Mono (cifras con unidad).\n\nDiseña [pieza: banner / carrusel de N láminas / tarjeta de datos] en formato [1080×1350 o 1080×1920] sobre [tema]. Entrega el texto de cada lámina, la jerarquía y la composición; si Canva está conectado, créalo allí."}$j$::jsonb),
  ('agentes', 'fin', $j${"area": "Operar", "entregables": ["Cierre mensual", "Costo por usuario activo", "Punto de equilibrio"], "estado": "Pendiente", "fase": "Fase 3 · dic", "mision": "Costos de API y hosting, ingresos Pro, flujo de caja.", "nombre": "Finanzas", "orden": 8, "prompt": "Actúa como el agente de Finanzas de Fitcol. Costos del mes: [API, hosting, dominio, pauta]. Ingresos: [suscripciones Pro]. Usuarios activos: [ ]. Entrega el cierre del mes en COP, el costo por usuario activo y cuántos Pro faltan para el punto de equilibrio."}$j$::jsonb),
  ('agentes', 'gro', $j${"area": "Crecer", "entregables": ["Experimentos de conversión", "Lista de aliados", "Plan de pauta"], "estado": "Pendiente", "fase": "Fase 3 · dic", "mision": "Embudo freemium, precios, alianzas con gimnasios y creadores.", "nombre": "Crecimiento", "orden": 7, "prompt": "Actúa como el agente de Crecimiento de Fitcol (modelo freemium: 3 análisis de foto gratis al día; Pro con análisis ilimitado). Con estos datos del embudo: [ ], propone 2 experimentos para la próxima quincena con hipótesis, métrica y umbral de éxito."}$j$::jsonb),
  ('agentes', 'leg', $j${"area": "Operar", "entregables": ["Política y términos publicados", "Checklist de publicidad responsable"], "estado": "Pendiente", "fase": "Fase 2 · nov", "mision": "Política de datos personales, términos, avisos de salud, marca.", "nombre": "Legal y Cumplimiento", "orden": 6, "prompt": "Actúa como el agente de Legal y Cumplimiento de Fitcol (Colombia). Tarea: [redactar / revisar] [política de tratamiento de datos / términos / aviso de salud / pieza publicitaria]. Señala riesgos y qué debe validar un abogado; no reemplazas asesoría legal."}$j$::jsonb),
  ('agentes', 'mkt', $j${"area": "Crecer", "entregables": ["1 guion de video por semana", "3 posts y 5 historias", "Calendario mensual"], "estado": "Activo", "fase": "Fase 1 · oct", "mision": "Estrategia de redes, reto semanal y guiones plano a plano.", "nombre": "Marketing y Contenido", "orden": 0, "prompt": "Actúa como el agente de Marketing y Contenido de Fitcol (app colombiana de nutrición con IA; lema: Cifras, no promesas). Respeta el manual de marca: tuteo colombiano, cada afirmación con número y periodo, sin promesas de resultados.\n\nEntrega el guion del video de la semana [N] del reto (+3 a 4 kg en 8 semanas) en una tabla: toma · tiempo · plano · qué se ve · qué digo (texto exacto para leer). Duración 45–60 s vertical. Incluye además 3 copies para posts y 5 ideas de historias.\n\nDatos de la semana: peso [ ] kg, cambio [ ], kcal promedio [ ], proteína [ ] g, lo que pasó: [ ]. Tema: [ ]."}$j$::jsonb),
  ('agentes', 'nut', $j${"area": "Construir", "entregables": ["Revisión de piezas técnicas", "+20 platos por mes", "Fórmulas de calorías"], "estado": "Pendiente", "fase": "Fase 2 · nov", "mision": "Rigor técnico del contenido y de la base de platos colombianos.", "nombre": "Nutrición y Entreno", "orden": 4, "prompt": "Actúa como el agente de Nutrición y Entreno de Fitcol. Revisa esta pieza o dato: [ ]. Verifica que las cifras (kcal, proteína, ritmos de ganancia) tengan respaldo, señala lo que exagera y propone la versión corregida. No das diagnósticos médicos; si el tema lo requiere, recomienda consultar a un profesional."}$j$::jsonb),
  ('agentes', 'prod', $j${"area": "Construir", "entregables": ["Changelog semanal", "1 mejora visible por quincena", "Límite freemium y plan Pro"], "estado": "Activo", "fase": "Fase 1 · oct", "mision": "Roadmap, código de fitcol.fit, bugs y versiones.", "nombre": "Producto y Desarrollo", "orden": 2, "prompt": "Actúa como el agente de Producto y Desarrollo de Fitcol (sitio estático en fitcol.fit, HTML/CSS/JS, Cloudflare Worker a la API de Anthropic, Supabase, Open Food Facts, PWA). Recuerda subir la versión de caché del service worker en cada despliegue.\n\nTarea: [bug / mejora]. Entrega el plan, el código y el changelog en una línea para usuarios."}$j$::jsonb),
  ('comparativo', 'd2026-09-22', $j${"comida": "Desayuno: arepa rellena + jugo de naranja", "fecha": "2026-09-22", "fitcol_kcal": 520, "fitcol_prot": 18, "fitcol_seg": null, "fitia_kcal": 488, "fitia_prot": 19, "fitia_seg": null}$j$::jsonb),
  ('comparativo', 'd2026-09-23', $j${"comida": "Desayuno: arepa con huevo perico + jugo", "fecha": "2026-09-23", "fitcol_kcal": 520, "fitcol_prot": 18, "fitcol_seg": null, "fitia_kcal": 468, "fitia_prot": 14, "fitia_seg": null}$j$::jsonb),
  ('comparativo', 'd2026-09-24', $j${"comida": "Desayuno: arepa rellena de perico con salchicha + jugo", "fecha": "2026-09-24", "fitcol_kcal": 620, "fitcol_prot": 18, "fitcol_seg": null, "fitia_kcal": 544, "fitia_prot": 22, "fitia_seg": null}$j$::jsonb),
  ('comparativo', 'd2026-09-25', $j${"comida": "Desayuno: arepa rellena + jugo de naranja", "fecha": "2026-09-25", "fitcol_kcal": 520, "fitcol_prot": 14, "fitcol_seg": null, "fitia_kcal": 539, "fitia_prot": 22, "fitia_seg": null}$j$::jsonb),
  ('comparativo', 'd2026-09-26', $j${"comida": "Desayuno: huevos revueltos con salchicha (Fitcol no se pudo guardar)", "fecha": "2026-09-26", "fitcol_kcal": 715, "fitcol_prot": 52, "fitcol_seg": null, "fitia_kcal": 921, "fitia_prot": 68, "fitia_seg": null}$j$::jsonb),
  ('config', 'empresa', $j${"bio": "App colombiana de nutrición con IA. Registra tu comida real y mide tu progreso. Cifras, no promesas. ↓ Reto 8 semanas", "canales": [{"canal": "Instagram", "creado": false, "uso": "Reels, carruseles, historias", "usuario": "@fitcol.app"}, {"canal": "TikTok", "creado": false, "uso": "Video del reto y cortes", "usuario": "@fitcol.app"}, {"canal": "YouTube", "creado": false, "uso": "Shorts y resumen final", "usuario": "@fitcol"}, {"canal": "WhatsApp Business", "creado": false, "uso": "Soporte, fase 2", "usuario": "Línea dedicada"}, {"canal": "Threads / X", "creado": false, "uso": "Opcional, fase 3", "usuario": "@fitcol.app"}], "colores": [{"hex": "#111111", "nombre": "Negro cóndor"}, {"hex": "#F2B705", "nombre": "Oro andino"}, {"hex": "#CE1126", "nombre": "Rojo bandera"}, {"hex": "#3FA9F5", "nombre": "Azul cielo"}, {"hex": "#F5F1E8", "nombre": "Hueso"}], "correos": [{"correo": "hola@fitcol.fit", "creado": false, "uso": "Contacto, alianzas, prensa"}, {"correo": "soporte@fitcol.fit", "creado": false, "uso": "Usuarios de la app"}, {"correo": "oscar@fitcol.fit", "creado": false, "uso": "Fundador"}, {"correo": "privacidad@fitcol.fit", "creado": false, "uso": "Datos personales"}, {"correo": "cuentas@fitcol.fit", "creado": false, "uso": "Registros de servicios (no se publica)"}], "dominio": "fitcol.fit", "mision": "Ayudar a cada colombiano a cumplir su meta física con comida real, datos medibles y seguimiento honesto, semana a semana.", "tagline": "Cifras, no promesas"}$j$::jsonb),
  ('contenido', 'p0', $j${"canal": "@fitcol.app · IG", "estado": "Idea", "fecha": "2026-10-15", "guardados": null, "tipo": "Pieza de apoyo", "titulo": "Banner: Descarga Fitcol", "vistas": null}$j$::jsonb),
  ('contenido', 'p1', $j${"canal": "@fitcol.app · IG", "estado": "Idea", "fecha": "2026-10-22", "guardados": null, "tipo": "Pieza de apoyo", "titulo": "Carrusel: calcula tu gasto diario", "vistas": null}$j$::jsonb),
  ('contenido', 'p2', $j${"canal": "@fitcol.app · IG", "estado": "Idea", "fecha": "2026-10-29", "guardados": null, "tipo": "Pieza de apoyo", "titulo": "Carrusel: 10 platos con +30 g de proteína", "vistas": null}$j$::jsonb),
  ('contenido', 'p3', $j${"canal": "@fitcol.app · IG", "estado": "Idea", "fecha": "2026-11-05", "guardados": null, "tipo": "Pieza de apoyo", "titulo": "Carrusel: técnica de sentadilla", "vistas": null}$j$::jsonb),
  ('contenido', 'p4', $j${"canal": "@fitcol.app · IG", "estado": "Idea", "fecha": "2026-11-12", "guardados": null, "tipo": "Pieza de apoyo", "titulo": "Banner comparativo Fitcol vs Fitia", "vistas": null}$j$::jsonb),
  ('contenido', 'p5', $j${"canal": "@fitcol.app · IG", "estado": "Idea", "fecha": "2026-11-19", "guardados": null, "tipo": "Pieza de apoyo", "titulo": "Carrusel: checklist de descanso", "vistas": null}$j$::jsonb),
  ('contenido', 'p6', $j${"canal": "@fitcol.app · IG", "estado": "Idea", "fecha": "2026-11-26", "guardados": null, "tipo": "Pieza de apoyo", "titulo": "Carrusel: calorías del corrientazo", "vistas": null}$j$::jsonb),
  ('contenido', 'p7', $j${"canal": "@fitcol.app · IG", "estado": "Idea", "fecha": "2026-12-03", "guardados": null, "tipo": "Pieza de apoyo", "titulo": "Banner de función de la app", "vistas": null}$j$::jsonb),
  ('contenido', 'p8', $j${"canal": "@fitcol.app · IG", "estado": "Idea", "fecha": "2026-12-10", "guardados": null, "tipo": "Pieza de apoyo", "titulo": "Banner: únete al reto de enero", "vistas": null}$j$::jsonb),
  ('contenido', 'v0', $j${"canal": "Personal + @fitcol.app · IG, TikTok", "estado": "Guion listo", "fecha": "2026-10-12", "guardados": null, "tipo": "Video del reto", "titulo": "S0 · El reto: punto de partida con cifras", "vistas": null}$j$::jsonb),
  ('contenido', 'v1', $j${"canal": "Personal + @fitcol.app · IG, TikTok", "estado": "Idea", "fecha": "2026-10-19", "guardados": null, "tipo": "Video del reto", "titulo": "S1 · Cómo calculé mis calorías", "vistas": null}$j$::jsonb),
  ('contenido', 'v2', $j${"canal": "Personal + @fitcol.app · IG, TikTok", "estado": "Idea", "fecha": "2026-10-26", "guardados": null, "tipo": "Video del reto", "titulo": "S2 · Proteína con comida colombiana", "vistas": null}$j$::jsonb),
  ('contenido', 'v3', $j${"canal": "Personal + @fitcol.app · IG, TikTok", "estado": "Idea", "fecha": "2026-11-02", "guardados": null, "tipo": "Video del reto", "titulo": "S3 · Sobrecarga progresiva: cómo subo pesos", "vistas": null}$j$::jsonb),
  ('contenido', 'v4', $j${"canal": "Personal + @fitcol.app · IG, TikTok", "estado": "Idea", "fecha": "2026-11-09", "guardados": null, "tipo": "Video del reto", "titulo": "S4 · Mitad del reto: bioimpedancia + Fitcol vs Fitia", "vistas": null}$j$::jsonb),
  ('contenido', 'v5', $j${"canal": "Personal + @fitcol.app · IG, TikTok", "estado": "Idea", "fecha": "2026-11-16", "guardados": null, "tipo": "Video del reto", "titulo": "S5 · Sueño y recuperación", "vistas": null}$j$::jsonb),
  ('contenido', 'v6', $j${"canal": "Personal + @fitcol.app · IG, TikTok", "estado": "Idea", "fecha": "2026-11-23", "guardados": null, "tipo": "Video del reto", "titulo": "S6 · Comer en la calle: el corrientazo", "vistas": null}$j$::jsonb),
  ('contenido', 'v7', $j${"canal": "Personal + @fitcol.app · IG, TikTok", "estado": "Idea", "fecha": "2026-11-30", "guardados": null, "tipo": "Video del reto", "titulo": "S7 · Estancamiento: qué ajusté", "vistas": null}$j$::jsonb),
  ('contenido', 'v8', $j${"canal": "Personal + @fitcol.app · IG, TikTok", "estado": "Idea", "fecha": "2026-12-07", "guardados": null, "tipo": "Video del reto", "titulo": "S8 · Resultado final con todas las cifras", "vistas": null}$j$::jsonb),
  ('kpis', 'k01', $j${"area": "Norte", "como": "Supabase: usuarios con registros en 3+ días", "dec": 0, "meta_dic": "50", "meta_mar": "300", "nombre": "Usuarios activos semanales", "north": true, "orden": 0, "values": []}$j$::jsonb),
  ('kpis', 'k02', $j${"area": "Producto", "como": "Supabase: tabla de usuarios", "dec": 0, "meta_dic": "150", "meta_mar": "1.000", "nombre": "Usuarios registrados", "north": false, "orden": 1, "values": []}$j$::jsonb),
  ('kpis', 'k03', $j${"area": "Producto", "como": "% que registra algo 7 días después", "dec": 0, "meta_dic": "25 %", "meta_mar": "30 %", "nombre": "Retención día 7", "north": false, "orden": 2, "values": []}$j$::jsonb),
  ('kpis', 'k04', $j${"area": "Producto", "como": "Igual, a 30 días", "dec": 0, "meta_dic": "10 %", "meta_mar": "15 %", "nombre": "Retención día 30", "north": false, "orden": 3, "values": []}$j$::jsonb),
  ('kpis', 'k05', $j${"area": "Producto", "como": "Registros / activos, por semana", "dec": 0, "meta_dic": "10", "meta_mar": "12", "nombre": "Comidas registradas por activo", "north": false, "orden": 4, "values": []}$j$::jsonb),
  ('kpis', 'k06', $j${"area": "Producto", "como": "Error vs referencia en 20 platos", "dec": 1, "meta_dic": "±15 %", "meta_mar": "±10 %", "nombre": "Precisión de la IA (error kcal %)", "north": false, "orden": 5, "values": []}$j$::jsonb),
  ('kpis', 'k07', $j${"area": "Marketing", "como": "Suma de cuentas oficiales", "dec": 0, "meta_dic": "1.000", "meta_mar": "5.000", "nombre": "Seguidores IG + TikTok", "north": false, "orden": 6, "values": []}$j$::jsonb),
  ('kpis', 'k08', $j${"area": "Marketing", "como": "Publicados el lunes / programados", "dec": 0, "meta_dic": "9 de 9", "meta_mar": "—", "nombre": "Videos del reto a tiempo", "north": false, "orden": 7, "values": []}$j$::jsonb),
  ('kpis', 'k09', $j${"area": "Marketing", "como": "Guardados / alcance", "dec": 1, "meta_dic": "2 %", "meta_mar": "3 %", "nombre": "Tasa de guardados (%)", "north": false, "orden": 8, "values": []}$j$::jsonb),
  ('kpis', 'k10', $j${"area": "Marketing", "como": "Clics del enlace de la bio", "dec": 0, "meta_dic": "300", "meta_mar": "2.000", "nombre": "Visitas a fitcol.fit desde redes", "north": false, "orden": 9, "values": []}$j$::jsonb),
  ('kpis', 'k11', $j${"area": "Negocio", "como": "Suscripciones activas", "dec": 0, "meta_dic": "5", "meta_mar": "30", "nombre": "Usuarios Fitcol Pro", "north": false, "orden": 10, "values": []}$j$::jsonb),
  ('kpis', 'k12', $j${"area": "Negocio", "como": "Pro / activos del mes", "dec": 1, "meta_dic": "3 %", "meta_mar": "5 %", "nombre": "Conversión gratis a Pro (%)", "north": false, "orden": 11, "values": []}$j$::jsonb),
  ('kpis', 'k13', $j${"area": "Negocio", "como": "Factura API / activos del mes", "dec": 0, "meta_dic": "Línea base oct", "meta_mar": "<30 % precio Pro", "nombre": "Costo IA por usuario activo (COP)", "north": false, "orden": 12, "values": []}$j$::jsonb),
  ('kpis', 'k14', $j${"area": "Operación", "como": "Horas por semana", "dec": 0, "meta_dic": "≤5", "meta_mar": "≤5", "nombre": "Horas de Oscar en Fitcol", "north": false, "orden": 13, "values": []}$j$::jsonb),
  ('reto', 's0', $j${"cintura": null, "grasa": null, "kcal": null, "medicion": "2026-10-10", "musculo": null, "peso": null, "proteina": null, "semana": 0, "video": "2026-10-12"}$j$::jsonb),
  ('reto', 's1', $j${"cintura": null, "grasa": null, "kcal": null, "medicion": "2026-10-17", "musculo": null, "peso": null, "proteina": null, "semana": 1, "video": "2026-10-19"}$j$::jsonb),
  ('reto', 's2', $j${"cintura": null, "grasa": null, "kcal": null, "medicion": "2026-10-24", "musculo": null, "peso": null, "proteina": null, "semana": 2, "video": "2026-10-26"}$j$::jsonb),
  ('reto', 's3', $j${"cintura": null, "grasa": null, "kcal": null, "medicion": "2026-10-31", "musculo": null, "peso": null, "proteina": null, "semana": 3, "video": "2026-11-02"}$j$::jsonb),
  ('reto', 's4', $j${"cintura": null, "grasa": null, "kcal": null, "medicion": "2026-11-07", "musculo": null, "peso": null, "proteina": null, "semana": 4, "video": "2026-11-09"}$j$::jsonb),
  ('reto', 's5', $j${"cintura": null, "grasa": null, "kcal": null, "medicion": "2026-11-14", "musculo": null, "peso": null, "proteina": null, "semana": 5, "video": "2026-11-16"}$j$::jsonb),
  ('reto', 's6', $j${"cintura": null, "grasa": null, "kcal": null, "medicion": "2026-11-21", "musculo": null, "peso": null, "proteina": null, "semana": 6, "video": "2026-11-23"}$j$::jsonb),
  ('reto', 's7', $j${"cintura": null, "grasa": null, "kcal": null, "medicion": "2026-11-28", "musculo": null, "peso": null, "proteina": null, "semana": 7, "video": "2026-11-30"}$j$::jsonb),
  ('reto', 's8', $j${"cintura": null, "grasa": null, "kcal": null, "medicion": "2026-12-05", "musculo": null, "peso": null, "proteina": null, "semana": 8, "video": "2026-12-07"}$j$::jsonb),
  ('tareas', 't01', $j${"fase": "F0", "fecha": "2026-09-29", "hecho": false, "responsable": "Oscar", "titulo": "Crear Instagram y TikTok (@fitcol.app o alternativa)"}$j$::jsonb),
  ('tareas', 't02', $j${"fase": "F0", "fecha": "2026-09-29", "hecho": false, "responsable": "Oscar", "titulo": "Crear canal de YouTube @fitcol"}$j$::jsonb),
  ('tareas', 't03', $j${"fase": "F0", "fecha": "2026-09-30", "hecho": false, "responsable": "Oscar", "titulo": "Configurar reenvío de correos @fitcol.fit en Cloudflare y 'Enviar como' en Gmail"}$j$::jsonb),
  ('tareas', 't04', $j${"fase": "F0", "fecha": "2026-10-01", "hecho": false, "responsable": "Oscar", "titulo": "Enviar capturas de Fitia y export de Fitcol para el comparativo"}$j$::jsonb),
  ('tareas', 't05', $j${"fase": "F0", "fecha": "2026-10-02", "hecho": false, "responsable": "Oscar", "titulo": "Revisar la marca Fitcol en la base de la SIC (clases 9 y 42)"}$j$::jsonb),
  ('tareas', 't06', $j${"fase": "F0", "fecha": "2026-10-05", "hecho": false, "responsable": "Claude", "titulo": "Manual de marca completo y plantillas"}$j$::jsonb),
  ('tareas', 't07', $j${"fase": "F0", "fecha": "2026-10-07", "hecho": false, "responsable": "Claude", "titulo": "Política de datos y términos publicados en fitcol.fit"}$j$::jsonb),
  ('tareas', 't08', $j${"fase": "F0", "fecha": "2026-10-08", "hecho": false, "responsable": "Claude", "titulo": "Página fitcol.fit/reto"}$j$::jsonb),
  ('tareas', 't09', $j${"fase": "F0", "fecha": "2026-10-08", "hecho": false, "responsable": "Oscar", "titulo": "Bios y fotos de perfil en todas las cuentas"}$j$::jsonb),
  ('tareas', 't10', $j${"fase": "F0", "fecha": "2026-10-10", "hecho": false, "responsable": "Oscar", "titulo": "Medición semana 0: bioimpedancia, fotos, cintura"}$j$::jsonb),
  ('tareas', 't11', $j${"fase": "F0", "fecha": "2026-10-11", "hecho": false, "responsable": "Oscar", "titulo": "Grabar y editar el video 0"}$j$::jsonb),
  ('tareas', 't12', $j${"fase": "F1", "fecha": "2026-10-12", "hecho": false, "responsable": "Oscar", "titulo": "Publicar video 0 (lunes 7:00 p. m.)"}$j$::jsonb),
  ('tareas', 't13', $j${"fase": "F1", "fecha": "2026-10-25", "hecho": false, "responsable": "Claude", "titulo": "Límite gratuito de análisis IA en la app"}$j$::jsonb),
  ('tareas', 't14', $j${"fase": "F1", "fecha": "2026-11-06", "hecho": false, "responsable": "Oscar", "titulo": "Validar precio Pro con 10 usuarios"}$j$::jsonb),
  ('tareas', 't15', $j${"fase": "F2", "fecha": "2026-11-07", "hecho": false, "responsable": "Oscar", "titulo": "Medición de mitad (semana 4)"}$j$::jsonb),
  ('tareas', 't16', $j${"fase": "F2", "fecha": "2026-11-09", "hecho": false, "responsable": "Claude", "titulo": "Recalibrar metas de KPIs"}$j$::jsonb),
  ('tareas', 't17', $j${"fase": "F2", "fecha": "2026-11-23", "hecho": false, "responsable": "Claude", "titulo": "Lanzar Fitcol Pro"}$j$::jsonb),
  ('tareas', 't18', $j${"fase": "F2", "fecha": "2026-12-07", "hecho": false, "responsable": "Oscar", "titulo": "Medición final y video 8"}$j$::jsonb),
  ('tareas', 't19', $j${"fase": "F3", "fecha": "2027-01-11", "hecho": false, "responsable": "Oscar", "titulo": "Lanzar reto comunitario de enero"}$j$::jsonb),
  ('tareas', 't20', $j${"fase": "F3", "fecha": "2027-01-31", "hecho": false, "responsable": "Oscar", "titulo": "Cerrar 3 alianzas con gimnasios o creadores"}$j$::jsonb),
  ('tareas', 't21', $j${"fase": "F0", "fecha": "2026-10-03", "hecho": false, "responsable": "Oscar", "titulo": "Cronometrar 4 comidas en Fitcol y en Fitia (segundos por registro)"}$j$::jsonb)
on conflict (collection, id) do nothing;
