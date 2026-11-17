import { useState } from 'react'
import { Trash2, AlertTriangle, Flag, X } from 'lucide-react'
import Modal from './Modal'

const btnCancel = 'flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'

// Confirmação simples (ex.: "Sair dos outros dispositivos?")
export function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false, loading = false, onConfirm, onClose }) {
  return (
    <Modal onClose={onClose} maxWidth="max-w-sm" labelledBy="confirm-title">
      <div className="flex flex-col items-center text-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${danger ? 'bg-red-50 border-red-100' : 'bg-[#fdf5e0] border-[#f2e2b0]'}`}>
          <AlertTriangle size={20} className={danger ? 'text-red-500' : 'text-[#b8942a]'} />
        </div>
        <div>
          <h3 id="confirm-title" className="text-[15px] font-bold text-[#1a2e26] dark:text-gray-100">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{message}</p>
        </div>
        <div className="flex gap-2 w-full mt-1">
          <button type="button" onClick={onClose} className={btnCancel}>Cancelar</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60 ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#00674F] hover:bg-[#005240]'}`}
          >
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Exclusão de conta: exige digitar EXCLUIR para evitar clique por engano
export const DELETE_WORD = 'EXCLUIR'

export function DeleteAccountDialog({ email, loading = false, onConfirm, onClose }) {
  const [typed, setTyped] = useState('')
  const ready = typed.trim().toUpperCase() === DELETE_WORD

  return (
    <Modal onClose={onClose} maxWidth="max-w-sm" labelledBy="delete-account-title">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-50 border border-red-100">
            <Trash2 size={20} className="text-red-500" />
          </div>
          <div>
            <h3 id="delete-account-title" className="text-[15px] font-bold text-[#1a2e26] dark:text-gray-100">Excluir sua conta?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              Isso apaga para sempre a conta {email ? <b>{email}</b> : 'e'} todos os seus dados: tarefas, eventos, hábitos, disciplinas, materiais e publicações. Não dá para desfazer.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="delete-confirm" className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
            Para confirmar, digite <b>{DELETE_WORD}</b>
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoFocus
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:border-red-400"
          />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={btnCancel}>Cancelar</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!ready || loading}
            className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors"
          >
            {loading ? 'Excluindo...' : 'Excluir conta'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Denúncia de publicação do Feed
export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam ou propaganda' },
  { value: 'ofensivo', label: 'Ofensivo ou discriminatório' },
  { value: 'falso', label: 'Informação falsa ou enganosa' },
  { value: 'outro', label: 'Outro motivo' },
]

export function ReportPostDialog({ post, loading = false, onSubmit, onClose }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')

  return (
    <Modal onClose={onClose} maxWidth="max-w-sm" labelledBy="report-title">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center"><Flag size={16} className="text-red-500" /></div>
          <div>
            <h3 id="report-title" className="text-sm font-bold text-gray-800 dark:text-gray-100">Denunciar publicação</h3>
            <p className="text-[11px] text-gray-400">Só nós vemos sua denúncia.</p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={16} /></button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 bg-[#fafcfb] dark:bg-gray-800 border border-[#e8ede9] dark:border-gray-700 rounded-xl px-3 py-2 mb-4 line-clamp-3 break-words">{post.content}</p>

      <fieldset className="space-y-2 mb-4">
        <legend className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Qual é o problema?</legend>
        {REPORT_REASONS.map((item) => (
          <label key={item.value} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer text-xs transition-colors ${reason === item.value ? 'border-[#00674F] bg-[#e8f5ef] dark:bg-[#0f2c22] text-[#00674F] font-semibold' : 'border-[#e4e9e6] dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
            <input type="radio" name="report-reason" value={item.value} checked={reason === item.value} onChange={() => setReason(item.value)} className="accent-[#00674F]" />
            {item.label}
          </label>
        ))}
      </fieldset>

      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Quer explicar melhor? (opcional)"
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:border-[#00674F] resize-none mb-4"
      />

      <div className="flex gap-2">
        <button type="button" onClick={onClose} className={btnCancel}>Cancelar</button>
        <button
          type="button"
          onClick={() => onSubmit({ reason, details: details.trim() })}
          disabled={!reason || loading}
          className="flex-1 px-4 py-2.5 bg-[#00674F] hover:bg-[#005240] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors"
        >
          {loading ? 'Enviando...' : 'Enviar denúncia'}
        </button>
      </div>
    </Modal>
  )
}
