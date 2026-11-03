import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import Products from './admin/Products.jsx'
import Categories from './admin/Categories.jsx'
import Orders from './admin/Orders.jsx'
import Users from './admin/Users.jsx'
import Settings from './admin/Settings.jsx'

export default function Admin() {
  const { session, profile, loading, isStaff, isAdmin, signOut } = useAuth()
  const [tab, setTab] = useState('pedidos')

  if (loading) return <div className="center-page"><div className="empty">Cargando…</div></div>
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <div className="center-page"><div className="empty">Cargando tu perfil…</div></div>
  if (!isStaff) {
    return (
      <div className="center-page"><div className="card">
        <h1>Sin acceso</h1>
        <p className="sub">Tu usuario no tiene permiso para entrar al panel o está desactivado. Pide al administrador que lo habilite.</p>
        <button className="btn secondary" onClick={signOut}>Cerrar sesión</button>
      </div></div>
    )
  }

  const tabs = [
    ['pedidos', 'Pedidos'],
    ['productos', 'Productos'],
    ...(isAdmin ? [['categorias', 'Categorías'], ['usuarios', 'Usuarios'], ['ajustes', 'Ajustes']] : []),
  ]

  return (
    <>
      <div className="admin-top"><div className="wrap admin-bar">
        <Link to="/" className="brand"><span className="mark">S</span><span><strong>SUEÑOSPEKE</strong><small>PANEL · {profile.role === 'admin' ? 'ADMINISTRADOR' : 'EMPLEADO'}</small></span></Link>
        <div className="nav-actions">
          <Link to="/" className="iconbtn hide-m">Ver tienda</Link>
          <button className="iconbtn" onClick={signOut}>Salir</button>
        </div>
      </div></div>
      <div className="wrap">
        <div className="tabs">
          {tabs.map(([k, label]) => (
            <button key={k} className={'tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>
        {tab === 'pedidos' && <Orders canDelete={isAdmin} />}
        {tab === 'productos' && <Products />}
        {tab === 'categorias' && isAdmin && <Categories />}
        {tab === 'usuarios' && isAdmin && <Users />}
        {tab === 'ajustes' && isAdmin && <Settings />}
      </div>
    </>
  )
}
