// Funções pequenas compartilhadas entre Habits.jsx e Reports.jsx

export const pad2 = (n) => String(n).padStart(2, '0')

// yyyy-mm-dd no fuso local (evita o "dia errado" do toISOString, que usa UTC)
export const toDateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

export const formatMinutes = (total) => {
  const min = Math.max(0, Math.round(total || 0))
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${pad2(m)}`
}

export const percentOf = (minutes, goal) => (goal > 0 ? Math.min(100, Math.round((minutes / goal) * 100)) : 0)

// Tabela ainda não criada no Supabase (SQL não foi executado)
export const isMissingTable = (err) =>
  ['PGRST205', '42P01'].includes(err?.code) || /schema cache|does not exist/i.test(err?.message || '')
