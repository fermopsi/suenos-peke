import { createClient } from '@supabase/supabase-js'

// Las dos variables se configuran en Vercel (Settings > Environment Variables)
// o en un archivo .env local. No se escriben dentro del código.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configured = Boolean(url && key)
export const supabase = configured ? createClient(url, key) : null

// Cliente aparte (sin guardar sesión) para crear usuarios desde el panel
// sin cerrar la sesión del administrador.
export function createIsolatedClient() {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
