import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { UfaLogo } from './Auth'
import { Lock, Eye, EyeOff, Moon, Sun, Check, AlertTriangle, Sparkles } from 'lucide-react'

const MIN_PASSWORD = 6

// Tela exibida quando o usuário clica no link "redefinir senha" recebido por e-mail.
// O Supabase já cria uma sessão temporária a partir do link; aqui só pedimos a nova senha.
export default function ResetPassword({ session, invalidLink = false, isDark, toggleDark, onDone, onCancel }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const [waitedTooLong, setWaitedTooLong] = useState(false)

  // Se o link for inválido/expirado, a sessão nunca chega: depois de alguns segundos mostramos o aviso
  useEffect(() => {
    if (session || invalidLink) return
    const timer = setTimeout(() => setWaitedTooLong(true), 8000)
    return () => clearTimeout(timer)
  }, [session, invalidLink])

  const friendlyError = (errorMessage = '') => {
    const text = errorMessage.toLowerCase()
    if (text.includes('different from the old') || text.includes('same_password')) return 'A nova senha precisa ser diferente da senha atual.'
    if (text.includes('weak') || text.includes('at least')) return `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`
    if (text.includes('session') || text.includes('jwt') || text.includes('expired')) return 'Seu link expirou. Volte ao login e peça um novo link de recuperação.'
    if (text.includes('rate limit')) return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.'
    return 'Não foi possível alterar a senha. Tente novamente.'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (password.length < MIN_PASSWORD) {
      setMessage(`A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`)
      return
    }
    if (password !== confirm) {
      setMessage('As senhas não conferem. Digite a mesma senha nos dois campos.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setMessage(friendlyError(error.message))
        return
      }
      // Por segurança, encerra a sessão de outros dispositivos (falha aqui não impede o fluxo)
      try { await supabase.auth.signOut({ scope: 'others' }) } catch { /* ignora */ }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = `w-full pl-10 pr-10 py-[12px] rounded-xl text-[13px] outline-none border transition-all ${isDark
    ? 'bg-white/10 border-white/15 text-white placeholder-white/35 focus:border-[#D3AF37] focus:bg-white/10'
    : 'bg-white/75 border-[#dbe6e0] text-[#1a2e26] placeholder-[#aebdb6] focus:border-[#00674F] focus:bg-white'
    }`
  const labelClass = `block text-[12px] font-semibold mb-1.5 ${isDark ? 'text-white/80' : 'text-[#344d43]'}`
  const iconColor = isDark ? 'rgba(255,255,255,0.55)' : '#8a9e94'
  const titleColor = isDark ? 'text-white' : 'text-[#1a2e26]'
  const mutedColor = isDark ? 'text-white/60' : 'text-[#8a9e94]'
  const primaryBtn = 'w-full py-[12px] rounded-xl text-white text-[14px] font-semibold mt-1 transition-all disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0 shadow-lg'
  const primaryBg = { background: isDark ? 'linear-gradient(135deg,#00a67d,#00674F)' : 'linear-gradient(135deg,#00674F,#004d3a)' }

  const linkIsBad = invalidLink || (!session && waitedTooLong)

  let body
  if (done) {
    body = (
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#e8f5ef] border border-[#bfe3d3]">
          <Check size={26} className="text-[#00674F]" />
        </div>
        <div>
          <h2 className={`text-[18px] font-bold ${titleColor}`}>Senha alterada!</h2>
          <p className={`text-[13px] mt-1.5 ${mutedColor}`}>Sua nova senha já está valendo. Use-a nos próximos acessos.</p>
        </div>
        <button type="button" onClick={onDone} className={primaryBtn} style={primaryBg}>Entrar no painel</button>
      </div>
    )
  } else if (linkIsBad) {
    body = (
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-red-50 border border-red-100">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <div>
          <h2 className={`text-[18px] font-bold ${titleColor}`}>Link inválido ou expirado</h2>
          <p className={`text-[13px] mt-1.5 ${mutedColor}`}>Esse link de e-mail não vale mais. Volte ao login e, se você estava recuperando a senha, peça um novo em "Esqueceu a senha?".</p>
        </div>
        <button type="button" onClick={onCancel} className={primaryBtn} style={primaryBg}>Voltar ao login</button>
      </div>
    )
  } else if (!session) {
    body = (
      <div className="flex flex-col items-center text-center gap-3 py-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#00674F]/30 border-t-[#00674F] animate-spin" />
        <p className={`text-[13px] ${mutedColor}`}>Validando seu link de recuperação...</p>
      </div>
    )
  } else {
    body = (
      <>
        <div className="text-center mb-6">
          <h2 className={`text-[18px] font-bold ${titleColor}`}>Criar nova senha</h2>
          <p className={`text-[13px] mt-1 ${mutedColor}`}>Escolha uma senha com pelo menos {MIN_PASSWORD} caracteres.</p>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-xl mb-5 text-[13px] font-medium ${isDark ? 'bg-red-500/12 text-red-200 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Nova senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: iconColor }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: iconColor }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Confirmar nova senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: iconColor }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className={primaryBtn} style={primaryBg}>
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>

        <div className={`text-center mt-6 pt-5 text-[13px] border-t ${isDark ? 'border-white/10' : 'border-[#eef2ef]'}`}>
          <button type="button" onClick={onCancel} className="font-semibold transition-opacity hover:opacity-75" style={{ color: '#D3AF37' }}>
            Cancelar e voltar ao login
          </button>
        </div>
      </>
    )
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#002b22]' : 'bg-[#F5F7F6]'}`}>
      <div className={`absolute inset-0 ${isDark
        ? 'bg-[radial-gradient(circle_at_20%_15%,rgba(0,103,79,0.85),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(211,175,55,0.14),transparent_30%),linear-gradient(135deg,#001f19_0%,#003d2e_48%,#00674F_100%)]'
        : 'bg-[radial-gradient(circle_at_18%_15%,rgba(0,103,79,0.09),transparent_30%),radial-gradient(circle_at_85%_28%,rgba(211,175,55,0.13),transparent_28%),linear-gradient(135deg,#ffffff_0%,#F5F7F6_55%,#edf5f1_100%)]'
        }`} />

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

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div
          className={`w-full max-w-[430px] rounded-[22px] overflow-hidden border transition-all ${isDark ? 'bg-[#003d2e]/70 border-white/15 backdrop-blur-xl' : 'bg-white border-white/80 backdrop-blur-xl'}`}
          style={{ boxShadow: isDark ? '0 28px 90px rgba(0,0,0,0.38)' : '0 28px 90px rgba(0,103,79,0.13)' }}
        >
          <div className="h-1" style={{ background: 'linear-gradient(90deg,#00674F,#D3AF37)' }} />
          <div className="p-8 sm:p-9">
            <div className="flex flex-col items-center mb-6">
              <div className={`w-[64px] h-[64px] rounded-2xl flex items-center justify-center mb-3 ${isDark ? 'bg-white/10 text-white' : 'bg-[#e8f5ef] text-[#00674F]'}`}>
                <UfaLogo className="w-11 h-11" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className={`text-[20px] font-bold tracking-tight ${titleColor}`}>UFA ORGANIZEI</h1>
                <Sparkles size={15} className="text-[#D3AF37]" />
              </div>
            </div>
            {body}
          </div>
        </div>
      </main>
    </div>
  )
}
