import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import { Lock, Mail, User, Moon, Sun, Eye, EyeOff } from 'lucide-react'

export default function Auth({ onLoginSuccess, isDark, toggleDark }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, username }])
        if (profileError) {
          setMessage({ type: 'error', text: 'Conta criada, mas erro ao salvar perfil: ' + profileError.message })
        } else {
          setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu e-mail para confirmar.' })
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage({ type: 'error', text: error.message })
      else if (data?.user) onLoginSuccess(data.user)
    }
    setLoading(false)
  }

  const inputClass = `w-full pl-10 pr-4 py-[11px] rounded-[10px] text-[13px] outline-none border transition-colors ${
    isDark
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-[#00674F]'
      : 'bg-[#fafcfb] border-[#dde5e0] text-[#1a2e26] placeholder-[#b0bdb7] focus:border-[#00674F]'
  }`

  const labelClass = `block text-[12px] font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-[#4a5e56]'}`

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-4 transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-[#F5F7F6]'}`}>

      {/* dark toggle */}
      <button onClick={toggleDark} title={isDark ? 'Modo claro' : 'Modo escuro'}
        className={`absolute top-4 right-4 p-2 rounded-[10px] transition-colors ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-[#5a6b63] hover:bg-[#f0f5f2]'} border ${isDark ? 'border-gray-700' : 'border-[#dde5e0]'}`}>
        {isDark ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {/* card */}
      <div className={`w-full max-w-md rounded-[20px] overflow-hidden transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#e4e9e6]'} border`}
        style={{ boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,103,79,0.08)' }}>

        {/* top gradient bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg,#00674F,#D3AF37)' }} />

        <div className="p-8">
          {/* logo */}
          <div className="flex flex-col items-center mb-8">
            <svg width="72" height="72" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '12px' }}>
              <path d="M10 6 H36 L46 16 V50 Q46 54 42 54 H10 Q6 54 6 50 V10 Q6 6 10 6 Z" fill="none" stroke="#00674F" strokeWidth="3" strokeLinejoin="round"/>
              <path d="M36 6 L36 16 L46 16" fill="none" stroke="#D3AF37" strokeWidth="3" strokeLinejoin="round"/>
              <path d="M36 6 L46 16" fill="#D3AF37"/>
              <circle cx="16" cy="23" r="2.2" fill="#00674F"/>
              <line x1="21" y1="23" x2="36" y2="23" stroke="#00674F" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="16" cy="31" r="2.2" fill="#00674F"/>
              <line x1="21" y1="31" x2="36" y2="31" stroke="#00674F" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="16" cy="39" r="2.2" fill="#00674F"/>
              <line x1="21" y1="39" x2="33" y2="39" stroke="#00674F" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M18 47 L26 55 L44 36" fill="none" stroke="#D3AF37" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className={`text-[22px] font-medium ${isDark ? 'text-gray-100' : 'text-[#1a2e26]'}`}>UFABC Organizador</h1>
            <p className="text-[13px] mt-1" style={{ color: '#8a9e94' }}>
              {isSignUp ? 'Crie sua conta de estudante' : 'Acesse seu painel acadêmico'}
            </p>
          </div>

          {/* feedback */}
          {message.text && (
            <div className={`px-4 py-3 rounded-[10px] mb-5 text-[13px] font-medium ${
              message.type === 'error'
                ? isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
                : isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* form */}
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {isSignUp && (
              <div>
                <label className={labelClass}>Nome Completo</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8a9e94' }} />
                  <input type="text" required placeholder="Seu nome" value={username}
                    onChange={e => setUsername(e.target.value)} className={inputClass} />
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8a9e94' }} />
                <input type="email" required placeholder="seu.email@aluno.ufabc.edu.br" value={email}
                  onChange={e => setEmail(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8a9e94' }} />
                <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#8a9e94' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-[11px] rounded-[10px] text-white text-[14px] font-medium mt-1 transition-opacity disabled:opacity-50 hover:opacity-88"
              style={{ background: 'linear-gradient(135deg,#00674F,#004d3a)' }}>
              {loading ? 'Carregando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
            </button>
          </form>

          {/* switcher */}
          <div className={`text-center mt-6 pt-5 text-[13px] border-t ${isDark ? 'border-gray-800' : 'border-[#eef2ef]'}`}>
            <span style={{ color: '#8a9e94' }}>
              {isSignUp ? 'Já tem uma conta? ' : 'Novo por aqui? '}
            </span>
            <button onClick={() => { setIsSignUp(p => !p); setMessage({ type: '', text: '' }) }}
              className="font-medium transition-opacity hover:opacity-75"
              style={{ color: '#D3AF37' }}>
              {isSignUp ? 'Faça Login' : 'Cadastre-se gratuito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
