import { toDateKey, pad2 } from './habitUtils'

// ==================== LÓGICA DOS LEMBRETES ====================
export const HORIZON_DAYS = 3 // mostra o que vence hoje e nos próximos 3 dias (além do que já está atrasado)

const URGENCY_ORDER = { overdue: 0, today: 1, tomorrow: 2, soon: 3 }

// Diferença em dias entre duas datas "yyyy-mm-dd" (sem sofrer com horário de verão)
export function daysBetween(fromKey, toKey) {
  const [fy, fm, fd] = fromKey.split('-').map(Number)
  const [ty, tm, td] = toKey.split('-').map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000)
}

const urgencyOf = (diff) => (diff < 0 ? 'overdue' : diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : 'soon')

/**
 * Monta a lista de lembretes a partir das tarefas e dos eventos.
 * - Tarefas: só as pendentes com prazo atrasado ou dentro do horizonte.
 * - Eventos: de hoje até o horizonte (eventos de hoje cujo horário já passou ficam de fora).
 * Ordem: atrasadas, hoje, amanhã, próximos dias; dentro de cada grupo, a data/horário mais cedo primeiro.
 */
export function buildReminders({ tasks = [], events = [], now = new Date(), horizonDays = HORIZON_DAYS } = {}) {
  const todayKey = toDateKey(now)
  const nowTime = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
  const items = []

  tasks.forEach((task) => {
    if (task.is_completed || !task.due_date) return
    const diff = daysBetween(todayKey, String(task.due_date).slice(0, 10))
    if (diff > horizonDays) return
    items.push({ id: `task-${task.id}`, kind: 'task', title: task.title, diff, time: null, urgency: urgencyOf(diff), tab: 'tarefas' })
  })

  events.forEach((event) => {
    if (!event.event_date) return
    const diff = daysBetween(todayKey, String(event.event_date).slice(0, 10))
    if (diff < 0 || diff > horizonDays) return
    const time = event.event_time ? String(event.event_time).slice(0, 5) : null
    if (diff === 0 && time && time < nowTime) return
    items.push({ id: `event-${event.id}`, kind: 'event', title: event.title, diff, time, urgency: urgencyOf(diff), tab: 'agenda' })
  })

  return items.sort((a, b) =>
    URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] ||
    a.diff - b.diff ||
    (a.time || '99:99').localeCompare(b.time || '99:99') ||
    a.title.localeCompare(b.title)
  )
}

export const urgentReminders = (items) => items.filter((item) => item.urgency !== 'soon')

export function reminderLabel(item) {
  if (item.urgency === 'overdue') {
    const days = Math.abs(item.diff)
    return days === 1 ? 'Atrasada desde ontem' : `Atrasada há ${days} dias`
  }
  const at = item.time ? ` às ${item.time}` : ''
  if (item.urgency === 'today') return item.kind === 'event' ? `Hoje${at}` : 'Vence hoje'
  if (item.urgency === 'tomorrow') return item.kind === 'event' ? `Amanhã${at}` : 'Vence amanhã'
  return item.kind === 'event' ? `Em ${item.diff} dias${at}` : `Vence em ${item.diff} dias`
}

// Texto curto para a notificação do navegador
export function summarizeReminders(items) {
  const urgent = urgentReminders(items)
  const count = (urgency) => urgent.filter((item) => item.urgency === urgency).length
  const parts = []
  const overdue = count('overdue')
  const today = count('today')
  const tomorrow = count('tomorrow')
  if (overdue) parts.push(`${overdue} ${overdue === 1 ? 'atrasada' : 'atrasadas'}`)
  if (today) parts.push(`${today} para hoje`)
  if (tomorrow) parts.push(`${tomorrow} para amanhã`)
  return {
    title: 'UFA Organizei: seus lembretes',
    body: parts.join(' · '),
    count: urgent.length,
  }
}

// ==================== NOTIFICAÇÕES DO NAVEGADOR ====================
// Funcionam quando o app é aberto (ou instalado): uma vez por dia, resumem o que está urgente.
// Avisar com o app fechado exigiria um servidor enviando notificações push.
export const REMINDER_PREF_KEY = 'ufa-reminders-enabled'
export const REMINDER_LAST_KEY = 'ufa-reminders-last'

const safeStorage = () => { try { return window.localStorage } catch { return null } }

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window

export const getReminderPref = () => safeStorage()?.getItem(REMINDER_PREF_KEY) === '1' && notificationsSupported() && Notification.permission === 'granted'

export function setReminderPref(enabled) {
  const storage = safeStorage()
  if (!storage) return
  if (enabled) storage.setItem(REMINDER_PREF_KEY, '1')
  else storage.removeItem(REMINDER_PREF_KEY)
}

// Pede permissão ao navegador. Retorna 'granted' | 'denied' | 'default' | 'unsupported'
export async function enableReminders() {
  if (!notificationsSupported()) return 'unsupported'
  const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
  setReminderPref(permission === 'granted')
  return permission
}

export async function showReminderNotification({ title, body }) {
  const options = { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: 'ufa-reminders', data: { tab: 'tarefas' } }
  try {
    const registration = await navigator.serviceWorker?.getRegistration?.()
    if (registration?.showNotification) return registration.showNotification(title, options) // necessário no Android
  } catch { /* cai para o método simples */ }
  return new Notification(title, options)
}

// Dispara no máximo uma notificação por dia, e só se houver algo urgente
export function maybeNotifyDaily(items, now = new Date()) {
  const storage = safeStorage()
  if (!storage || !getReminderPref()) return false
  const summary = summarizeReminders(items)
  if (summary.count === 0) return false
  const today = toDateKey(now)
  if (storage.getItem(REMINDER_LAST_KEY) === today) return false
  storage.setItem(REMINDER_LAST_KEY, today)
  showReminderNotification(summary).catch(() => {})
  return true
}
