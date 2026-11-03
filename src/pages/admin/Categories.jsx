import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Categories() {
  const [cats, setCats] = useState([])
  const [form, setForm] = useState(null)
  const [err, setErr] = useState('')

  async function load() {
    const { data } = await supabase.from('categories').select('*').order('sort_order').order('name')
    setCats(data || [])
  }
  useEffect(() => { load() }, [])

  async function save(e) {
    e.preventDefault(); setErr('')
    const row = { name: form.name.trim(), icon: form.icon || '✚', description: form.description || null, sort_order: Number(form.sort_order || 0) }
    const { error } = form.id
      ? await supabase.from('categories').update(row).eq('id', form.id)
      : await supabase.from('categories').insert(row)
    if (error) setErr(error.message)
    else { setForm(null); load() }
  }
  async function remove(c) {
    if (!confirm(`¿Eliminar la categoría "${c.name}"? Sus productos quedarán sin categoría.`)) return
    await supabase.from('categories').delete().eq('id', c.id)
    load()
  }

  return (
    <div className="panel">
      <div className="row-head">
        <h2 style={{ margin: 0 }}>Categorías</h2>
        <button className="btn primary small" onClick={() => setForm({ name: '', icon: '', description: '', sort_order: cats.length + 1 })}>+ Nueva categoría</button>
      </div>
      <div className="table-wrap"><table>
        <thead><tr><th>Icono</th><th>Nombre</th><th>Descripción</th><th>Orden</th><th></th></tr></thead>
        <tbody>
          {cats.map((c) => (
            <tr key={c.id}>
              <td style={{ fontSize: 22 }}>{c.icon}</td><td><strong>{c.name}</strong></td><td>{c.description}</td><td>{c.sort_order}</td>
              <td><div className="actions-cell">
                <button className="btn secondary small" onClick={() => setForm(c)}>Editar</button>
                <button className="btn danger small" onClick={() => remove(c)}>Eliminar</button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {form && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setForm(null)}>
          <form className="modal" onSubmit={save}>
            <div className="modal-head"><h3>{form.id ? 'Editar categoría' : 'Nueva categoría'}</h3><button type="button" className="close" onClick={() => setForm(null)}>✕</button></div>
            <label className="field"><span>Nombre</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field"><span>Icono (un emoji)</span><input value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🩺" /></label>
            <label className="field"><span>Descripción corta</span><input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label className="field"><span>Orden</span><input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></label>
            {err && <div className="msg err">{err}</div>}
            <button className="btn primary" style={{ width: '100%' }}>Guardar</button>
          </form>
        </div>
      )}
    </div>
  )
}
