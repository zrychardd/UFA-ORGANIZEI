import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X, Check, Trash2, Pencil, BarChart, Flame } from 'lucide-react'
import { supabase } from './supabaseClient'

// ==================== CONSTANTES ====================
const MAX_HABITS = 8
const HISTORY_DAYS = 60
const COLORS = ['#00674F', '#D3AF37', '#2E86AB', '#C0504D', '#8E6BBF', '#E07B39']
const GOAL_CHIPS = [15, 30, 60, 90, 120, 180]
const QUICK_ADD = [15, 30, 60]

// Sugestões para quem ainda não tem hábitos (metas diárias, editáveis depois)
const PRESETS = [
  { name: 'Estudar', goal_minutes: 120, color: '#D3AF37' },
  { name: 'Exercícios', goal_minutes: 60, color: '#00674F' },
  { name: 'Leitura', goal_minutes: 30, color: '#D3AF37' },
  { name: 'Projetos', goal_minutes: 90, color: '#00674F' },
]

const inputCls =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:border-[#00674F]'

// ==================== AUXILIARES ====================
const pad2 = (n) => String(n).padStart(2, '0')

const toDateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

// Últimos N dias (do mais antigo para hoje), sempre no fuso local
const lastDays = (count) => {
  const now = new Date()
  return Array.from({ length: count }, (_, i) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - (count - 1 - i))
  )
}

const formatMinutes = (total) => {
  const min = Math.max(0, Math.round(total || 0))
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${pad2(m)}`
}

const weekdayShort = (d) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d).replace('.', '')

const percentOf = (minutes, goal) => (goal > 0 ? Math.min(100, Math.round((minutes / goal) * 100)) : 0)

// Tabela ainda não criada no Supabase (SQL não foi executado)
const isMissingTable = (err) =>
  ['PGRST205', '42P01'].includes(err?.code) || /schema cache|does not exist/i.test(err?.message || '')

// ==================== PEÇAS VISUAIS ====================
function Ring({ percent, color, size = 48, inner = 36, done = false }) {
  return (
    <div className="relative rounded-full flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${color} ${percent}%, #e8f5ef 0)` }} />
      <div
        className="relative rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-[10px] font-bold text-[#5a6b63] dark:text-gray-300"
        style={{ width: inner, height: inner }}
      >
        {done ? <Check size={size >= 60 ? 20 : 14} strokeWidth={3} style={{ color }} /> : `${percent}%`}
      </div>
    </div>
  )
}

