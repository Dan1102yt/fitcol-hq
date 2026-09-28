# Fitcol HQ

Panel de mando de Fitcol: reto de 8 semanas, contenido, KPIs, agentes, tareas por fase, comparativo Fitcol vs Fitia e identidad de marca. Los cambios se guardan en Supabase y aparecen al instante en todos los dispositivos abiertos.

- **Stack:** React 18 + Vite + TypeScript + Tailwind + Framer Motion, HashRouter.
- **Datos:** mismo proyecto Supabase de la app Fitcol, tablas `hq_docs` y `hq_usuarios` (ver `supabase/schema.sql`). La anon key es pública; el acceso lo controla RLS: solo quien esté en `hq_usuarios` entra (admin edita, miembro solo lee).
- **Deploy:** GitHub Actions → GitHub Pages en cada push a `main`.

## Puesta en marcha (una sola vez)

1. **Supabase → SQL Editor:** pegar y correr `supabase/schema.sql`.
2. **Supabase → Authentication → URL Configuration → Redirect URLs:** agregar `https://dan1102yt.github.io/fitcol-hq/` (necesario para entrar con Google).
3. **GitHub:** crear el repo `fitcol-hq` (vacío) y en *Settings → Pages → Source* elegir **GitHub Actions**.
4. **Subir el código** (PowerShell, en esta carpeta). La primera línea mueve el flujo de despliegue a su sitio (`ci/deploy.yml` → `.github/workflows/deploy.yml`):
   ```
   mkdir .github\workflows -Force; Move-Item ci\deploy.yml .github\workflows\deploy.yml
   git init -b main
   git add .
   git commit -m "Fitcol HQ: panel de mando"
   git remote add origin https://github.com/Dan1102yt/fitcol-hq.git
   git push -u origin main
   ```
5. Abrir `https://dan1102yt.github.io/fitcol-hq/` y entrar con la cuenta de Fitcol.

## Desarrollo local

```
npm install
npm run dev
```

## Dar acceso a otra persona

Que entre una vez (verá "Sin acceso" con su id) y ejecutar en el SQL Editor:

```sql
insert into hq_usuarios (user_id, rol) values ('<su id>', 'miembro'); -- o 'admin'
```
