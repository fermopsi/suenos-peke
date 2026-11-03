import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { money } from '../../lib/format'

const empty = { name: '', description: '', price: '', stock: 0, category_id: '', image_url: '', featured: false, active: true }

function ProductForm({ initial, cats, onClose, onSaved }) {
  const [f, setF] = useState({ ...empty, ...initial, category_id: initial?.category_id || '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setF((cur) => ({ ...cur, [k]: v }))

  async function upload(file) {
    if (!file) return
    setBusy(true); setErr('')
    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('productos').upload(path, file, { cacheControl: '3600' })
    if (error) { setErr('No se pudo subir la imagen: ' + error.message); setBusy(false); return }
    const { data } = supabase.storage.from('productos').getPublicUrl(path)
    set('image_url', data.publicUrl)
    setBusy(false)
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    const row = {
      name: f.name.trim(), description: f.description?.trim() || null, price: Number(f.price || 0), stock: Number(f.stock || 0),
      category_id: f.category_id || null, image_url: f.image_url || null, featured: f.featured, active: f.active,
    }
    const { error } = f.id
      ? await supabase.from('products').update(row).eq('id', f.id)
      : await supabase.from('products').insert(row)
    setBusy(false)
    if (error) setErr(error.message)
    else onSaved()
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal wide" onSubmit={save}>
        <div className="modal-head"><h3>{f.id ? 'Editar producto' : 'Nuevo producto'}</h3><button type="button" className="close" onClick={onClose}>✕</button></div>
        <label className="field"><span>Nombre</span><input required value={f.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label className="field"><span>Descripción</span><textarea rows={3} value={f.description || ''} onChange={(e) => set('description', e.target.value)} /></label>
        <div className="grid2">
          <label className="field"><span>Precio (Bs)</span><input type="number" min="0" step="0.01" required value={f.price} onChange={(e) => set('price', e.target.value)} /></label>
          <label className="field"><span>Stock</span><input type="number" min="0" value={f.stock} onChange={(e) => set('stock', e.target.value)} /></label>
        </div>
        <label className="field"><span>Categoría</span>
          <select value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>
            <option value="">Sin categoría</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="field"><span>Imagen</span>
          <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
        {f.image_url && <div className="thumb" style={{ width: 90, height: 90 }}><img src={f.image_url} alt="" /></div>}
        <label className="check"><input type="checkbox" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} /> Producto destacado</label>
        <label className="check"><input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /> Visible en la tienda</label>
        {err && <div className="msg err">{err}</div>}
        <button className="btn primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
      </form>
    </div>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  async function load() {
    setLoading(true)
    const [p, c] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order').order('name'),
    ])
    setProducts(p.data || []); setCats(c.data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function remove(p) {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return
    await supabase.from('products').delete().eq('id', p.id)
    load()
  }
  const catName = (id) => cats.find((c) => c.id === id)?.name || '—'

  return (
    <div className="panel">
      <div className="row-head">
        <h2 style={{ margin: 0 }}>Productos</h2>
        <button className="btn primary small" onClick={() => setEditing({})}>+ Nuevo producto</button>
      </div>
      {loading ? <div className="empty">Cargando…</div> : !products.length ? <div className="empty">Aún no hay productos.</div> : (
        <div className="table-wrap"><table>
          <thead><tr><th></th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><div className="thumb">{p.image_url ? <img src={p.image_url} alt="" /> : '🩺'}</div></td>
                <td><strong>{p.name}</strong></td>
                <td>{catName(p.category_id)}</td>
                <td>{money(p.price)}</td>
                <td>{p.stock}</td>
                <td><span className={'badge' + (p.active ? '' : ' off')}>{p.active ? 'Visible' : 'Oculto'}</span></td>
                <td><div className="actions-cell">
                  <button className="btn secondary small" onClick={() => setEditing(p)}>Editar</button>
                  <button className="btn danger small" onClick={() => remove(p)}>Eliminar</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {editing && <ProductForm initial={editing} cats={cats} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </div>
  )
}