// Os modais usam portal para ficarem acima do header e fora de qualquer container com transform
function Modal({ children, onClose, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
      style={{ animation: 'fadeIn 0.18s ease' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white dark:bg-gray-900 rounded-2xl w-full ${maxWidth} p-6 shadow-xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto`}
        style={{ animation: 'slideUpModal 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

// ==================== MODAL: CRIAR / EDITAR ====================
function HabitFormModal({ habit, saving, onSave, onClose, onRequestDelete }) {
  const [name, setName] = useState(habit?.name || '')
  const [goal, setGoal] = useState(String(habit?.goal_minutes || 60))
  const [color, setColor] = useState(habit?.color || COLORS[0])

  const goalNumber = Math.round(Number(goal))
  const validGoal = Number.isFinite(goalNumber) && goalNumber >= 1 && goalNumber <= 1440
  const canSave = name.trim().length > 0 && validGoal && !saving

  const submit = (e) => {
    e.preventDefault()
    if (!canSave) return
    onSave({ id: habit?.id, name: name.trim(), goal_minutes: goalNumber, color })
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{habit ? 'Editar hábito' : 'Novo hábito'}</h3>
        <button type="button" onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={16} /></button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="Ex: Estudar, Meditar, Inglês"
            className={inputCls}
            autoFocus
            required
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Meta diária (em minutos)</label>
          <input
            type="number"
            min={1}
            max={1440}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className={inputCls}
            required
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {GOAL_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setGoal(String(chip))}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${goalNumber === chip
                  ? 'bg-[#00674F] text-white border-[#00674F]'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-[#f0f5f2] dark:hover:bg-gray-800'}`}
              >
                {formatMinutes(chip)}
              </button>
            ))}
          </div>
          <p className={`text-[11px] mt-2 ${validGoal ? 'text-gray-400' : 'text-red-500'}`}>
            {validGoal ? `Meta: ${formatMinutes(goalNumber)} por dia` : 'Informe um valor entre 1 e 1440 minutos'}
          </p>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Cor</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Cor ${c}`}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
              >
                {color === c && <Check size={13} strokeWidth={3} className="text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {habit ? (
            <button type="button" onClick={() => onRequestDelete(habit)} className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600">
              <Trash2 size={13} /> Excluir
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-500 dark:text-gray-400">Cancelar</button>
            <button type="submit" disabled={!canSave} className="px-4 py-2 bg-[#00674F] hover:bg-[#005240] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

// ==================== MODAL: REGISTRAR TEMPO ====================
function LogModal({ habit, minutes, streak, onChange, onEdit, onClose }) {
  const [custom, setCustom] = useState('')
  const percent = percentOf(minutes, habit.goal_minutes)
  const done = minutes >= habit.goal_minutes
  const customNumber = Math.round(Number(custom))
  const validCustom = Number.isFinite(customNumber) && customNumber > 0

  const addCustom = (e) => {
    e.preventDefault()
    if (!validCustom) return
    onChange(minutes + customNumber)
    setCustom('')
  }

  const todayLabel = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date())

  return (
    <Modal onClose={onClose} maxWidth="max-w-sm">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{habit.name}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Hoje, {todayLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onEdit} aria-label="Editar hábito" className="text-gray-400 hover:text-[#00674F]"><Pencil size={15} /></button>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={16} /></button>
        </div>
      </div>

      <div className="flex items-center gap-5 mb-5">
        <Ring percent={percent} color={habit.color} size={72} inner={56} done={done} />
        <div>
          <p className="text-lg font-bold text-[#1a2e26] dark:text-gray-100 leading-tight">
            {formatMinutes(minutes)} <span className="text-xs font-medium text-gray-400">de {formatMinutes(habit.goal_minutes)}</span>
          </p>
          <p className="text-[11px] mt-1 text-gray-500 dark:text-gray-400">
            {done ? 'Meta de hoje concluída!' : `Faltam ${formatMinutes(habit.goal_minutes - minutes)} para a meta`}
          </p>
          {streak > 0 && (
            <p className="text-[11px] mt-1 font-semibold text-[#b8942a] flex items-center gap-1"><Flame size={12} /> {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {QUICK_ADD.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => onChange(minutes + amount)}
            className="py-2.5 rounded-xl text-xs font-bold border border-[#bfe3d3] dark:border-gray-700 bg-[#e8f5ef] dark:bg-gray-800 text-[#00674F] dark:text-gray-100 hover:bg-[#d7eee3] dark:hover:bg-gray-700 transition-colors"
          >
            +{formatMinutes(amount)}
          </button>
        ))}
      </div>

      <form onSubmit={addCustom} className="flex gap-2 mb-4">
        <input
          type="number"
          min={1}
          max={1440}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Outro valor (minutos)"
          className={inputCls}
        />
        <button type="submit" disabled={!validCustom} className="px-4 rounded-xl text-xs font-bold bg-[#00674F] hover:bg-[#005240] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors">
          Adicionar
        </button>
      </form>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, minutes - 15))}
          disabled={minutes === 0}
          className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 disabled:opacity-40"
        >
          −15min (corrigir)
        </button>
        <button
          type="button"
          onClick={() => onChange(0)}
          disabled={minutes === 0}
          className="text-[11px] font-semibold text-red-500 hover:text-red-600 disabled:opacity-40"
        >
          Zerar hoje
        </button>
      </div>
    </Modal>
  )
}

// ==================== MODAL: CONFIRMAR EXCLUSÃO ====================
function ConfirmDeleteModal({ habit, saving, onConfirm, onClose }) {
  return (
    <Modal onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-50 border border-red-100">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-[#1a2e26] dark:text-gray-100">Excluir "{habit.name}"?</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Todo o histórico desse hábito será apagado. Essa ação não pode ser desfeita.</p>
        </div>
        <div className="flex gap-2 w-full mt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-500 dark:text-gray-400">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={saving} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-colors">
            {saving ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ==================== MODAL: RELATÓRIO (7 DIAS) ====================
function ReportModal({ habits, minutesOn, getStreak, onClose }) {
  const days = useMemo(() => lastDays(7), [])

  const rows = habits.map((habit) => {
    const perDay = days.map((d) => minutesOn(habit.id, toDateKey(d)))
    const total = perDay.reduce((sum, v) => sum + v, 0)
    const met = perDay.filter((v) => v >= habit.goal_minutes).length
    return { habit, perDay, total, met, streak: getStreak(habit) }
  })

  const totalMinutes = rows.reduce((sum, r) => sum + r.total, 0)
  const totalMet = rows.reduce((sum, r) => sum + r.met, 0)
  const bestStreak = rows.reduce((max, r) => Math.max(max, r.streak), 0)

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><BarChart size={16} className="text-[#00674F]" /> Relatório de hábitos</h3>
        <button type="button" onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={16} /></button>
      </div>
      <p className="text-[11px] text-gray-400 mb-5">Últimos 7 dias, incluindo hoje</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Tempo total', value: formatMinutes(totalMinutes) },
          { label: 'Metas batidas', value: `${totalMet}/${habits.length * 7}` },
          { label: 'Maior sequência', value: `${bestStreak} ${bestStreak === 1 ? 'dia' : 'dias'}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#fafcfb] dark:bg-gray-800 border border-[#e8ede9] dark:border-gray-800 rounded-2xl p-3 text-center">
            <p className="text-base font-bold text-[#1a2e26] dark:text-gray-100">{stat.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {rows.map(({ habit, perDay, total, met, streak }) => (
          <div key={habit.id} className="bg-[#fafcfb] dark:bg-gray-800 border border-[#e8ede9] dark:border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: habit.color }} />
                <span className="text-[13px] font-bold text-[#1a2e26] dark:text-gray-100">{habit.name}</span>
              </div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">{formatMinutes(total)} · meta {formatMinutes(habit.goal_minutes)}/dia</span>
            </div>

            <div className="flex items-end gap-1.5 h-16">
              {perDay.map((value, i) => {
                const pct = percentOf(value, habit.goal_minutes)
                const reached = value >= habit.goal_minutes
                return (
                  <div
                    key={i}
                    className="flex-1 h-full flex items-end"
                    title={`${weekdayShort(days[i])} ${pad2(days[i].getDate())}/${pad2(days[i].getMonth() + 1)}: ${formatMinutes(value)}`}
                  >
                    <div
                      className={`w-full rounded-md ${value === 0 ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                      style={{
                        height: `${value === 0 ? 4 : Math.max(pct, 10)}%`,
                        backgroundColor: value === 0 ? undefined : habit.color,
                        opacity: value === 0 ? 1 : reached ? 1 : 0.5,
                      }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex gap-1.5 mt-1.5">
              {days.map((d, i) => (
                <span key={i} className="flex-1 text-center text-[10px] text-gray-400 capitalize">{weekdayShort(d)}</span>
              ))}
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">
              Metas batidas: <b>{met}/7</b>
              {streak > 0 && <> · Sequência atual: <b>{streak} {streak === 1 ? 'dia' : 'dias'}</b></>}
            </p>
          </div>
        ))}
      </div>
    </Modal>
  )
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function Habits({ session, showNotification }) {
  const userId = session?.user?.id
  const notify = (message, type = 'error', title = '') => showNotification?.(message, type, title)

  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([]) // [{ habit_id, log_date, minutes }]
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'missing' | 'error'
  const [saving, setSaving] = useState(false)

  const [formModal, setFormModal] = useState(null) // null | { habit?: {...} }
  const [logHabitId, setLogHabitId] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [habitToDelete, setHabitToDelete] = useState(null)

  const today = toDateKey(new Date())

  // Carrega hábitos + registros. `reloadKey` serve para o botão "tentar de novo"
  const [reloadKey, setReloadKey] = useState(0)
  const retryLoad = () => { setStatus('loading'); setReloadKey((k) => k + 1) }

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      const since = toDateKey(lastDays(HISTORY_DAYS)[0])
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('habit_logs').select('habit_id, log_date, minutes').eq('user_id', userId).gte('log_date', since),
      ])
      if (cancelled) return
      const err = habitsRes.error || logsRes.error
      if (err) {
        console.error('Erro ao carregar hábitos:', err)
        setStatus(isMissingTable(err) ? 'missing' : 'error')
        return
      }
      setHabits(habitsRes.data || [])
      setLogs(logsRes.data || [])
      setStatus('ready')
    })()
    return () => { cancelled = true }
  }, [userId, reloadKey])

  // { [habitId]: { [yyyy-mm-dd]: minutes } }
  const logsMap = useMemo(() => {
    const map = {}
    logs.forEach((l) => {
      if (!map[l.habit_id]) map[l.habit_id] = {}
      map[l.habit_id][l.log_date] = l.minutes
    })
    return map
  }, [logs])

  const minutesOn = useCallback((habitId, dateKey) => logsMap[habitId]?.[dateKey] || 0, [logsMap])

  // Dias seguidos batendo a meta. Se hoje ainda não bateu, a contagem parte de ontem (a sequência só quebra quando o dia acaba)
  const getStreak = useCallback((habit) => {
    const keys = lastDays(HISTORY_DAYS).map(toDateKey).reverse() // hoje primeiro
    let i = minutesOn(habit.id, keys[0]) >= habit.goal_minutes ? 0 : 1
    let streak = 0
    for (; i < keys.length; i++) {
      if (minutesOn(habit.id, keys[i]) >= habit.goal_minutes) streak++
      else break
    }
    return streak
  }, [minutesOn])

  // ---------- Ações ----------
  const handleSaveHabit = async ({ id, name, goal_minutes, color }) => {
    setSaving(true)
    try {
      if (id) {
        const { data, error } = await supabase.from('habits').update({ name, goal_minutes, color }).eq('id', id).eq('user_id', userId).select().single()
        if (error) throw error
        setHabits((prev) => prev.map((h) => (h.id === id ? data : h)))
      } else {
        const { data, error } = await supabase.from('habits').insert([{ user_id: userId, name, goal_minutes, color }]).select().single()
        if (error) throw error
        setHabits((prev) => [...prev, data])
      }
      setFormModal(null)
    } catch (err) {
      console.error(err)
      notify('Não foi possível salvar o hábito. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddPresets = async () => {
    setSaving(true)
    const base = Date.now()
    // created_at distinto garante a ordem dos cartões
    const rows = PRESETS.map((p, i) => ({ ...p, user_id: userId, created_at: new Date(base + i).toISOString() }))
    const { data, error } = await supabase.from('habits').insert(rows).select()
    setSaving(false)
    if (error) {
      console.error(error)
      notify('Não foi possível criar os hábitos sugeridos. Tente novamente.')
      return
    }
    setHabits((prev) => [...prev, ...(data || [])])
  }

  const handleDeleteHabit = async () => {
    if (!habitToDelete) return
    setSaving(true)
    const { error } = await supabase.from('habits').delete().eq('id', habitToDelete.id).eq('user_id', userId)
    setSaving(false)
    if (error) {
      console.error(error)
      notify('Não foi possível excluir o hábito. Tente novamente.')
      return
    }
    setHabits((prev) => prev.filter((h) => h.id !== habitToDelete.id))
    setLogs((prev) => prev.filter((l) => l.habit_id !== habitToDelete.id))
    setHabitToDelete(null)
    setFormModal(null)
    setLogHabitId(null)
  }

  const applyLocalLog = (habitId, dateKey, minutes) => {
    setLogs((prev) => [
      ...prev.filter((l) => !(l.habit_id === habitId && l.log_date === dateKey)),
      { habit_id: habitId, log_date: dateKey, minutes },
    ])
  }

  // Atualiza o tempo de hoje (otimista: mostra na hora e desfaz se o banco recusar)
  const handleSetMinutesToday = async (habit, nextMinutes) => {
    const minutes = Math.min(1440, Math.max(0, Math.round(nextMinutes)))
    const previous = minutesOn(habit.id, today)
    if (minutes === previous) return
    applyLocalLog(habit.id, today, minutes)
    const { error } = await supabase
      .from('habit_logs')
      .upsert({ habit_id: habit.id, user_id: userId, log_date: today, minutes }, { onConflict: 'habit_id,log_date' })
    if (error) {
      console.error(error)
      applyLocalLog(habit.id, today, previous)
      notify('Não foi possível registrar o tempo. Verifique sua conexão e tente novamente.')
    }
  }

  const logHabit = habits.find((h) => h.id === logHabitId) || null
  const canCreate = habits.length < MAX_HABITS
  const openCreate = () => {
    if (!canCreate) {
      notify(`Você pode ter até ${MAX_HABITS} hábitos. Exclua um para criar outro.`, 'info', 'Limite atingido')
      return
    }
    setFormModal({})
  }

  // ---------- Render ----------
  return (
    <div className="bg-white dark:bg-gray-900 border border-[#e4e9e6] dark:border-gray-800 p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
        <div>
          <span className="text-[15px] font-bold text-[#1a2e26] dark:text-gray-100 flex items-center gap-2.5">
            <BarChart size={18} className="text-[#00674F]" /> Seus hábitos
          </span>
          <p className="text-[12px] text-[#8a9e94] dark:text-gray-400 mt-1">Acompanhe seus hábitos diários</p>
        </div>
        {status === 'ready' && (
          <div className="flex gap-2">
            {habits.length > 0 && (
              <button
                type="button"
                onClick={() => setShowReport(true)}
                className="text-xs font-semibold text-[#00674F] border border-[#e4e9e6] dark:border-gray-800 rounded-xl px-4 py-2 hover:bg-[#f0f5f2] dark:hover:bg-gray-800 transition-colors shadow-sm"
              >
                Ver relatório
              </button>
            )}
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#00674F] hover:bg-[#005240] rounded-xl px-4 py-2 transition-colors shadow-sm"
            >
              <Plus size={14} /> Novo hábito
            </button>
          </div>
        )}
      </div>

      {status === 'loading' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[82px] rounded-2xl bg-[#fafcfb] dark:bg-gray-800 border border-[#e8ede9] dark:border-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {status === 'missing' && (
        <div className="border border-dashed border-[#f2e2b0] bg-[#fdf5e0]/60 dark:bg-gray-800 dark:border-gray-700 rounded-2xl p-6 text-center">
          <p className="text-[13px] font-bold text-[#1a2e26] dark:text-gray-100">As tabelas de hábitos ainda não existem no Supabase</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Rode o arquivo <b>supabase-habitos.sql</b> no SQL Editor do Supabase e depois clique abaixo.</p>
          <button type="button" onClick={retryLoad} className="mt-4 px-4 py-2 bg-[#00674F] hover:bg-[#005240] text-white rounded-xl text-xs font-bold transition-colors">
            Já rodei, tentar de novo
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="border border-dashed border-red-100 dark:border-gray-700 rounded-2xl p-6 text-center">
          <p className="text-[13px] font-bold text-[#1a2e26] dark:text-gray-100">Não foi possível carregar seus hábitos</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Verifique sua conexão e tente novamente.</p>
          <button type="button" onClick={retryLoad} className="mt-4 px-4 py-2 bg-[#00674F] hover:bg-[#005240] text-white rounded-xl text-xs font-bold transition-colors">
            Tentar de novo
          </button>
        </div>
      )}

      {status === 'ready' && habits.length === 0 && (
        <div className="border border-dashed border-[#e4e9e6] dark:border-gray-700 rounded-2xl p-6 text-center">
          <p className="text-[13px] font-bold text-[#1a2e26] dark:text-gray-100">Você ainda não tem hábitos</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Comece com as sugestões ({PRESETS.map((p) => p.name).join(', ')}) ou crie os seus.</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <button type="button" onClick={handleAddPresets} disabled={saving} className="px-4 py-2 bg-[#00674F] hover:bg-[#005240] disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-colors">
              {saving ? 'Criando...' : 'Usar sugestões'}
            </button>
            <button type="button" onClick={openCreate} className="px-4 py-2 border border-[#e4e9e6] dark:border-gray-700 text-[#00674F] rounded-xl text-xs font-bold hover:bg-[#f0f5f2] dark:hover:bg-gray-800 transition-colors">
              Criar do zero
            </button>
          </div>
        </div>
      )}

      {status === 'ready' && habits.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {habits.map((habit) => {
            const minutes = minutesOn(habit.id, today)
            const percent = percentOf(minutes, habit.goal_minutes)
            const done = minutes >= habit.goal_minutes
            const streak = getStreak(habit)
            return (
              <button
                key={habit.id}
                type="button"
                onClick={() => setLogHabitId(habit.id)}
                aria-label={`Registrar tempo em ${habit.name}`}
                className="text-left bg-[#fafcfb] dark:bg-gray-800 border border-[#e8ede9] dark:border-gray-800 p-4 rounded-2xl flex items-center gap-4 hover:shadow-sm hover:border-[#bfe3d3] transition-all"
              >
                <Ring percent={percent} color={habit.color} done={done} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-bold text-[#1a2e26] dark:text-gray-100 truncate">{habit.name}</span>
                  <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    Diário
                    {streak > 0 && <span className="flex items-center gap-0.5 text-[#b8942a]">· <Flame size={10} />{streak}</span>}
                  </span>
                  <span className="text-[10px] text-gray-400">{formatMinutes(minutes)} de {formatMinutes(habit.goal_minutes)}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Modais */}
      {formModal && (
        <HabitFormModal
          habit={formModal.habit}
          saving={saving}
          onSave={handleSaveHabit}
          onClose={() => setFormModal(null)}
          onRequestDelete={(habit) => setHabitToDelete(habit)}
        />
      )}

      {logHabit && !formModal && (
        <LogModal
          habit={logHabit}
          minutes={minutesOn(logHabit.id, today)}
          streak={getStreak(logHabit)}
          onChange={(value) => handleSetMinutesToday(logHabit, value)}
          onEdit={() => setFormModal({ habit: logHabit })}
          onClose={() => setLogHabitId(null)}
        />
      )}

      {showReport && (
        <ReportModal habits={habits} minutesOn={minutesOn} getStreak={getStreak} onClose={() => setShowReport(false)} />
      )}

      {habitToDelete && (
        <ConfirmDeleteModal habit={habitToDelete} saving={saving} onConfirm={handleDeleteHabit} onClose={() => setHabitToDelete(null)} />
      )}
    </div>
  )
}
