import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import {
  Lock,
  Mail,
  User,
  Moon,
  Sun,
  Eye,
  EyeOff,
  CalendarCheck,
  BarChart3,
  Bell,
  Sparkles
} from 'lucide-react'

function UfaLogo({ className = 'w-16 h-16' }) {
  return (
    <svg className={className} viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 6 H36 L46 16 V50 Q46 54 42 54 H10 Q6 54 6 50 V10 Q6 6 10 6 Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M36 6 L36 16 L46 16" fill="none" stroke="#D3AF37" strokeWidth="3" strokeLinejoin="round" />
      <path d="M36 6 L46 16" fill="#D3AF37" />
      <circle cx="16" cy="23" r="2.2" fill="currentColor" />
      <line x1="21" y1="23" x2="36" y2="23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="31" r="2.2" fill="currentColor" />
      <line x1="21" y1="31" x2="36" y2="31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="39" r="2.2" fill="currentColor" />
      <line x1="21" y1="39" x2="33" y2="39" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 47 L26 55 L44 36" fill="none" stroke="#D3AF37" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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

  const inputClass = `w-full pl-10 pr-4 py-[12px] rounded-xl text-[13px] outline-none border transition-all ${isDark
    ? 'bg-white/10 border-white/15 text-white placeholder-white/35 focus:border-[#D3AF37] focus:bg-white/10'
    : 'bg-white/75 border-[#dbe6e0] text-[#1a2e26] placeholder-[#aebdb6] focus:border-[#00674F] focus:bg-white'
    }`

  const labelClass = `block text-[12px] font-semibold mb-1.5 ${isDark ? 'text-white/80' : 'text-[#344d43]'}`

  const features = [
    { icon: CalendarCheck, title: 'Organização', text: 'Gerencie tarefas e compromissos' },
    { icon: BarChart3, title: 'Produtividade', text: 'Acompanhe seu progresso diário' },
    { icon: Bell, title: 'Lembretes', text: 'Receba avisos e não perca prazos' }
  ]

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#002b22]' : 'bg-[#F5F7F6]'}`}>
      {/* Fundo premium */}
      <div className={`absolute inset-0 ${isDark
        ? 'bg-[radial-gradient(circle_at_20%_15%,rgba(0,103,79,0.85),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(211,175,55,0.14),transparent_30%),linear-gradient(135deg,#001f19_0%,#003d2e_48%,#00674F_100%)]'
        : 'bg-[radial-gradient(circle_at_18%_15%,rgba(0,103,79,0.09),transparent_30%),radial-gradient(circle_at_85%_28%,rgba(211,175,55,0.13),transparent_28%),linear-gradient(135deg,#ffffff_0%,#F5F7F6_55%,#edf5f1_100%)]'
        }`} />
      <div className={`absolute inset-0 pointer-events-none ${isDark
        ? 'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40'
        : 'bg-[radial-gradient(circle_at_center,rgba(0,103,79,0.08)_1px,transparent_1px)] bg-[size:28px_28px] opacity-45'
        }`} />
      <div className="absolute -left-32 top-36 w-80 h-80 rounded-full border border-[#00674F]/20 pointer-events-none" />
      <div className="absolute -right-28 top-28 w-96 h-96 rounded-full border border-[#D3AF37]/25 pointer-events-none" />
      <div className={`absolute bottom-0 left-0 right-0 h-[42%] pointer-events-none ${isDark
        ? 'bg-gradient-to-t from-black/30 via-black/10 to-transparent'
        : 'bg-gradient-to-t from-white/70 via-white/25 to-transparent'
        }`} />

      {/* Botão Dark */}
      <button
        onClick={toggleDark}
        title={isDark ? 'Modo claro' : 'Modo escuro'}
        className={`absolute top-5 right-5 z-20 p-3 rounded-xl transition-all border shadow-sm ${isDark
          ? 'bg-white/10 text-white hover:bg-white/15 border-white/15 backdrop-blur-md'
          : 'bg-white text-[#00674F] hover:bg-[#f0f5f2] border-[#dde5e0]'
          }`}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Marca no topo */}
      <div className="absolute top-8 left-8 z-10 hidden sm:flex items-center gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isDark ? 'bg-white/10 border-white/15 text-white backdrop-blur-md' : 'bg-white/100 border-white text-[#00674F]'}`}>
          <UfaLogo className="w-8 h-8" />
        </div>
        <div>
          <h2 className={`text-xl font-bold leading-none ${isDark ? 'text-white' : 'text-[#1a2e26]'}`}>UFA ORGANIZEI</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-white/75' : 'text-[#446057]'}`}>Organize suas tarefas e alcance seus objetivos.</p>
        </div>
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-24">
        {/* Card central */}
        <div
          className={`w-full max-w-[430px] rounded-[22px] overflow-hidden border transition-all ${isDark
            ? 'bg-[#003d2e]/70 border-white/15 backdrop-blur-xl'
            : 'bg-white/108 border-white/80 backdrop-blur-xl'
            }`}
          style={{ boxShadow: isDark ? '0 28px 90px rgba(0,0,0,0.38)' : '0 28px 90px rgba(0,103,79,0.13)' }}
        >
          <div className="h-1" style={{ background: 'linear-gradient(90deg,#00674F,#D3AF37)' }} />

          <div className="p-8 sm:p-9">
            <div className="flex flex-col items-center mb-7">
              <div className={`w-[76px] h-[76px] rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/10 text-white' : 'bg-[#e8f5ef] text-[#00674F]'}`}>
                <UfaLogo className="w-14 h-14" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className={`text-[22px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1a2e26]'}`}>UFA ORGANIZEI</h1>
                <Sparkles size={16} className="text-[#D3AF37]" />
              </div>
              <p className={`text-[13px] mt-1 ${isDark ? 'text-white/60' : 'text-[#8a9e94]'}`}>
                {isSignUp ? 'Crie sua conta acadêmica' : 'Acesse seu painel acadêmico'}
              </p>
            </div>

            {message.text && (
              <div className={`px-4 py-3 rounded-xl mb-5 text-[13px] font-medium ${message.type === 'error'
                ? isDark ? 'bg-red-500/12 text-red-200 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-100'
                : isDark ? 'bg-emerald-500/12 text-emerald-200 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              {isSignUp && (
                <div>
                  <label className={labelClass}>Nome completo</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? 'rgba(255,255,255,0.55)' : '#8a9e94' }} />
                    <input
                      type="text"
                      required
                      placeholder="Seu nome"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>E-mail</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? 'rgba(255,255,255,0.55)' : '#8a9e94' }} />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@aluno.ufaorganizei.edu.br"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? 'rgba(255,255,255,0.55)' : '#8a9e94' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: isDark ? 'rgba(255,255,255,0.55)' : '#8a9e94' }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-[12px] rounded-xl text-white text-[14px] font-semibold mt-1 transition-all disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0 shadow-lg"
                style={{ background: isDark ? 'linear-gradient(135deg,#00a67d,#00674F)' : 'linear-gradient(135deg,#00674F,#004d3a)' }}
              >
                {loading ? 'Carregando...' : isSignUp ? 'Criar conta' : 'Entrar'}
              </button>
            </form>

            <div className={`text-center mt-6 pt-5 text-[13px] border-t ${isDark ? 'border-white/10' : 'border-[#eef2ef]'}`}>
              <span className={isDark ? 'text-white/55' : 'text-[#8a9e94]'}>
                {isSignUp ? 'Já tem uma conta? ' : 'Novo por aqui? '}
              </span>
              <button
                onClick={() => { setIsSignUp(p => !p); setMessage({ type: '', text: '' }) }}
                className="font-semibold transition-opacity hover:opacity-75"
                style={{ color: '#D3AF37' }}
              >
                {isSignUp ? 'Faça login' : 'Cadastre-se gratuito'}
              </button>
            </div>
          </div>
        </div>

        {/* Benefícios inferiores */}
        <div className={`mt-7 w-full max-w-[760px] grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border p-3 backdrop-blur-xl ${isDark ? 'bg-white/10 border-white/12' : 'bg-white/100 border-white/80 shadow-sm'}`}>
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDark ? 'text-white' : 'text-[#1a2e26]'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-white/10 text-[#D3AF37]' : 'bg-[#e8f5ef] text-[#00674F]'}`}>
                <Icon size={19} />
              </div>
              <div>
                <p className="text-[12px] font-bold">{title}</p>
                <p className={`text-[11px] leading-snug ${isDark ? 'text-white/55' : 'text-[#6b7f76]'}`}>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
