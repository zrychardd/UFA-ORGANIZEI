import React, { useState, useEffect, lazy, Suspense } from 'react'
import { supabase } from './supabaseClient'
import { useServiceWorkerUpdate } from './pwa'

// Cada tela vira um arquivo separado, baixado só quando necessário
// (quem só abre a página inicial não baixa o painel inteiro).
const Auth = lazy(() => import('./Auth'))
const Dashboard = lazy(() => import('./Dashboard'))
const LandingPage = lazy(() => import('./LandingPage'))
const ResetPassword = lazy(() => import('./ResetPassword'))

// Detecta, pela URL, se o usuário chegou pelo link do e-mail "redefinir senha".
// 'ok' = link de recuperação válido; 'error' = link de e-mail expirado/inválido; null = acesso normal
const detectRecoveryFromUrl = () => {
  if (typeof window === 'undefined') return null
  const raw = `${window.location.hash}&${window.location.search}`
  if (/[#&?]type=recovery(&|$)/.test(raw)) return 'ok'
  if (/[#&?]error_code=otp_expired(&|$)/.test(raw)) return 'error'
  return null
}

const cleanAuthParamsFromUrl = () => {
  window.history.replaceState(null, '', window.location.pathname)
}

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7F6] dark:bg-gray-950">
      <div className="w-9 h-9 rounded-full border-[3px] border-[#00674F]/25 border-t-[#00674F] animate-spin" />
    </div>
  )
}

function AppContent() {
  const [session, setSession] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [recovery, setRecovery] = useState(detectRecoveryFromUrl) // null | 'ok' | 'error'

  // Lê a preferência salva no localStorage (ou começa no modo claro)
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('ufabc-theme') === 'dark'
  })

  // Sempre que isDark mudar, aplica/remove a classe `dark` no <html>
  // e salva a preferência para a próxima visita
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('ufabc-theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('ufabc-theme', 'light')
    }
  }, [isDark])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // O Supabase avisa com este evento quando o link de recuperação de senha é aberto
      if (event === 'PASSWORD_RECOVERY') setRecovery('ok')
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const toggleDark = () => setIsDark(prev => !prev)

  const finishRecovery = () => {
    cleanAuthParamsFromUrl()
    setRecovery(null)
  }

  const cancelRecovery = async () => {
    await supabase.auth.signOut()
    cleanAuthParamsFromUrl()
    setRecovery(null)
    setShowAuth(true)
  }

  if (recovery) {
    return (
      <Suspense fallback={<Splash />}>
        <ResetPassword
          session={session}
          invalidLink={recovery === 'error'}
          isDark={isDark}
          toggleDark={toggleDark}
          onDone={finishRecovery}
          onCancel={cancelRecovery}
        />
      </Suspense>
    )
  }

  if (!session && !showAuth) {
    return (
      <Suspense fallback={<Splash />}>
        <LandingPage
          onAccessApp={() => setShowAuth(true)}
        />
      </Suspense>
    )
  }

  if (!session) {
    return (
      <Suspense fallback={<Splash />}>
        <Auth
          onLoginSuccess={() => console.log('Logado!')}
          isDark={isDark}
          toggleDark={toggleDark}
        />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<Splash />}>
      <Dashboard session={session} isDark={isDark} toggleDark={toggleDark} />
    </Suspense>
  )
}

// Aviso discreto quando há uma versão nova do app esperando para ser ativada
function UpdateBanner() {
  const { updateReady, applyUpdate } = useServiceWorkerUpdate()
  if (!updateReady) return null
  return (
    <div
      role="status"
      className="fixed left-1/2 -translate-x-1/2 bottom-20 md:bottom-5 z-[100001] flex items-center gap-3 bg-[#1a2e26] text-white text-xs font-medium pl-4 pr-2 py-2 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.3)]"
    >
      Nova versão disponível
      <button type="button" onClick={applyUpdate} className="bg-[#D3AF37] hover:bg-[#c29f2e] text-[#1a2e26] font-bold px-3.5 py-1.5 rounded-full transition-colors">
        Atualizar
      </button>
    </div>
  )
}

// Mostra uma confirmação depois que o usuário exclui a conta (o painel já foi fechado nesse momento)
function AccountDeletedBanner() {
  const [open, setOpen] = useState(() => sessionStorage.getItem('ufa-account-deleted') === '1')
  if (!open) return null

  const close = () => {
    sessionStorage.removeItem('ufa-account-deleted')
    setOpen(false)
  }

  return (
    <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-[100001] max-w-[calc(100vw-24px)] flex items-center gap-3 bg-white dark:bg-gray-900 text-[#1a2e26] dark:text-gray-100 border border-[#e4e9e6] dark:border-gray-700 text-xs font-medium pl-4 pr-2 py-2 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
      Sua conta e todos os seus dados foram excluídos.
      <button type="button" onClick={close} className="bg-[#00674F] hover:bg-[#005240] text-white font-bold px-3.5 py-1.5 rounded-xl transition-colors">Fechar</button>
    </div>
  )
}

export default function App() {
  return (
    <>
      <AppContent />
      <UpdateBanner />
      <AccountDeletedBanner />
    </>
  )
}
