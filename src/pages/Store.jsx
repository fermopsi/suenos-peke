import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../lib/cart.jsx'
import { money } from '../lib/format'

const goTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

function Brand() {
  return (
    <a className="brand" href="#inicio">
      <span className="mark">S</span>
      <span><strong>SUEÑOSPEKE</strong><small>TIENDA MÉDICA</small></span>
    </a>
  )
}

function CartModal({ onClose, whatsapp }) {
  const { items, change, clear, total } = useCart()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  async function submit() {
    if (!items.length) return
    if (!name.trim() || !phone.trim()) { setErr('Escribe tu nombre y tu número de WhatsApp.'); return }
    setBusy(true); setErr('')
    const orderId = crypto.randomUUID()
    const { error: e1 } = await supabase.from('orders').insert({
      id: orderId, customer_name: name.trim(), customer_phone: phone.trim(), notes: notes.trim() || null, total,
    })
    if (e1) { setBusy(false); setErr('No se pudo registrar el pedido. Intenta de nuevo.'); return }
    const { error: e2 } = await supabase.from('order_items').insert(
      items.map((i) => ({ order_id: orderId, product_id: i.id, name: i.name, price: i.price, qty: i.qty }))
    )
    setBusy(false)
    if (e2) { setErr('No se pudo registrar el detalle del pedido.'); return }

    const lines = items.map((i) => `• ${i.name} × ${i.qty} — ${money(i.price * i.qty)}`).join('\n')
    const text = `Hola, quiero hacer este pedido en SUEÑOSPEKE:\n\n${lines}\n\nTotal: ${money(total)}\nNombre: ${name}\nTeléfono: ${phone}${notes ? '\nNotas: ' + notes : ''}`
    clear()
    setDone(true)
    if (whatsapp) window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head"><h3>Tu bolsa</h3><button className="close" onClick={onClose}>✕</button></div>
        {done ? (
          <div className="empty">¡Gracias! Tu pedido fue registrado. Te contactaremos pronto.</div>
        ) : (
          <>
            {!items.length ? (
              <div className="empty">Todavía no agregaste productos.</div>
            ) : (
              items.map((x) => (
                <div className="cartline" key={x.id}>
                  <span style={{ flex: 1 }}>{x.name}</span>
                  <span className="qty">
                    <button onClick={() => change(x.id, -1)}>−</button>{x.qty}<button onClick={() => change(x.id, 1)}>+</button>
                  </span>
                  <strong>{money(x.price * x.qty)}</strong>
                </div>
              ))
            )}
            <div className="total"><span>Total</span><span>{money(total)}</span></div>
            <label className="field"><span>Nombre</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" /></label>
            <label className="field"><span>WhatsApp</span><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Tu número de contacto" inputMode="tel" /></label>
            <label className="field"><span>Notas (opcional)</span><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dirección, detalles…" /></label>
            {err && <div className="msg err">{err}</div>}
            <button className="btn primary" style={{ width: '100%' }} disabled={busy || !items.length} onClick={submit}>
              {busy ? 'Enviando…' : 'Enviar mi pedido'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function Store() {
  const { add, count } = useCart()
  const [cats, setCats] = useState([])
  const [products, setProducts] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [flash, setFlash] = useState(null)

  useEffect(() => {
    (async () => {
      const [c, p, s] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order').order('name'),
        supabase.from('products').select('*').eq('active', true).order('featured', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('settings').select('*'),
      ])
      setCats(c.data || [])
      setProducts(p.data || [])
      setSettings(Object.fromEntries((s.data || []).map((r) => [r.key, r.value])))
      setLoading(false)
    })()
  }, [])

  const catById = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, c])), [cats])
  const visible = products.filter(
    (p) => (!catFilter || p.category_id === catFilter) && (!q || (p.name + ' ' + (p.description || '')).toLowerCase().includes(q.toLowerCase()))
  )
  const whatsapp = (settings.whatsapp || '').replace(/\D/g, '')
  const nav = (id) => { setMenu(false); goTo(id) }

  function addProduct(p) {
    add(p); setFlash(p.id); setTimeout(() => setFlash(null), 900)
  }

  return (
    <>
      <div className="announcement">{settings.announcement || 'ATENCIÓN ESPECIALIZADA · PRODUCTOS MÉDICOS SELECCIONADOS'}</div>
      <header className="header">
        <div className="wrap nav">
          <Brand />
          <nav className={'links' + (menu ? ' open' : '')}>
            <a href="#inicio" onClick={() => setMenu(false)}>Inicio</a>
            <a href="#categorias" onClick={() => setMenu(false)}>Categorías</a>
            <a href="#tienda" onClick={() => setMenu(false)}>Tienda</a>
            <a href="#nosotros" onClick={() => setMenu(false)}>Nosotros</a>
            <a href="#contacto" onClick={() => setMenu(false)}>Contacto</a>
          </nav>
          <div className="nav-actions">
            <button className="iconbtn hide-m" onClick={() => goTo('tienda')}>⌕ Buscar</button>
            <button className="iconbtn" onClick={() => setOpen(true)}>Bolsa <span className="cart-count">{count}</span></button>
            <button className="iconbtn menu" onClick={() => setMenu(!menu)}>☰</button>
          </div>
        </div>
      </header>

      <main id="inicio">
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <span className="eyebrow">Cuidado y confianza en cada detalle</span>
              <h1>Lo que necesitas para cuidar <em>mejor.</em></h1>
              <p className="lead">Encuentra productos e insumos médicos seleccionados para acompañar tu práctica profesional. Atención cercana, información clara y una experiencia de compra sencilla.</p>
              <div className="actions">
                <button className="btn primary" onClick={() => nav('tienda')}>Explorar productos ↗</button>
                <button className="btn secondary" onClick={() => nav('contacto')}>Contáctanos</button>
              </div>
              <div className="hero-note"><span><i className="dot" /> Atención personalizada</span><span><i className="dot" /> Compra sencilla</span></div>
            </div>
            <div className="hero-art">
              <div className="floating float-a">✦ Selección especializada</div>
              <div className="medical-card">
                <div className="medical-icon">🩺</div>
                <h3>Bienvenido a SUEÑOSPEKE</h3>
                <p>Productos médicos para profesionales que cuidan de otros.</p>
              </div>
              <div className="floating float-b">Cuidado en cada detalle ♡</div>
            </div>
          </div>
        </section>

        <div className="trust"><div className="wrap trust-grid">
          <div className="trust-item"><span className="trust-icon">♡</span><span>Atención cercana y personalizada</span></div>
          <div className="trust-item"><span className="trust-icon">✧</span><span>Productos seleccionados</span></div>
          <div className="trust-item"><span className="trust-icon">⌁</span><span>Pedidos fáciles y seguros</span></div>
        </div></div>

        <section className="section" id="categorias"><div className="wrap">
          <div className="section-head">
            <div><span className="kicker">Explora por especialidad</span><h2>Categorías destacadas</h2><p className="sub">Encuentra rápidamente lo que buscas.</p></div>
            <button className="textlink" onClick={() => { setCatFilter(null); goTo('tienda') }}>Ver catálogo completo →</button>
          </div>
          <div className="categories">
            {cats.map((c) => (
              <button key={c.id} className={'category' + (catFilter === c.id ? ' active' : '')}
                onClick={() => { setCatFilter(catFilter === c.id ? null : c.id); goTo('tienda') }}>
                <div className="cat-icon">{c.icon || '✚'}</div>
                <strong>{c.name}</strong>
                <small>{c.description}</small>
              </button>
            ))}
          </div>
        </div></section>

        <section className="section" id="tienda" style={{ background: '#fff' }}><div className="wrap">
          <div className="section-head">
            <div><span className="kicker">Una selección para ti</span><h2>Productos</h2><p className="sub">Elige lo que necesitas y envía tu pedido por WhatsApp.</p></div>
            <button className="textlink" onClick={() => goTo('contacto')}>¿Buscas algo específico? →</button>
          </div>
          <div className="toolbar">
            <input placeholder="Buscar producto…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className={'chip' + (!catFilter ? ' active' : '')} onClick={() => setCatFilter(null)}>Todos</button>
            {cats.map((c) => (
              <button key={c.id} className={'chip' + (catFilter === c.id ? ' active' : '')} onClick={() => setCatFilter(c.id)}>{c.name}</button>
            ))}
          </div>
          {loading ? <div className="empty">Cargando…</div> : !visible.length ? (
            <div className="empty">No encontramos productos con ese filtro.</div>
          ) : (
            <div className="products">
              {visible.map((p) => {
                const cat = catById[p.category_id]
                return (
                  <article className="product" key={p.id}>
                    <div className="product-image">
                      {p.featured && <span className="tag">DESTACADO</span>}
                      {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" /> : (cat?.icon || '🩺')}
                    </div>
                    <div className="product-info">
                      <span className="product-cat">{cat?.name || 'Producto'}</span>
                      <h3>{p.name}</h3>
                      {p.description && <p className="desc">{p.description}</p>}
                      <div className="product-foot">
                        <span className="price">{money(p.price)}</span>
                        <button className="add" onClick={() => addProduct(p)} aria-label="Agregar a la bolsa">{flash === p.id ? '✓' : '+'}</button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div></section>

        <section className="section" id="nosotros"><div className="wrap"><div className="feature">
          <div>
            <span className="kicker">Sobre SUEÑOSPEKE</span>
            <h2>Una experiencia de compra pensada para quienes cuidan.</h2>
            <p>Queremos acercarte productos médicos especializados con una atención clara, humana y confiable. Estamos construyendo un espacio donde puedas explorar, consultar y realizar tus pedidos de manera sencilla.</p>
            <button className="btn primary" onClick={() => goTo('contacto')}>Conocer más</button>
          </div>
          <div className="feature-visual">🌿 ♡ 🩺</div>
        </div></div></section>

        <section className="section" id="contacto"><div className="wrap"><div className="newsletter">
          <div><h2>¿Necesitas ayuda para elegir?</h2><p>Escríbenos y te orientaremos sobre disponibilidad y pedidos.</p></div>
          {whatsapp
            ? <a className="btn" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">Consultar por WhatsApp ↗</a>
            : <span style={{ fontSize: 12, color: '#d6e1d8' }}>WhatsApp pendiente de configurar</span>}
        </div></div></section>
      </main>

      <footer><div className="wrap">
        <div className="footer-grid">
          <div><Brand /><p>Especialistas en lo que necesitas. Productos médicos y atención cercana para profesionales de la salud.</p></div>
          <div><h4>Explorar</h4><a href="#categorias">Categorías</a><a href="#tienda">Tienda</a><a href="#nosotros">Nosotros</a></div>
          <div><h4>Atención</h4><a href="#contacto">Contacto</a><a href="#contacto">WhatsApp</a><Link to="/login">Acceso del equipo</Link></div>
        </div>
        <div className="copyright"><span>© 2026 SUEÑOSPEKE. Todos los derechos reservados.</span><span>Bolivia · Precios en bolivianos (Bs)</span></div>
      </div></footer>

      {open && <CartModal onClose={() => setOpen(false)} whatsapp={whatsapp} />}
    </>
  )
}
