import { createContext, useContext, useEffect, useState } from 'react'

const CartCtx = createContext(null)
export const useCart = () => useContext(CartCtx)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sp_cart') || '[]') } catch { return [] }
  })
  useEffect(() => {
    try { localStorage.setItem('sp_cart', JSON.stringify(items)) } catch {}
  }, [items])

  const add = (p) =>
    setItems((cur) => {
      const f = cur.find((x) => x.id === p.id)
      if (f) return cur.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x))
      return [...cur, { id: p.id, name: p.name, price: Number(p.price), qty: 1 }]
    })
  const change = (id, d) =>
    setItems((cur) => cur.map((x) => (x.id === id ? { ...x, qty: x.qty + d } : x)).filter((x) => x.qty > 0))
  const clear = () => setItems([])
  const count = items.reduce((s, x) => s + x.qty, 0)
  const total = items.reduce((s, x) => s + x.qty * x.price, 0)

  return <CartCtx.Provider value={{ items, add, change, clear, count, total }}>{children}</CartCtx.Provider>
}
