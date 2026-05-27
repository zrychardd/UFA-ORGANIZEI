import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Dashboard from './Dashboard'

export default function App() {
  const [session, setSession] = useState(null)

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const toggleDark = () => setIsDark(prev => !prev)

  if (!session) {
    return <Auth onLoginSuccess={(user) => console.log('Logado!')} isDark={isDark} toggleDark={toggleDark} />
  }

  return <Dashboard session={session} isDark={isDark} toggleDark={toggleDark} />
}
