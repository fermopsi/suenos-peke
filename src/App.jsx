import { Routes, Route, Navigate } from 'react-router-dom'
import { configured } from './lib/supabase'
import Store from './pages/Store.jsx'
import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'

function NotConfigured() {
  return (
    <div className="center-page">
      <div className="card">
        <h1>Falta conectar Supabase</h1>
        <p className="sub">
          La tienda todavía no tiene las dos variables de conexión. En Vercel entra a
          <b> Settings → Environment Variables</b> y agrega:
        </p>
        <p className="sub"><b>VITE_SUPABASE_URL</b><br /><b>VITE_SUPABASE_ANON_KEY</b></p>
        <p className="sub">Luego haz un nuevo deploy (Redeploy).</p>
      </div>
    </div>
  )
}

export default function App() {
  if (!configured) return <NotConfigured />
  return (
    <Routes>
      <Route path="/" element={<Store />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
