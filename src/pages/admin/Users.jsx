import { useEffect, useState } from 'react'
import { supabase, createIsolatedClient } from '../../lib/supabase'
import { useAuth } from '../../lib/auth.jsx'

export default function Users() {
  const { session } = useAuth()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setUsers(data || [])
  }
  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault(); setBusy(true); setMsg(null)
    const tmp = createIsolatedClient()
    const { data, error } = await tmp.auth.signUp({
      email: form.email.trim(), password: form.password, options: { data: { full_name: form.full_name.trim() } },
    })
    if (error) { setBusy(false); setMsg({ t: 'err', m: error.message }); return }
    // El perfil se crea solo (como empleado). Si se eligió administrador, se actualiza aquí.
    if (data.user) {
      await supabase.from('profiles').update({ role: form.role, full_name: form.full_name.trim() }).eq('id', data.user.id)
    }
    setBusy(false)
    setForm(null)
    setMsg({ t: 'ok', m: 'Usuario creado. Ya puede ingresar con su correo y contraseña.' })
    load()
  }

  async function update(u, patch) {
    await supabase.from('profiles').update(patch).eq('id', u.id)
    load()
  }

  return (
    <div className="panel">
      <div className="row-head">
        <h2 style={{ margin: 0 }}>Usuarios del equipo</h2>
        <button className="btn primary small" onClick={() => setForm({ full_name: '', email: '', password: '', role: 'employee' })}>+ Crear usuario</button>
      </div>
      {msg && <div className={'msg ' + msg.t}>{msg.m}</div>}
      <div className="table-wrap"><table>
        <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {users.map((u) => {
            const me = u.id === session?.user?.id
            return (
              <tr key={u.id}>
                <td><strong>{u.full_name || '—'}</strong></td>
                <td>{u.email}</td>
                <td>
                  <select className="chip" value={u.role} disabled={me} onChange={(e) => update(u, { role: e.target.value })}>
                    <option value="admin">Administrador</option>
                    <option value="employee">Empleado</option>
                  </select>
                </td>
                <td><span className={'badge' + (u.active ? '' : ' off')}>{u.active ? 'Activo' : 'Desactivado'}</span></td>
                <td>{!me && <button className="btn secondary small" onClick={() => update(u, { active: !u.active })}>{u.active ? 'Desactivar' : 'Activar'}</button>}</td>
              </tr>
            )
          })}
        </tbody>
      </table></div>
      <p className="sub">Empleado: puede ver pedidos y manejar productos. Administrador: además maneja categorías, usuarios y ajustes.</p>

      {form && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setForm(null)}>
          <form className="modal" onSubmit={create}>
            <div className="modal-head"><h3>Crear usuario</h3><button type="button" className="close" onClick={() => setForm(null)}>✕</button></div>
            <label className="field"><span>Nombre</span><input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
            <label className="field"><span>Correo</span><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="field"><span>Contraseña (mínimo 6 caracteres)</span><input type="text" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            <label className="field"><span>Rol</span>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="employee">Empleado</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            {msg?.t === 'err' && <div className="msg err">{msg.m}</div>}
            <button className="btn primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Creando…' : 'Crear usuario'}</button>
          </form>
        </div>
      )}
    </div>
  )
}
