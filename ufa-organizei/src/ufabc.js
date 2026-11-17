// Regras acadêmicas da UFABC usadas na aba Disciplinas.
// Fonte: documentos da PROGRAD (CR/CA e conceitos) e planos de ensino (frequência mínima de 75%).
// Créditos de uma disciplina = T + P (+ E nas que têm extensão). Disciplinas aproveitadas/equivalentes (E) não entram.
// São ESTIMATIVAS feitas com o que o aluno informa; o valor oficial é o do portal do aluno.

export const CONCEPTS = ['A', 'B', 'C', 'D', 'F', 'O']

// Valor numérico de cada conceito no cálculo do CR e do CA
export const CONCEPT_VALUE = { A: 4, B: 3, C: 2, D: 1, F: 0, O: 0 }

export const CONCEPT_LABEL = {
  A: 'A · Excepcional',
  B: 'B · Bom',
  C: 'C · Satisfatório',
  D: 'D · Insuficiente (aprovado)',
  F: 'F · Reprovado',
  O: 'O · Reprovado por frequência',
}

export const isApproved = (letter) => ['A', 'B', 'C', 'D'].includes(letter)

// ---------- Frequência ----------
export const HOURS_PER_CREDIT = 12      // 1 crédito = 12 horas-aula no quadrimestre
export const MAX_ABSENCE_RATIO = 0.25   // frequência mínima de 75%

export const defaultWorkload = (credits) => Math.max(1, Math.round((Number(credits) || 0) * HOURS_PER_CREDIT))
export const maxAbsences = (workloadHours) => Math.floor((Number(workloadHours) || 0) * MAX_ABSENCE_RATIO)

// level: ok | warn (perto do limite) | danger (no limite: mais uma falta reprova) | failed (já passou do limite)
export function absenceStatus(absences, workloadHours) {
  const max = maxAbsences(workloadHours)
  const used = Math.max(0, Number(absences) || 0)
  const remaining = max - used
  let level = 'ok'
  if (used > max) level = 'failed'
  else if (remaining === 0) level = 'danger'
  else if (max > 0 && used / max >= 0.7) level = 'warn'
  return { max, used, remaining, level, ratio: max > 0 ? Math.min(1, used / max) : used > 0 ? 1 : 0 }
}

// ---------- Coeficientes ----------
// Identifica "a mesma disciplina" em quadrimestres diferentes: pelo código ou, sem código, pelo nome
const normalizeText = (text = '') => text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ')
export const courseKey = (course) => (course.code && course.code.trim() ? `code:${course.code.trim().toUpperCase()}` : `name:${normalizeText(course.name)}`)

const letterOf = (course, overrides) => (overrides && overrides[course.id]) || course.grade_letter
const counts = (course, overrides) => CONCEPT_VALUE[letterOf(course, overrides)] !== undefined && Number(course.credits) > 0

function weightedMean(list, overrides) {
  let points = 0
  let credits = 0
  list.forEach((course) => {
    points += Number(course.credits) * CONCEPT_VALUE[letterOf(course, overrides)]
    credits += Number(course.credits)
  })
  return credits > 0 ? points / credits : null
}

// CR: média dos conceitos de TODAS as disciplinas cursadas (inclusive reprovadas e refeitas), ponderada pelos créditos
export function calcCR(courses, overrides) {
  return weightedMean(courses.filter((course) => counts(course, overrides)), overrides)
}

// CA: igual ao CR, mas nas disciplinas refeitas só entra a tentativa de maior conceito
export function calcCA(courses, overrides) {
  const best = new Map()
  courses.filter((course) => counts(course, overrides)).forEach((course) => {
    const key = courseKey(course)
    const current = best.get(key)
    if (!current || CONCEPT_VALUE[letterOf(course, overrides)] > CONCEPT_VALUE[letterOf(current, overrides)]) best.set(key, course)
  })
  return weightedMean([...best.values()], overrides)
}

// Créditos já aprovados (cada disciplina conta uma vez, mesmo que tenha sido refeita)
export function approvedCredits(courses) {
  const approved = new Map()
  courses.forEach((course) => {
    if (isApproved(course.grade_letter)) approved.set(courseKey(course), Number(course.credits) || 0)
  })
  return [...approved.values()].reduce((sum, credits) => sum + credits, 0)
}

export const formatCoef = (value) => (value === null || value === undefined ? '--' : value.toFixed(2).replace('.', ','))

// ---------- Notas parciais ----------
export function partialAverage(grades) {
  const valid = grades.filter((grade) => Number(grade.weight) > 0)
  const scored = valid.filter((grade) => grade.score !== null && grade.score !== undefined && grade.score !== '')
  const weightDone = scored.reduce((sum, grade) => sum + Number(grade.weight), 0)
  const weightTotal = valid.reduce((sum, grade) => sum + Number(grade.weight), 0)
  const average = weightDone > 0 ? scored.reduce((sum, grade) => sum + Number(grade.score) * Number(grade.weight), 0) / weightDone : null
  return { average, weightDone, weightTotal }
}

// ---------- Quadrimestres ----------
// Aproximação do calendário: 1º (fev-mai), 2º (jun-set), 3º (out-jan). O aluno pode escolher outro.
export function currentTermLabel(date = new Date()) {
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  if (month >= 2 && month <= 5) return `${year}.1`
  if (month >= 6 && month <= 9) return `${year}.2`
  return `${month === 1 ? year - 1 : year}.3`
}

export const isValidTerm = (term) => /^\d{4}\.[123]$/.test(term)

export const termDisplay = (term) => {
  const [year, quad] = term.split('.')
  return `${quad}º quadrimestre de ${year}`
}
