import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './pwa'

// Se uma versão nova do site foi publicada enquanto a aba estava aberta, os arquivos antigos
// deixam de existir no servidor. Nesse caso recarrega uma vez para pegar a versão atual.
window.addEventListener('vite:preloadError', () => {
  const last = Number(sessionStorage.getItem('ufa-preload-reload') || 0)
  if (Date.now() - last > 10000) {
    sessionStorage.setItem('ufa-preload-reload', String(Date.now()))
    window.location.reload()
  }
})

registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
