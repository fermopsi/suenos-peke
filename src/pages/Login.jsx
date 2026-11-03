import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

export default function Login() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await signIn(email.trim(), password)
    setBusy(false)
    if (error) setErr('Correo o contraseña incorrectos.')
    else nav('/admin')
  }

  return (
    <div className="center-page">
      <form className="card" onSubmit={submit}>
        <Link to="/" className="brand">
          <span className="mark">S</span>
          <span><strong>SUEÑOSPEKE</strong><small>PANEL DE ADMINISTRACIÓN</small></span>
        </Link>
        <h1>Ingresar</h1>
        <p className="sub">Acceso solo para el equipo de la tienda.</p>
        <label className="field"><span>Correo</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </label>
        <label className="field"><span>Contraseña</span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {err && <div className="msg err">{err}</div>}
        <button className="btn primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
        <p style={{ textAlign: 'center', marginTop: 16 }}><Link className="textlink" to="/">← Volver a la tienda</Link></p>
      </form>
    </div>
  )
}
