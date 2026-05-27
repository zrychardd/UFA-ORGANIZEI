import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import { GraduationCap, Lock, Mail, User } from 'lucide-react'

export default function Auth({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')          // ✅ Corrigido: era useState(false)
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, username: username }])

        if (profileError) {
          setMessage({ type: 'error', text: 'Conta criada, mas erro ao salvar perfil: ' + profileError.message })
        } else {
          setMessage({ type: 'success', text: 'Cadastro realizado com sucesso! Verifique seu e-mail para confirmar.' })
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else if (data?.user) {
        onLoginSuccess(data.user)
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border-t-4 border-ufabc-verde">

        {/* Cabeçalho / Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-ufabc-verde/10 rounded-full text-ufabc-verde mb-3">
            <GraduationCap size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">UFABC Organizador</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isSignUp ? 'Crie sua conta de estudante' : 'Acesse seu painel acadêmico'}
          </p>
        </div>

        {/* Mensagens de Feedback */}
        {message.text && (
          <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
            {message.text}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ufabc-verde focus:border-transparent outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                placeholder="seu.email@aluno.ufabc.edu.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ufabc-verde focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ufabc-verde focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ufabc-verde hover:bg-ufabc-verde/80 text-white font-semibold py-2 rounded-lg transition shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? 'Carregando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        {/* Alternador de abas */}
        <div className="text-center mt-6 pt-4 border-t border-gray-100 text-sm">
          <span className="text-gray-500">
            {isSignUp ? 'Já tem uma conta?' : 'Novo por aqui?'}
          </span>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setMessage({ type: '', text: '' })
            }}
            className="text-ufabc-dourado hover:text-ufabc-dourado/80 font-semibold ml-1 transition"
          >
            {isSignUp ? 'Faça Login' : 'Cadastre-se gratuito'}
          </button>
        </div>

      </div>
    </div>
  )
}
