import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, BarChart, ListTodo, Clock, Award } from 'lucide-react'
import { supabase } from './supabaseClient'
import { pad2, toDateKey, formatMinutes, percentOf, isMissingTable } from './habitUtils'

const cardCls = 'bg-white dark:bg-gray-900 border border-[#e4e9e6] dark:border-gray-800 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]'

const monthLabel = (year, month) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date(year, month, 1))
    .replace(/^./, (c) => c.toUpperCase())

// Data de referência de uma tarefa: o prazo, ou o dia em que foi criada quando não tem prazo
const taskRefDate = (task) => {
  if (task.due_date) return String(task.due_date).slice(0, 10)
  if (task.created_at) return toDateKey(new Date(task.created_at))
  return null
}

function StatCard({ icon: Icon, tone, value, label, hint }) {
  const tones = {
    green: 'bg-[#e8f5ef] text-[#00674F]',
    gold: 'bg-[#fdf5e0] text-[#b8942a]',
    red: 'bg-red-50 text-red-500',
  }
  return (
    <div className={`${cardCls} p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon size={22} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-2xl font-bold text-[#1a2e26] dark:text-gray-100 leading-none mb-1">{value}</span>
        <span className="text-[13px] font-bold text-[#1a2e26] dark:text-gray-100">{label}</span>
        <span className="text-[11px] text-[#8a9e94] dark:text-gray-400 mt-0.5">{hint}</span>
      </div>
    </div>
  )
}

export default function Reports({ session, tasks = [] }) {
  const userId = session?.user?.id
  const now = new Date()
  const todayKey = toDateKey(now)

  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [reloadKey, setReloadKey] = useState(0)
  const [data, setData] = useState({ key: null, status: 'ready', habits: [], logs: [] })

  const monthStart = toDateKey(new Date(cursor.year, cursor.month, 1))
  const monthEnd = toDateKey(new Date(cursor.year, cursor.month + 1, 0))
  const daysCount = new Date(cursor.year, cursor.month + 1, 0).getDate()
  const monthPrefix = monthStart.slice(0, 8) // "2026-11-"
  const isCurrentMonth = cursor.year === now.getFullYear() && cursor.month === now.getMonth()
  const fetchKey = `${monthStart}#${reloadKey}`
  const loading = data.key !== fetchKey

  const goMonth = (delta) => setCursor((c) => {
    const d = new Date(c.year, c.month + delta, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  // Hábitos e registros do mês selecionado
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('habit_logs').select('habit_id, log_date, minutes').eq('user_id', userId).gte('log_date', monthStart).lte('log_date', monthEnd),
      ])
      if (cancelled) return
      const err = habitsRes.error || logsRes.error
      if (err) {
        console.error('Erro ao carregar relatório de hábitos:', err)
        setData({ key: fetchKey, status: isMissingTable(err) ? 'missing' : 'error', habits: [], logs: [] })
        return
      }
      setData({ key: fetchKey, status: 'ready', habits: habitsRes.data || [], logs: logsRes.data || [] })
    })()
    return () => { cancelled = true }
  }, [userId, monthStart, monthEnd, fetchKey])

  // ---------- Tarefas ----------
  const taskStats = useMemo(() => {
    const inMonth = tasks.filter((t) => {
      const ref = taskRefDate(t)
      return ref && ref >= monthStart && ref <= monthEnd
    })
    const done = inMonth.filter((t) => t.is_completed).length
    const overdue = inMonth.filter((t) => !t.is_completed && t.due_date && String(t.due_date).slice(0, 10) < todayKey).length
    const groups = {}
    inMonth.forEach((t) => {
      const key = t.category || 'Sem categoria'
      if (!groups[key]) groups[key] = { name: key, total: 0, done: 0 }
      groups[key].total += 1
      if (t.is_completed) groups[key].done += 1
    })
    return {
      total: inMonth.length,
      done,
      overdue,
      rate: inMonth.length > 0 ? Math.round((done / inMonth.length) * 100) : 0,
      categories: Object.values(groups).sort((a, b) => b.total - a.total),
    }
  }, [tasks, monthStart, monthEnd, todayKey])

  // ---------- Hábitos ----------
  const habitStats = useMemo(() => {
    const logsMap = {}
    data.logs.forEach((l) => {
      if (!logsMap[l.habit_id]) logsMap[l.habit_id] = {}
      logsMap[l.habit_id][l.log_date] = l.minutes
    })
    const lastConsidered = monthEnd < todayKey ? monthEnd : todayKey

    const rows = data.habits.map((habit) => {
      const perDay = Array.from({ length: daysCount }, (_, i) => logsMap[habit.id]?.[`${monthPrefix}${pad2(i + 1)}`] || 0)
      const total = perDay.reduce((sum, v) => sum + v, 0)
      const activeDays = perDay.filter((v) => v > 0).length
      const goalsMet = perDay.filter((v) => v >= habit.goal_minutes).length
      // Dias possíveis: do dia em que o hábito foi criado (ou do início do mês) até hoje/fim do mês
      const createdKey = habit.created_at ? toDateKey(new Date(habit.created_at)) : monthStart
      const firstDay = createdKey > monthStart ? createdKey : monthStart
      const possible = lastConsidered >= firstDay ? Number(lastConsidered.slice(8, 10)) - Number(firstDay.slice(8, 10)) + 1 : 0
      return { habit, perDay, total, activeDays, goalsMet, possible }
    })

    const dailyTotals = Array.from({ length: daysCount }, (_, i) => rows.reduce((sum, r) => sum + r.perDay[i], 0))
    return {
      rows,
      dailyTotals,
      totalMinutes: rows.reduce((sum, r) => sum + r.total, 0),
      goalsMet: rows.reduce((sum, r) => sum + r.goalsMet, 0),
      possible: rows.reduce((sum, r) => sum + r.possible, 0),
      activeDays: dailyTotals.filter((v) => v > 0).length,
      maxDaily: Math.max(1, ...dailyTotals),
    }
  }, [data, daysCount, monthPrefix, monthStart, monthEnd, todayKey])

  const retry = () => setReloadKey((k) => k + 1)
  const habitsReady = !loading && data.status === 'ready'

  return (
    <div className="space-y-5">
      {/* Cabeçalho + navegação de mês */}
      <div className={`${cardCls} p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#e8f5ef] flex items-center justify-center shrink-0">
            <BarChart size={22} className="text-[#00674F]" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-[#1a2e26] dark:text-gray-100">Relatórios</h2>
            <p className="text-[12px] text-[#8a9e94] dark:text-gray-400 mt-0.5">Seu histórico de tarefas e hábitos, mês a mês.</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            aria-label="Mês anterior"
            className="w-9 h-9 rounded-xl border border-[#e4e9e6] dark:border-gray-700 flex items-center justify-center text-[#5a6b63] dark:text-gray-300 hover:bg-[#f0f5f2] dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[150px] text-center text-[13px] font-bold text-[#1a2e26] dark:text-gray-100">{monthLabel(cursor.year, cursor.month)}</span>
          <button
            type="button"
            onClick={() => goMonth(1)}
            disabled={isCurrentMonth}
            aria-label="Próximo mês"
            className="w-9 h-9 rounded-xl border border-[#e4e9e6] dark:border-gray-700 flex items-center justify-center text-[#5a6b63] dark:text-gray-300 hover:bg-[#f0f5f2] dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ListTodo} tone="green" value={`${taskStats.done}/${taskStats.total}`} label="Tarefas concluídas" hint={taskStats.total === 0 ? 'Sem tarefas neste mês' : `${taskStats.rate}% de conclusão`} />
        <StatCard icon={Clock} tone="red" value={taskStats.overdue} label="Tarefas atrasadas" hint={taskStats.overdue === 0 ? 'Nenhuma pendência vencida' : 'Pendentes com prazo vencido'} />
        <StatCard icon={BarChart} tone="gold" value={habitsReady ? formatMinutes(habitStats.totalMinutes) : '--'} label="Tempo em hábitos" hint={habitsReady ? `${habitStats.activeDays} ${habitStats.activeDays === 1 ? 'dia ativo' : 'dias ativos'}` : 'Carregando...'} />
        <StatCard icon={Award} tone="green" value={habitsReady ? `${habitStats.goalsMet}/${habitStats.possible}` : '--'} label="Metas de hábitos" hint="Metas diárias batidas" />
      </div>

      {/* Atividade diária */}
      <div className={`${cardCls} p-6`}>
        <h3 className="text-[14px] font-bold text-[#1a2e26] dark:text-gray-100">Atividade diária</h3>
        <p className="text-[11px] text-[#8a9e94] dark:text-gray-400 mt-0.5 mb-5">Tempo total dedicado aos hábitos em cada dia</p>

        {loading && <div className="h-32 rounded-xl bg-[#fafcfb] dark:bg-gray-800 animate-pulse" />}

        {!loading && data.status === 'missing' && (
          <p className="text-xs text-gray-500 dark:text-gray-400">As tabelas de hábitos ainda não existem no Supabase. Rode o arquivo <b>supabase-habitos.sql</b> e volte aqui.</p>
        )}

        {!loading && data.status === 'error' && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Não foi possível carregar os hábitos.{' '}
            <button type="button" onClick={retry} className="font-bold text-[#00674F] underline">Tentar de novo</button>
          </div>
        )}

        {habitsReady && data.habits.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">Você ainda não tem hábitos. Crie o primeiro na tela Início e acompanhe sua evolução aqui.</p>
        )}

        {habitsReady && data.habits.length > 0 && (
          <>
            <div className="flex items-end gap-[3px] h-32">
              {habitStats.dailyTotals.map((value, i) => {
                const dayKey = `${monthPrefix}${pad2(i + 1)}`
                const isToday = dayKey === todayKey
                const height = value === 0 ? 3 : Math.max(8, Math.round((value / habitStats.maxDaily) * 100))
                return (
                  <div key={dayKey} className="flex-1 h-full flex items-end" title={`${pad2(i + 1)}/${pad2(cursor.month + 1)}: ${formatMinutes(value)}`}>
                    <div
                      className={`w-full rounded-sm ${value === 0 ? 'bg-gray-200 dark:bg-gray-700' : 'bg-[#00674F]'} ${isToday ? 'ring-2 ring-[#D3AF37]' : ''}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
              <span>1</span>
              <span>{Math.ceil(daysCount / 2)}</span>
              <span>{daysCount}</span>
            </div>
          </>
        )}
      </div>

      {/* Hábitos */}
      {habitsReady && habitStats.rows.length > 0 && (
        <div className={`${cardCls} p-6`}>
          <h3 className="text-[14px] font-bold text-[#1a2e26] dark:text-gray-100">Seus hábitos no mês</h3>
          <p className="text-[11px] text-[#8a9e94] dark:text-gray-400 mt-0.5 mb-5">Cada barra é um dia; barras cheias bateram a meta</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {habitStats.rows.map(({ habit, perDay, total, activeDays, goalsMet, possible }) => (
              <div key={habit.id} className="bg-[#fafcfb] dark:bg-gray-800 border border-[#e8ede9] dark:border-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                    <span className="text-[13px] font-bold text-[#1a2e26] dark:text-gray-100 truncate">{habit.name}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0">{formatMinutes(total)} · meta {formatMinutes(habit.goal_minutes)}/dia</span>
                </div>

                <div className="flex items-end gap-[2px] h-12">
                  {perDay.map((value, i) => {
                    const pct = percentOf(value, habit.goal_minutes)
                    const reached = value >= habit.goal_minutes
                    return (
                      <div key={i} className="flex-1 h-full flex items-end" title={`${pad2(i + 1)}/${pad2(cursor.month + 1)}: ${formatMinutes(value)}`}>
                        <div
                          className={`w-full rounded-sm ${value === 0 ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                          style={{
                            height: `${value === 0 ? 6 : Math.max(pct, 12)}%`,
                            backgroundColor: value === 0 ? undefined : habit.color,
                            opacity: value === 0 ? 1 : reached ? 1 : 0.5,
                          }}
                        />
                      </div>
                    )
                  })}
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">
                  Dias ativos: <b>{activeDays}</b> · Metas batidas: <b>{goalsMet}/{possible}</b>
                  {activeDays > 0 && <> · Média: <b>{formatMinutes(total / activeDays)}</b>/dia ativo</>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarefas por categoria */}
      <div className={`${cardCls} p-6`}>
        <h3 className="text-[14px] font-bold text-[#1a2e26] dark:text-gray-100">Tarefas por categoria</h3>
        <p className="text-[11px] text-[#8a9e94] dark:text-gray-400 mt-0.5 mb-5">Considera as tarefas com prazo em {monthLabel(cursor.year, cursor.month)} (ou criadas nele, se não tiverem prazo)</p>

        {taskStats.categories.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">Nenhuma tarefa neste mês.</p>
        ) : (
          <div className="space-y-4">
            {taskStats.categories.map((cat) => {
              const pct = Math.round((cat.done / cat.total) * 100)
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between text-[12px] mb-1.5">
                    <span className="font-bold text-[#1a2e26] dark:text-gray-100">{cat.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">{cat.done} de {cat.total} · {pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#e8ede9] dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-[#00674F]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
