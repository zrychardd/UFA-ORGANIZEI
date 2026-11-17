import { useEffect, useState, useCallback } from 'react'

// ==================== INSTALAÇÃO ("Adicionar à tela inicial") ====================
// O navegador dispara `beforeinstallprompt` cedo, antes de a tela do painel existir.
// Por isso o evento é guardado aqui, no carregamento do arquivo, e os componentes só consultam.
let deferredInstallPrompt = null
const INSTALL_EVENT = 'ufa:install-state'

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredInstallPrompt = event
    window.dispatchEvent(new Event(INSTALL_EVENT))
  })
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
    window.dispatchEvent(new Event(INSTALL_EVENT))
  })
}

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)

const isIOSDevice = () =>
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

export function useInstallApp() {
  const [, refresh] = useState(0)

  useEffect(() => {
    const onChange = () => refresh((n) => n + 1)
    window.addEventListener(INSTALL_EVENT, onChange)
    return () => window.removeEventListener(INSTALL_EVENT, onChange)
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredInstallPrompt) return 'unavailable'
    deferredInstallPrompt.prompt()
    const { outcome } = await deferredInstallPrompt.userChoice
    deferredInstallPrompt = null
    window.dispatchEvent(new Event(INSTALL_EVENT))
    return outcome // 'accepted' | 'dismissed'
  }, [])

  const standalone = isStandalone()
  return {
    canInstall: Boolean(deferredInstallPrompt) && !standalone, // Android/Chrome/Edge: abre o diálogo nativo
    showIOSHint: isIOSDevice() && !standalone,                  // iPhone/iPad: precisa do passo manual
    standalone,
    promptInstall,
  }
}

// ==================== ATUALIZAÇÃO DO APP ====================
const UPDATE_EVENT = 'ufa:sw-update'
let waitingWorker = null

export function registerServiceWorker() {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

  // Só recarrega quando uma versão NOVA assume (não na primeira instalação)
  const hadController = Boolean(navigator.serviceWorker.controller)
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    reloading = true
    window.location.reload()
  })

  const announce = (worker) => {
    waitingWorker = worker
    window.dispatchEvent(new Event(UPDATE_EVENT))
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')

      if (registration.waiting && navigator.serviceWorker.controller) announce(registration.waiting)

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) announce(worker)
        })
      })

      // Procura versão nova a cada hora e sempre que o usuário volta para a aba
      setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {})
      })
    } catch (error) {
      console.warn('Service worker não registrado:', error)
    }
  })
}

export function useServiceWorkerUpdate() {
  const [updateReady, setUpdateReady] = useState(Boolean(waitingWorker))

  useEffect(() => {
    const onUpdate = () => setUpdateReady(true)
    window.addEventListener(UPDATE_EVENT, onUpdate)
    return () => window.removeEventListener(UPDATE_EVENT, onUpdate)
  }, [])

  const applyUpdate = useCallback(() => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' })
  }, [])

  return { updateReady, applyUpdate }
}
