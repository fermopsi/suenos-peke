-- =====================================================================
-- SUEÑOSPEKE · SCRIPT 2: deja como ADMINISTRADOR al usuario que creaste
-- en Supabase > Authentication > Users > Add user.
--
-- 1) Cambia el correo de abajo (entre comillas) por el correo EXACTO del usuario.
-- 2) Pega y ejecuta (Run). Debe decir "Success" y mostrar 1 fila.
-- =====================================================================

insert into public.profiles (id, email, full_name, role, active)
select id, email, coalesce(raw_user_meta_data->>'full_name', 'Administrador'), 'admin', true
from auth.users
where email = 'TU_CORREO_ADMIN@ejemplo.com'
on conflict (id) do update set role = 'admin', active = true;

-- Verificación: debe aparecer tu correo con rol admin
select email, role, active from public.profiles where role = 'admin';
