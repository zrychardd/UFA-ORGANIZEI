import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, Minus, X, GraduationCap, Award, ChevronDown, AlertTriangle, BookOpen } from 'lucide-react'
import { supabase } from './supabaseClient'
import Modal from './Modal'
import { isMissingTable } from './habitUtils'
import {
  CONCEPTS, CONCEPT_LABEL, defaultWorkload, maxAbsences, absenceStatus,
  calcCR, calcCA, approvedCredits, formatCoef, partialAverage, currentTermLabel, isValidTerm, termDisplay,
} from './ufabc'

const cardCls = 'bg-white dark:bg-gray-900 border border-[#e4e9e6] dark:border-gray-800 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
const inputCls = 'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:border-[#00674F]'
const labelCls = 'text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block'

const LETTER_STYLE = {
  A: 'bg-[#e8f5ef] text-[#00674F]',
  B: 'bg-[#e8f5ef] text-[#00674F]',
  C: 'bg-[#fdf5e0] text-[#b8942a]',
  D: 'bg-orange-50 text-orange-600',
  F: 'bg-red-50 text-red-600',
  O: 'bg-red-50 text-red-600',
}
const BAR_COLOR = { ok: '#00674F', warn: '#D3AF37', danger: '#ef4444', failed: '#ef4444' }

const parseDecimal = (text) => Number(String(text).trim().replace(',', '.'))
const formatScore = (value) => (value === null || value === undefined ? '--' : value.toFixed(1).replace('.', ','))

function StatCard({ icon: Icon, tone, value, label, hint }) {
  const tones = { green: 'bg-[#e8f5ef] text-[#00674F]', gold: 'bg-[#fdf5e0] text-[#b8942a]' }
  return (
    <div className={`${cardCls} p-4 sm:p-5 flex items-center gap-4`}>
      <div className={`hidden sm:flex w-12 h-12 rounded-2xl items-center justify-center shrink-0 ${tones[tone]}`}><Icon size={22} /></div>
      <div className="flex flex-col min-w-0">
        <span className="text-xl sm:text-2xl font-bold text-[#1a2e26] dark:text-gray-100 leading-none mb-1">{value}</span>
        <span className="text-xs sm:text-[13px] font-bold text-[#1a2e26] dark:text-gray-100">{label}</span>
        <span className="text-[11px] text-[#8a9e94] dark:text-gray-400 mt-0.5">{hint}</span>
      </div>
    </div>
  )
}

