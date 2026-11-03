import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { money, dateTime } from '../../lib/format'

const STATUS = [['nuevo', 'Nuevo'], ['atendido', 'Atendido'], ['cancelado', 'Cancelado']]

export default function Orders({ canDelete }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function setStatus(id, status) {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders((cur) => cur.map((o) => (o.id === id ? { ...o, status } : o)))
  }
  async function remove(id) {
    if (!confirm('¿Eliminar este pedido?')) return
    await supabase.from('orders').delete().eq('id', id)
    setOrders((cur) => cur.filter((o) => o.id !== id))
  }

  const list = orders.filter((o) => filter === 'todos' || o.status === filter)

  return (
    <div className="panel">
      <div className="row-head">
        <h2 style={{ margin: 0 }}>Pedidos</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['todos', 'Todos'], ...STATUS].map(([k, l]) => (
            <button key={k} className={'chip' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>{l}</button>
          ))}
          <button className="chip" onClick={load}>↻ Actualizar</button>
        </div>
      </div>
      {loading ? <div className="empty">Cargando…</div> : !list.length ? <div className="empty">No hay pedidos.</div> : list.map((o) => (
        <div className="order-card" key={o.id}>
          <header>
            <div>
              <strong>{o.customer_name}</strong> · <a href={`https://wa.me/${o.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="textlink">{o.customer_phone}</a>
              <div className="sub" style={{ margin: 0 }}>{dateTime(o.created_at)}</div>
            </div>
            <strong>{money(o.total)}</strong>
          </header>
          <ul>{(o.order_items || []).map((i) => <li key={i.id}>{i.name} × {i.qty} — {money(i.price * i.qty)}</li>)}</ul>
          {o.notes && <p className="sub">Notas: {o.notes}</p>}
          <div className="actions-cell">
            <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="chip">
              {STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            {canDelete && <button className="btn danger small" onClick={() => remove(o.id)}>Eliminar</button>}
          </div>
        </div>
      ))}
    </div>
  )
}
