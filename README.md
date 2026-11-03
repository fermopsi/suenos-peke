# SUEÑOSPEKE · Tienda online (React + Vite + Supabase)

Tienda pública + panel de administración (pedidos, productos, categorías, usuarios y ajustes).
Funciona en computadora y en celular. Lista para publicar en Vercel.

## Pasos (sin conocimientos técnicos)

### A) En Supabase
1. Entra a https://supabase.com → **New project** (anota la contraseña de la base de datos).
2. Menú **SQL Editor → New query**. Abre el archivo `supabase/01_schema.sql`, copia todo, pégalo y pulsa **Run**.
   (Esto crea tablas, seguridad, el bucket de imágenes `productos` y datos de ejemplo. No necesitas crear el bucket a mano.)
3. Menú **Authentication → Users → Add user → Create new user**. Escribe TU correo y contraseña de administrador y marca **Auto Confirm User**.
4. Menú **Authentication → Providers → Email** → desactiva **Confirm email** (así los usuarios que crees desde el panel pueden ingresar de inmediato).
5. **SQL Editor → New query**. Abre `supabase/02_admin.sql`, cambia `TU_CORREO_ADMIN@ejemplo.com` por tu correo, pega y pulsa **Run**.
6. Menú **Project Settings → API** (o **API Keys**). Copia:
   - **Project URL**
   - **anon / publishable key** (la clave pública)

### B) En Vercel
1. Sube esta carpeta a un repositorio de GitHub (o importa el ZIP con la CLI de Vercel) y en Vercel pulsa **Add New → Project → Import**.
2. En **Environment Variables** agrega exactamente estas dos:
   - `VITE_SUPABASE_URL` = tu Project URL
   - `VITE_SUPABASE_ANON_KEY` = tu clave pública
   (Vercel permite pegar un archivo `.env` completo; puedes usar `.env.example` como modelo.)
3. Pulsa **Deploy**. Framework: Vite (se detecta solo).

### C) Primer uso
- Entra a `tu-sitio.vercel.app/login` con tu correo y contraseña.
- En **Ajustes** escribe el WhatsApp de la tienda (ej. `59171234567`).
- En **Productos** reemplaza los ejemplos por los reales (con foto).
- En **Usuarios → Crear usuario** agrega empleados sin volver a Supabase.

## Roles
- **Administrador**: todo.
- **Empleado**: ver/gestionar pedidos y productos.

## Probar en tu PC (opcional)
```
cp .env.example .env   # y completa las dos variables
npm install
npm run dev
```
