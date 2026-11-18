import { useState, useEffect } from 'react'
import { ShieldCheck, RefreshCw, Trash2, Check, Flag } from 'lucide-react'
import { supabase } from './supabaseClient'
import { ConfirmDialog, REPORT_REASONS } from './Dialogs'

const cardCls = 'bg-white dark:bg-gray-900 border border-[#e4e9e6] dark:border-gray-800 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
const REASON_LABEL = Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label]))

const formatDateTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// ["spam","spam","ofensivo"] -> [{ reason: "spam", count: 2 }, { reason: "ofensivo", count: 1 }]
const countReasons = (reasons = []) => {
  const counts = {}
  reasons.forEach((reason) => { counts[reason] = (counts[reason] || 0) + 1 })
  return Object.entries(counts).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count)
}

// Tela de moderação: só aparece para quem está na tabela "admins". As ações passam por funções do banco
// que conferem de novo se a pessoa é administradora.
export default function Moderation({ showNotification, onPostDeleted }) {
  const notify = (message, type = 'error', title = '') => showNotification?.(message, type, title)

  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({ key: null, status: 'loading', items: [] })
  const [toDelete, setToDelete] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const loading = state.key !== reloadKey

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.rpc('admin_list_reports')
      if (cancelled) return
      if (error) {
        console.error('Erro ao carregar denúncias:', error)
        const status = error.code === 'PGRST202' ? 'missing' : error.code === '42501' ? 'denied' : 'error'
        setState({ key: reloadKey, status, items: [] })
        return
      }
      setState({ key: reloadKey, status: 'ready', items: data || [] })
    })()
    return () => { cancelled = true }
  }, [reloadKey])

  const refresh = () => setReloadKey((k) => k + 1)
  const removeLocal = (postId) => setState((s) => ({ ...s, items: s.items.filter((item) => item.post_id !== postId) }))

  const dismiss = async (item) => {
    setBusyId(item.post_id)
    const { error } = await supabase.rpc('admin_dismiss_reports', { p_post_id: item.post_id })
    setBusyId(null)
    if (error) { console.error(error); notify('Não foi possível concluir a ação. Tente novamente.'); return }
    removeLocal(item.post_id)
  }

  const confirmDelete = async () => {
    const item = toDelete
    if (!item) return
    setBusyId(item.post_id)
    const { error } = await supabase.rpc('admin_delete_post', { p_post_id: item.post_id })
    setBusyId(null)
    setToDelete(null)
    if (error) { console.error(error); notify('Não foi possível excluir a publicação. Tente novamente.'); return }
    removeLocal(item.post_id)
    onPostDeleted?.()
  }

  return (
    <div className="space-y-5">
      <div className={`${cardCls} p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#e8f5ef] flex items-center justify-center shrink-0"><ShieldCheck size={22} className="text-[#00674F]" /></div>
          <div>
            <h2 className="text-[17px] font-bold text-[#1a2e26] dark:text-gray-100">Moderação</h2>
            <p className="text-[12px] text-[#8a9e94] dark:text-gray-400 mt-0.5">Denúncias pendentes do Feed. Só administradores veem esta tela.</p>
          </div>
        </div>
        <button type="button" onClick={refresh} className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#00674F] border border-[#e4e9e6] dark:border-gray-700 rounded-xl px-4 py-2.5 hover:bg-[#f0f5f2] dark:hover:bg-gray-800 transition-colors">
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      {loading && <div className="h-40 rounded-2xl bg-white dark:bg-gray-900 border border-[#e4e9e6] dark:border-gray-800 animate-pulse" />}

      {!loading && state.status === 'missing' && (
        <div className="border border-dashed border-[#f2e2b0] bg-[#fdf5e0]/60 dark:bg-gray-800 dark:border-gray-700 rounded-2xl p-6 text-center">
          <p className="text-[13px] font-bold text-[#1a2e26] dark:text-gray-100">A moderação ainda não foi liberada no Supabase</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Rode o arquivo <b>supabase-moderacao.sql</b> no SQL Editor e depois clique em Atualizar.</p>
        </div>
      )}

      {!loading && state.status === 'denied' && (
        <div className="border border-dashed border-red-100 dark:border-gray-700 rounded-2xl p-6 text-center">
          <p className="text-[13px] font-bold text-[#1a2e26] dark:text-gray-100">Acesso negado</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Sua conta não está na lista de administradores.</p>
        </div>
      )}

      {!loading && state.status === 'error' && (
        <div className="border border-dashed border-red-100 dark:border-gray-700 rounded-2xl p-6 text-center">
          <p className="text-[13px] font-bold text-[#1a2e26] dark:text-gray-100">Não foi possível carregar as denúncias</p>
          <button type="button" onClick={refresh} className="mt-3 px-4 py-2 bg-[#00674F] hover:bg-[#005240] text-white rounded-xl text-xs font-bold transition-colors">Tentar de novo</button>
        </div>
      )}

      {!loading && state.status === 'ready' && state.items.length === 0 && (
        <div className={`${cardCls} p-10 text-center`}>
          <div className="w-12 h-12 rounded-2xl bg-[#e8f5ef] flex items-center justify-center mx-auto mb-3"><Check size={22} className="text-[#00674F]" /></div>
          <p className="text-[14px] font-bold text-[#1a2e26] dark:text-gray-100">Nenhuma denúncia pendente</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Quando alguém denunciar uma publicação, ela aparece aqui.</p>
        </div>
      )}

      {!loading && state.status === 'ready' && state.items.length > 0 && (
        <>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 px-1">{state.items.length} {state.items.length === 1 ? 'publicação aguardando' : 'publicações aguardando'} análise, as mais denunciadas primeiro.</p>
          <div className="space-y-4">
            {state.items.map((item) => (
              <article key={item.post_id} className={`${cardCls} p-5`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#1a2e26] dark:text-gray-100 truncate">{item.author_name}</p>
                    <p className="text-[11px] text-gray-400">Publicado em {formatDateTime(item.post_created_at)}</p>
                  </div>
                  <span className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 rounded-lg px-2.5 py-1">
                    <Flag size={12} /> {item.report_count} {Number(item.report_count) === 1 ? 'denúncia' : 'denúncias'}
                  </span>
                </div>

                <p className="text-sm text-[#3d4f47] dark:text-gray-200 bg-[#fafcfb] dark:bg-gray-800 border border-[#e8ede9] dark:border-gray-700 rounded-xl px-4 py-3 whitespace-pre-wrap break-words">{item.content}</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {countReasons(item.reasons).map(({ reason, count }) => (
                    <span key={reason} className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1">
                      {REASON_LABEL[reason] || reason} · {count}
                    </span>
                  ))}
                </div>

                {item.details?.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {item.details.slice(0, 3).map((detail, i) => (
                      <li key={i} className="text-xs text-gray-500 dark:text-gray-400 italic break-words">“{detail}”</li>
                    ))}
                    {item.details.length > 3 && <li className="text-[11px] text-gray-400">e mais {item.details.length - 3}</li>}
                  </ul>
                )}

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4 pt-4 border-t border-[#eef2ef] dark:border-gray-800">
                  <button type="button" onClick={() => dismiss(item)} disabled={busyId === item.post_id} className="px-4 py-2 border border-[#e4e9e6] dark:border-gray-700 rounded-xl text-xs font-bold text-[#00674F] hover:bg-[#f0f5f2] dark:hover:bg-gray-800 disabled:opacity-50 transition-colors">
                    Manter publicação
                  </button>
                  <button type="button" onClick={() => setToDelete(item)} disabled={busyId === item.post_id} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors">
                    <Trash2 size={13} /> Excluir publicação
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Excluir esta publicação?"
          message="Ela some do Feed para todos, junto com as curtidas, os comentários e as denúncias. Não dá para desfazer."
          confirmLabel="Excluir"
          danger
          loading={busyId === toDelete.post_id}
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
