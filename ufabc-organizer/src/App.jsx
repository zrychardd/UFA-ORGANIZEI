import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'

export default function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Verifica se já existe uma sessão ativa ao carregar a página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Escuta mudanças no estado de autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Se não estiver logado, exibe a tela de autenticação
  if (!session) {
    return <Auth onLoginSuccess={(user) => console.log('Logado como:', user)} />
  }

  // Se estiver logado, exibe temporariamente esta mensagem (vamos construir o painel principal na Fase 4)
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center font-sans">
      <div className="bg-white p-6 rounded-xl shadow-md text-center max-w-sm">
        <h2 className="text-2xl font-bold text-ufabcVerde mb-2">🎉 Você está logado!</h2>
        <p className="text-gray-600 mb-4">Olá, {session.user.email}. O motor e a autenticação estão funcionando.</p>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="bg-ufabc-dourado hover:bg-[#bda032] text-white px-4 py-2 rounded-lg font-semibold transition"
        >
          Sair do Aplicativo
        </button>
      </div>
    </div>
  )
}