// ==================== MODAL: DISCIPLINA ====================
function CourseFormModal({ course, terms, defaultTerm, saving, onSave, onClose }) {
  const [name, setName] = useState(course?.name || '')
  const [code, setCode] = useState(course?.code || '')
  const [term, setTerm] = useState(course?.term || defaultTerm)
  const [credits, setCredits] = useState(String(course?.credits ?? 4))
  const [workload, setWorkload] = useState(String(course?.workload_hours ?? defaultWorkload(course?.credits ?? 4)))
  const [workloadTouched, setWorkloadTouched] = useState(Boolean(course))

  const creditsNumber = Math.round(Number(credits))
  const workloadNumber = Math.round(Number(workload))
  const validCredits = Number.isFinite(creditsNumber) && creditsNumber >= 0 && creditsNumber <= 30
  const validWorkload = Number.isFinite(workloadNumber) && workloadNumber >= 1 && workloadNumber <= 400
  const canSave = name.trim().length > 0 && validCredits && validWorkload && isValidTerm(term) && !saving

  const onCreditsChange = (value) => {
    setCredits(value)
    const n = Math.round(Number(value))
    if (!workloadTouched && Number.isFinite(n) && n >= 0) setWorkload(String(defaultWorkload(n)))
  }

  const submit = (e) => {
    e.preventDefault()
    if (!canSave) return
    onSave({ id: course?.id, name: name.trim(), code: code.trim() || null, term, credits: creditsNumber, workload_hours: workloadNumber })
  }

  return (
    <Modal onClose={onClose} labelledBy="course-form-title">
      <div className="flex items-center justify-between mb-4">
        <h3 id="course-form-title" className="text-sm font-bold text-gray-800 dark:text-gray-100">{course ? 'Editar disciplina' : 'Nova disciplina'}</h3>
        <button type="button" onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={16} /></button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="course-name" className={labelCls}>Nome da disciplina</label>
          <input id="course-name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Ex: Cálculo de Várias Variáveis" className={inputCls} autoFocus required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="course-code" className={labelCls}>Código (opcional)</label>
            <input id="course-code" type="text" value={code} onChange={(e) => setCode(e.target.value)} maxLength={20} placeholder="MCTA001-17" className={inputCls} />
          </div>
          <div>
            <label htmlFor="course-term" className={labelCls}>Quadrimestre</label>
            <select id="course-term" value={term} onChange={(e) => setTerm(e.target.value)} className={inputCls}>
              {terms.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="course-credits" className={labelCls}>Créditos</label>
            <input id="course-credits" type="number" min={0} max={30} value={credits} onChange={(e) => onCreditsChange(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label htmlFor="course-workload" className={labelCls}>Carga horária (horas)</label>
            <input id="course-workload" type="number" min={1} max={400} value={workload} onChange={(e) => { setWorkload(e.target.value); setWorkloadTouched(true) }} className={inputCls} required />
          </div>
        </div>

        <p className={`text-[11px] ${validCredits && validWorkload ? 'text-gray-400' : 'text-red-500'}`}>
          {validCredits && validWorkload
            ? `Limite de faltas: ${maxAbsences(workloadNumber)} (25% da carga). Os créditos somam T + P (e E, nas disciplinas com extensão): 4-0-4 vale 4 créditos.`
            : 'Confira os créditos (0 a 30) e a carga horária (1 a 400).'}
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-500 dark:text-gray-400">Cancelar</button>
          <button type="submit" disabled={!canSave} className="px-4 py-2 bg-[#00674F] hover:bg-[#005240] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ==================== MODAL: NOVO QUADRIMESTRE ====================
function TermModal({ existing, onAdd, onClose }) {
  const [term, setTerm] = useState('')
  const valid = isValidTerm(term.trim())
  const duplicated = existing.includes(term.trim())

  const submit = (e) => {
    e.preventDefault()
    if (valid && !duplicated) onAdd(term.trim())
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-sm" labelledBy="term-form-title">
      <div className="flex items-center justify-between mb-4">
        <h3 id="term-form-title" className="text-sm font-bold text-gray-800 dark:text-gray-100">Novo quadrimestre</h3>
        <button type="button" onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={16} /></button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label htmlFor="term-input" className={labelCls}>Ano e quadrimestre</label>
          <input id="term-input" type="text" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Ex: 2027.1" maxLength={6} className={inputCls} autoFocus />
        </div>
        <p className={`text-[11px] ${term && (!valid || duplicated) ? 'text-red-500' : 'text-gray-400'}`}>
          {term && !valid ? 'Use o formato ano.quadrimestre, com 1, 2 ou 3 (ex.: 2027.1).' : duplicated ? 'Esse quadrimestre já existe.' : 'O 1º vai de fevereiro a maio, o 2º de junho a setembro e o 3º de outubro a janeiro.'}
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-500 dark:text-gray-400">Cancelar</button>
          <button type="submit" disabled={!valid || duplicated} className="px-4 py-2 bg-[#00674F] hover:bg-[#005240] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors">Adicionar</button>
        </div>
      </form>
    </Modal>
  )
}

// ==================== MODAL: EXCLUIR DISCIPLINA ====================
function DeleteCourseModal({ course, saving, onConfirm, onClose }) {
  return (
    <Modal onClose={onClose} maxWidth="max-w-sm" labelledBy="course-delete-title">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-50 border border-red-100"><Trash2 size={20} className="text-red-500" /></div>
        <div>
          <h3 id="course-delete-title" className="text-[15px] font-bold text-[#1a2e26] dark:text-gray-100">Excluir "{course.name}"?</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">O conceito, as faltas e as notas dessa disciplina serão apagados.</p>
        </div>
        <div className="flex gap-2 w-full mt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-500 dark:text-gray-400">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={saving} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-colors">{saving ? 'Excluindo...' : 'Excluir'}</button>
        </div>
      </div>
    </Modal>
  )
}

// ==================== NOTAS DE UMA DISCIPLINA ====================
function GradesPanel({ course, grades, onAdd, onUpdate, onDelete }) {
  const [title, setTitle] = useState('')
  const [weight, setWeight] = useState('1')
  const { average, weightDone, weightTotal } = partialAverage(grades)
  const weightNumber = parseDecimal(weight)
  const canAdd = title.trim().length > 0 && Number.isFinite(weightNumber) && weightNumber > 0 && weightNumber <= 100

  const add = (e) => {
    e.preventDefault()
    if (!canAdd) return
    onAdd(course.id, title.trim(), weightNumber)
    setTitle('')
    setWeight('1')
  }

  // Salva ao sair do campo; valor inválido volta ao anterior (a chave força o campo a recarregar)
  const commitScore = (grade, text) => {
    const clean = text.trim()
    if (clean === '') { if (grade.score !== null) onUpdate(grade, { score: null }); return }
    const value = parseDecimal(clean)
    if (!Number.isFinite(value) || value < 0 || value > 10) { onUpdate(grade, {}, 'A nota deve estar entre 0 e 10.'); return }
    if (value !== grade.score) onUpdate(grade, { score: value })
  }
  const commitWeight = (grade, text) => {
    const value = parseDecimal(text)
    if (!Number.isFinite(value) || value <= 0 || value > 100) { onUpdate(grade, {}, 'O peso deve ser maior que 0 e no máximo 100.'); return }
    if (value !== Number(grade.weight)) onUpdate(grade, { weight: value })
  }

  return (
    <div className="mt-3 pt-3 border-t border-[#eef2ef] dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-[#1a2e26] dark:text-gray-100">Avaliações</span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          Média parcial: <b>{formatScore(average)}</b>
          {weightTotal > 0 && <> · {Math.round((weightDone / weightTotal) * 100)}% lançado</>}
        </span>
      </div>

      {grades.length > 0 && (
        <div className="space-y-1.5 mb-3">
          <div className="grid grid-cols-[1fr_64px_64px_24px] gap-2 text-[10px] font-bold text-gray-400 px-1">
            <span>Nome</span><span>Peso</span><span>Nota</span><span />
          </div>
          {grades.map((grade) => (
            <div key={`${grade.id}:${grade.score}:${grade.weight}`} className="grid grid-cols-[1fr_64px_64px_24px] gap-2 items-center">
              <span className="text-xs text-gray-700 dark:text-gray-200 truncate px-1" title={grade.title}>{grade.title}</span>
              <input aria-label={`Peso de ${grade.title}`} defaultValue={String(grade.weight).replace('.', ',')} onBlur={(e) => commitWeight(grade, e.target.value)} inputMode="decimal" className={`${inputCls} !py-1.5 text-center`} />
              <input aria-label={`Nota de ${grade.title}`} defaultValue={grade.score === null ? '' : String(grade.score).replace('.', ',')} onBlur={(e) => commitScore(grade, e.target.value)} placeholder="--" inputMode="decimal" className={`${inputCls} !py-1.5 text-center`} />
              <button type="button" onClick={() => onDelete(grade)} aria-label={`Excluir ${grade.title}`} className="text-gray-300 hover:text-red-500 transition-colors"><X size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={add} className="grid grid-cols-[1fr_64px_auto] gap-2 items-center">
        <input aria-label="Nome da nova avaliação" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Prova 1" maxLength={60} className={`${inputCls} !py-1.5`} />
        <input aria-label="Peso da nova avaliação" value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" className={`${inputCls} !py-1.5 text-center`} />
        <button type="submit" disabled={!canAdd} className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#00674F] hover:bg-[#005240] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors">Adicionar</button>
      </form>
      <p className="text-[10px] text-gray-400 mt-2">A UFABC atribui conceitos (A a F). Esta média é só um apoio para você acompanhar.</p>
    </div>
  )
}

// ==================== CARTÃO DE DISCIPLINA ====================
function CourseCard({ course, grades, simLetter, onSimChange, onLetter, onAbsence, onEdit, onDelete, gradeActions }) {
  const [showGrades, setShowGrades] = useState(false)
  const status = absenceStatus(course.absences, course.workload_hours)
  const inProgress = !course.grade_letter

  const absenceText = {
    failed: `Acima do limite de ${status.max}: risco de reprovação por frequência (O)`,
    danger: 'No limite: mais uma falta reprova por frequência',
    warn: `Atenção: restam ${status.remaining} ${status.remaining === 1 ? 'falta' : 'faltas'}`,
    ok: `Você ainda pode faltar ${status.remaining} ${status.remaining === 1 ? 'vez' : 'vezes'}`,
  }[status.level]

  return (
    <div className={`${cardCls} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-[14px] font-bold text-[#1a2e26] dark:text-gray-100 truncate">{course.name}</h4>
          <p className="text-[11px] text-[#8a9e94] dark:text-gray-400 mt-0.5">
            {course.code ? `${course.code} · ` : ''}{course.credits} {course.credits === 1 ? 'crédito' : 'créditos'} · {course.workload_hours}h
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {course.grade_letter && (
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${LETTER_STYLE[course.grade_letter]}`} title={CONCEPT_LABEL[course.grade_letter]}>{course.grade_letter}</span>
          )}
          <button type="button" onClick={() => onEdit(course)} aria-label={`Editar ${course.name}`} className="text-gray-400 hover:text-[#00674F] transition-colors"><Pencil size={15} /></button>
          <button type="button" onClick={() => onDelete(course)} aria-label={`Excluir ${course.name}`} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
        </div>
      </div>

      {/* Conceito */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <div>
          <label htmlFor={`letter-${course.id}`} className={labelCls}>Conceito final</label>
          <select id={`letter-${course.id}`} aria-label={`Conceito de ${course.name}`} value={course.grade_letter || ''} onChange={(e) => onLetter(course, e.target.value || null)} className={inputCls}>
            <option value="">Em andamento</option>
            {CONCEPTS.map((letter) => <option key={letter} value={letter}>{CONCEPT_LABEL[letter]}</option>)}
          </select>
        </div>
        {inProgress && (
          <div>
            <label htmlFor={`sim-${course.id}`} className={labelCls}>Simular conceito (não salva)</label>
            <select id={`sim-${course.id}`} aria-label={`Simular conceito de ${course.name}`} value={simLetter || ''} onChange={(e) => onSimChange(course.id, e.target.value || null)} className={inputCls}>
              <option value="">Sem simulação</option>
              {CONCEPTS.map((letter) => <option key={letter} value={letter}>{letter}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Faltas */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Faltas: <b className="text-[#1a2e26] dark:text-gray-100">{status.used}</b> de {status.max} permitidas</span>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => onAbsence(course, course.absences - 1)} disabled={course.absences <= 0} aria-label={`Diminuir faltas de ${course.name}`} className="w-7 h-7 rounded-lg border border-[#e4e9e6] dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-[#f0f5f2] dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"><Minus size={13} /></button>
            <button type="button" onClick={() => onAbsence(course, course.absences + 1)} aria-label={`Aumentar faltas de ${course.name}`} className="w-7 h-7 rounded-lg bg-[#00674F] hover:bg-[#005240] flex items-center justify-center text-white transition-colors"><Plus size={13} /></button>
          </div>
        </div>
        <div className="h-2 rounded-full bg-[#e8ede9] dark:bg-gray-700 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(status.ratio * 100)}%`, backgroundColor: BAR_COLOR[status.level] }} />
        </div>
        <p className={`text-[11px] mt-1.5 flex items-center gap-1 ${status.level === 'ok' ? 'text-gray-500 dark:text-gray-400' : status.level === 'warn' ? 'text-[#b8942a]' : 'text-red-500 font-semibold'}`}>
          {status.level !== 'ok' && <AlertTriangle size={12} />}{absenceText}
        </p>
      </div>

      {/* Notas */}
      <button type="button" onClick={() => setShowGrades((v) => !v)} aria-expanded={showGrades} className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-[#00674F] hover:opacity-80">
        <ChevronDown size={14} className={`transition-transform ${showGrades ? 'rotate-180' : ''}`} />
        Notas e avaliações{grades.length > 0 ? ` (${grades.length})` : ''}
      </button>
      {showGrades && <GradesPanel course={course} grades={grades} {...gradeActions} />}
    </div>
  )
}

// ==================== TELA PRINCIPAL ====================
export default function Courses({ session, showNotification }) {
  const userId = session?.user?.id
  const notify = (message, type = 'error', title = '') => showNotification?.(message, type, title)

  const [reloadKey, setReloadKey] = useState(0)
  const [data, setData] = useState({ key: null, status: 'loading', courses: [], grades: [] })
  const [selectedTerm, setSelectedTerm] = useState(() => currentTermLabel())
  const [extraTerms, setExtraTerms] = useState([])
  const [sim, setSim] = useState({})
  const [courseForm, setCourseForm] = useState(null) // null | { course? }
  const [termModal, setTermModal] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const loading = data.key !== reloadKey

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      const [coursesRes, gradesRes] = await Promise.all([
        supabase.from('courses').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('course_grades').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      ])
      if (cancelled) return
      const err = coursesRes.error || gradesRes.error
      if (err) {
        console.error('Erro ao carregar disciplinas:', err)
        setData({ key: reloadKey, status: isMissingTable(err) ? 'missing' : 'error', courses: [], grades: [] })
        return
      }
      setData({ key: reloadKey, status: 'ready', courses: coursesRes.data || [], grades: gradesRes.data || [] })
    })()
    return () => { cancelled = true }
  }, [userId, reloadKey])

  const retry = () => setReloadKey((k) => k + 1)
  const { courses, grades } = data

  const terms = useMemo(() => {
    const set = new Set([...courses.map((c) => c.term), ...extraTerms, currentTermLabel(), selectedTerm])
    return [...set].sort().reverse()
  }, [courses, extraTerms, selectedTerm])

  const termCourses = courses.filter((c) => c.term === selectedTerm)

  // Simulações valem só para disciplinas ainda sem conceito
  const overrides = useMemo(() => {
    const result = {}
    courses.forEach((c) => { if (!c.grade_letter && sim[c.id]) result[c.id] = sim[c.id] })
    return result
  }, [courses, sim])
  const hasSim = Object.keys(overrides).length > 0

  // ---------- Ações no banco (com atualização imediata na tela e desfazer em caso de erro) ----------
  const patchCourse = async (id, patch, errorMessage) => {
    const previous = courses.find((c) => c.id === id)
    if (!previous) return
    setData((d) => ({ ...d, courses: d.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
    const { error } = await supabase.from('courses').update(patch).eq('id', id).eq('user_id', userId)
    if (error) {
      console.error(error)
      setData((d) => ({ ...d, courses: d.courses.map((c) => (c.id === id ? previous : c)) }))
      notify(errorMessage)
    }
  }

  const handleSaveCourse = async ({ id, ...values }) => {
    setSaving(true)
    try {
      if (id) {
        const { data: row, error } = await supabase.from('courses').update(values).eq('id', id).eq('user_id', userId).select().single()
        if (error) throw error
        setData((d) => ({ ...d, courses: d.courses.map((c) => (c.id === id ? row : c)) }))
      } else {
        const { data: row, error } = await supabase.from('courses').insert([{ ...values, user_id: userId }]).select().single()
        if (error) throw error
        setData((d) => ({ ...d, courses: [...d.courses, row] }))
      }
      setSelectedTerm(values.term)
      setCourseForm(null)
    } catch (err) {
      console.error(err)
      notify('Não foi possível salvar a disciplina. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return
    setSaving(true)
    const { error } = await supabase.from('courses').delete().eq('id', courseToDelete.id).eq('user_id', userId)
    setSaving(false)
    if (error) {
      console.error(error)
      notify('Não foi possível excluir a disciplina. Tente novamente.')
      return
    }
    setData((d) => ({ ...d, courses: d.courses.filter((c) => c.id !== courseToDelete.id), grades: d.grades.filter((g) => g.course_id !== courseToDelete.id) }))
    setCourseToDelete(null)
  }

  const handleLetter = (course, letter) => patchCourse(course.id, { grade_letter: letter }, 'Não foi possível salvar o conceito.')
  const handleAbsence = (course, next) => {
    const value = Math.min(400, Math.max(0, next))
    if (value !== course.absences) patchCourse(course.id, { absences: value }, 'Não foi possível salvar as faltas.')
  }

  const gradeActions = {
    onAdd: async (courseId, title, weight) => {
      const { data: row, error } = await supabase.from('course_grades').insert([{ course_id: courseId, user_id: userId, title, weight }]).select().single()
      if (error) { console.error(error); notify('Não foi possível adicionar a avaliação.'); return }
      setData((d) => ({ ...d, grades: [...d.grades, row] }))
    },
    onUpdate: async (grade, patch, invalidMessage) => {
      if (invalidMessage) {
        notify(invalidMessage, 'info', 'Valor inválido')
        setData((d) => ({ ...d, grades: [...d.grades] })) // recarrega o campo com o valor salvo
        return
      }
      setData((d) => ({ ...d, grades: d.grades.map((g) => (g.id === grade.id ? { ...g, ...patch } : g)) }))
      const { error } = await supabase.from('course_grades').update(patch).eq('id', grade.id).eq('user_id', userId)
      if (error) {
        console.error(error)
        setData((d) => ({ ...d, grades: d.grades.map((g) => (g.id === grade.id ? grade : g)) }))
        notify('Não foi possível salvar a nota.')
      }
    },
    onDelete: async (grade) => {
      const { error } = await supabase.from('course_grades').delete().eq('id', grade.id).eq('user_id', userId)
      if (error) { console.error(error); notify('Não foi possível excluir a avaliação.'); return }
      setData((d) => ({ ...d, grades: d.grades.filter((g) => g.id !== grade.id) }))
    },
  }

  // ---------- Números do resumo ----------
  const cr = calcCR(courses)
  const ca = calcCA(courses)
  const termCr = calcCR(termCourses)
  const ready = !loading && data.status === 'ready'

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className={`${cardCls} p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#e8f5ef] flex items-center justify-center shrink-0"><GraduationCap size={22} className="text-[#00674F]" /></div>
          <div>
            <h2 className="text-[17px] font-bold text-[#1a2e26] dark:text-gray-100">Disciplinas</h2>
            <p className="text-[12px] text-[#8a9e94] dark:text-gray-400 mt-0.5">Conceitos, faltas e notas, com CR e CA no padrão da UFABC.</p>
          </div>
        </div>
        {ready && (
          <button type="button" onClick={() => setCourseForm({})} className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#00674F] hover:bg-[#005240] rounded-xl px-4 py-2.5 transition-colors shadow-sm">
            <Plus size={14} /> Nova disciplina
          </button>
        )}
      </div>

      {loading && <div className="h-40 rounded-2xl bg-white dark:bg-gray-900 border border-[#e4e9e6] dark:border-gray-800 animate-pulse" />}

      {!loading && data.status === 'missing' && (
        <div className="border border-dashed border-[#f2e2b0] bg-[#fdf5e0]/60 dark:bg-gray-800 dark:border-gray-700 rounded-2xl p-6 text-center">
          <p className="text-[13px] font-bold text-[#1a2e26] dark:text-gray-100">As tabelas de disciplinas ainda não existem no Supabase</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Rode o arquivo <b>supabase-disciplinas.sql</b> no SQL Editor do Supabase e depois clique abaixo.</p>
          <button type="button" onClick={retry} className="mt-4 px-4 py-2 bg-[#00674F] hover:bg-[#005240] text-white rounded-xl text-xs font-bold transition-colors">Já rodei, tentar de novo</button>
        </div>
      )}

      {!loading && data.status === 'error' && (
        <div className="border border-dashed border-red-100 dark:border-gray-700 rounded-2xl p-6 text-center">
          <p className="text-[13px] font-bold text-[#1a2e26] dark:text-gray-100">Não foi possível carregar suas disciplinas</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Verifique sua conexão e tente novamente.</p>
          <button type="button" onClick={retry} className="mt-4 px-4 py-2 bg-[#00674F] hover:bg-[#005240] text-white rounded-xl text-xs font-bold transition-colors">Tentar de novo</button>
        </div>
      )}

      {ready && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={Award} tone="green" value={formatCoef(cr)} label="CR geral" hint={hasSim ? `Com simulação: ${formatCoef(calcCR(courses, overrides))}` : 'Média ponderada de tudo que cursou'} />
            <StatCard icon={Award} tone="gold" value={formatCoef(ca)} label="CA geral" hint={hasSim ? `Com simulação: ${formatCoef(calcCA(courses, overrides))}` : 'Melhor conceito das refeitas'} />
            <StatCard icon={BookOpen} tone="green" value={formatCoef(termCr)} label="CR do quadrimestre" hint={`${termCourses.length} ${termCourses.length === 1 ? 'disciplina' : 'disciplinas'} em ${selectedTerm}`} />
            <StatCard icon={GraduationCap} tone="gold" value={approvedCredits(courses)} label="Créditos aprovados" hint="Conceitos A, B, C ou D" />
          </div>

          {/* Quadrimestres */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Quadrimestres">
            {terms.map((term) => (
              <button
                key={term}
                type="button"
                role="tab"
                aria-selected={selectedTerm === term}
                onClick={() => setSelectedTerm(term)}
                title={termDisplay(term)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${selectedTerm === term
                  ? 'bg-[#00674F] text-white border-[#00674F]'
                  : 'bg-white dark:bg-gray-900 border-[#e4e9e6] dark:border-gray-800 text-gray-500 dark:text-gray-300 hover:bg-[#f0f5f2] dark:hover:bg-gray-800'}`}
              >
                {term}
              </button>
            ))}
            <button type="button" onClick={() => setTermModal(true)} className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border border-dashed border-[#bfe3d3] dark:border-gray-700 text-[#00674F] hover:bg-[#f0f5f2] dark:hover:bg-gray-800 transition-colors">
              + Quadrimestre
            </button>
          </div>

          {/* Disciplinas do quadrimestre */}
          {termCourses.length === 0 ? (
            <div className={`${cardCls} p-8 text-center`}>
              <div className="w-12 h-12 rounded-2xl bg-[#e8f5ef] flex items-center justify-center mx-auto mb-3"><GraduationCap size={22} className="text-[#00674F]" /></div>
              <p className="text-[14px] font-bold text-[#1a2e26] dark:text-gray-100">Nenhuma disciplina em {termDisplay(selectedTerm)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 max-w-sm mx-auto">Cadastre as disciplinas que você está cursando para acompanhar faltas e notas, e as já concluídas para calcular o CR e o CA.</p>
              <button type="button" onClick={() => setCourseForm({})} className="mt-4 px-4 py-2 bg-[#00674F] hover:bg-[#005240] text-white rounded-xl text-xs font-bold transition-colors">Adicionar disciplina</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {termCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  grades={grades.filter((g) => g.course_id === course.id)}
                  simLetter={sim[course.id]}
                  onSimChange={(id, letter) => setSim((s) => ({ ...s, [id]: letter }))}
                  onLetter={handleLetter}
                  onAbsence={handleAbsence}
                  onEdit={(c) => setCourseForm({ course: c })}
                  onDelete={setCourseToDelete}
                  gradeActions={gradeActions}
                />
              ))}
            </div>
          )}

          <p className="text-[11px] text-gray-400 px-1">
            Cálculo estimado com as regras da UFABC: A = 4, B = 3, C = 2, D = 1, F e O = 0, ponderados pelos créditos. Disciplinas em andamento, com conceito E ou I não entram. Confira os valores oficiais no portal do aluno.
          </p>
        </>
      )}

      {courseForm && (
        <CourseFormModal
          course={courseForm.course}
          terms={terms}
          defaultTerm={selectedTerm}
          saving={saving}
          onSave={handleSaveCourse}
          onClose={() => setCourseForm(null)}
        />
      )}
      {termModal && (
        <TermModal
          existing={terms}
          onAdd={(term) => { setExtraTerms((list) => [...list, term]); setSelectedTerm(term); setTermModal(false) }}
          onClose={() => setTermModal(false)}
        />
      )}
      {courseToDelete && <DeleteCourseModal course={courseToDelete} saving={saving} onConfirm={handleDeleteCourse} onClose={() => setCourseToDelete(null)} />}
    </div>
  )
}
