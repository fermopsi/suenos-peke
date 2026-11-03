export const money = (n) =>
  'Bs ' + Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const dateTime = (d) =>
  new Date(d).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })
