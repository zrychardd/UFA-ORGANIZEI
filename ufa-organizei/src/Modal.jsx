import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Janela modal usada pelas telas novas. Usa portal para ficar acima do cabeçalho e fora de qualquer
// container com transform (que quebraria o `position: fixed`). Fecha com Esc ou clicando fora.
export default function Modal({ children, onClose, maxWidth = 'max-w-md', labelledBy }) {
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
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
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
