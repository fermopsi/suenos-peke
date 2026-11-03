import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Settings() {
  const [s, setS] = useState({ whatsapp: '', announcement: '' })
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      const o = Object.fromEntries((data || []).map((r) => [r.key, r.value]))
      setS({ whatsapp: o.whatsapp || '', announcement: o.announcement || '' })
    })
  }, [])

  async function save(e) {
    e.preventDefault(); setMsg(null)
    const rows = Object.entries(s).map(([key, value]) => ({ key, value }))
    const { error } = await supabase.from('settings').upsert(rows)
    setMsg(error ? { t: 'err', m: error.message } : { t: 'ok', m: 'Cambios guardados.' })
  }

  return (
    <form className="panel" onSubmit={save} style={{ maxWidth: 560 }}>
      <h2>Ajustes de la tienda</h2>
      <label className="field"><span>WhatsApp de la tienda (con código de país, solo números)</span>
        <input value={s.whatsapp} onChange={(e) => setS({ ...s, whatsapp: e.target.value })} placeholder="59171234567" inputMode="numeric" />
      </label>
      <label className="field"><span>Mensaje de la barra superior</span>
        <input value={s.announcement} onChange={(e) => setS({ ...s, announcement: e.target.value })} />
      </label>
      {msg && <div className={'msg ' + msg.t}>{msg.m}</div>}
      <button className="btn primary">Guardar</button>
    </form>
  )
}
