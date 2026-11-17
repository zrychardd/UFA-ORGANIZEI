import dashboardImg from './assets/PrtSc/Dashboard.png'

import React, { useEffect, useRef, useState } from 'react'
import LegalModal from './Legal'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { ArrowRight, CalendarCheck, BookOpen, Newspaper, Flame, Target, CheckSquare, Shield, Zap, Cloud, Lock, ChevronDown, LogIn } from 'lucide-react'
/* ── Logo ───────────────────────────────────────────────── */
function UfaLogo({ className = 'w-10 h-10' }) {
    return (
        <svg className={className} viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 6 H36 L46 16 V50 Q46 54 42 54 H10 Q6 54 6 50 V10 Q6 6 10 6 Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
            <path d="M36 6 L36 16 L46 16" fill="none" stroke="#D3AF37" strokeWidth="3" strokeLinejoin="round" />
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

/* ── Fade-up helper ─────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = '' }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-60px' })
    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 36 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    )
}

/* ── Feature Card ───────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, text, delay }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-40px' })

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(0,103,79,0.10), 0 0 0 1.5px rgba(211,175,55,0.18)' }}
            whileTap={{ scale: 0.98 }}
            className="bg-white border border-[#e8ede9] rounded-2xl p-6 cursor-default transition-colors duration-200"
            style={{ willChange: 'transform' }}
        >
            <div className="w-12 h-12 rounded-2xl bg-[#e8f5ef] text-[#00674F] flex items-center justify-center mb-5">
                <Icon size={22} />
            </div>
            <h3 className="font-bold text-base mb-2 text-[#1a2e26]">{title}</h3>
            <p className="text-sm text-[#5a6b63] leading-relaxed">{text}</p>
            <div className="w-8 h-1 bg-[#D3AF37] rounded-full mt-5" />
        </motion.div>
    )
}

/* ── Main Component ─────────────────────────────────────── */
export default function LandingPage({ onAccessApp }) {
    const [legalDoc, setLegalDoc] = useState(null) // termos/privacidade abertos pelo rodapé
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 24)
        window.addEventListener('scroll', handler, { passive: true })
        return () => window.removeEventListener('scroll', handler)
    }, [])

    const features = [
        { icon: CheckSquare, title: 'Tarefas Inteligentes', text: 'Crie, organize e acompanhe suas tarefas acadêmicas de forma eficiente.' },
        { icon: CalendarCheck, title: 'Agenda Completa', text: 'Visualize seus compromissos e nunca mais perca um prazo importante.' },
        { icon: BookOpen, title: 'Materiais Organizados', text: 'Salve e organize seus materiais de estudo na nuvem com segurança.' },
        { icon: Newspaper, title: 'Notícias Automáticas', text: 'Fique por dentro das atualizações acadêmicas importadas automaticamente.' },
        { icon: Flame, title: 'Streak de Estudos', text: 'Mantenha a consistência e construa hábitos de estudo todos os dias.' },
        { icon: Target, title: 'Metas e Produtividade', text: 'Defina metas semanais e acompanhe seu progresso em tempo real.' },
    ]

    return (
        <div className="min-h-screen bg-white text-[#1a2e26] overflow-x-hidden">

            {/* ── AMBIENT BACKGROUND ORBS ── */}
            <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#e8f5ef] opacity-40 blur-[120px]" />
                <div className="absolute top-[60%] -left-40 w-[500px] h-[500px] rounded-full bg-[#eaf4ee] opacity-30 blur-[100px]" />
                <div className="absolute top-[30%] right-[20%] w-[200px] h-[200px] rounded-full bg-[#D3AF37] opacity-[0.04] blur-[60px]" />
            </div>

            {/* ── NAVBAR ── */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`h-20 sticky top-0 z-50 flex items-center justify-between px-8 lg:px-16 transition-all duration-300 ${scrolled
                    ? 'bg-white/80 backdrop-blur-xl border-b border-[#e8ede9]/60 shadow-[0_1px_24px_rgba(0,0,0,0.05)]'
                    : 'bg-transparent border-b border-transparent'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#e8f5ef] text-[#00674F] flex items-center justify-center">
                        <UfaLogo className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-base font-black leading-none tracking-tight">UFA ORGANIZEI <span className="text-[#D3AF37] text-sm">+</span></h1>
                        <p className="text-[10px] text-[#5a6b63] mt-0.5">Sua vida acadêmica organizada.</p>
                    </div>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#344d43]">
                    <a href="#inicio" className="text-[#00674F] border-b-2 border-[#00674F] pb-0.5 transition-colors">Início</a>
                    <a href="#recursos" className="hover:text-[#00674F] transition-colors">Recursos</a>
                    <a href="#sobre" className="hover:text-[#00674F] transition-colors">Sobre</a>
                </nav>

                <motion.button
                    onClick={onAccessApp}
                    whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(0,103,79,0.25)' }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-[#00674F] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition-colors hover:bg-[#005040]"
                >
                    <LogIn size={16} />
                    Acessar app
                </motion.button>
            </motion.header>

            {/* ── HERO ── */}
            <main id="inicio" className="relative">
                {/* Decoração */}
                <div aria-hidden className="absolute top-0 right-0 w-[340px] h-[340px] rounded-bl-[80px] bg-[#003d2e] pointer-events-none" />
                <div aria-hidden className="absolute bottom-0 right-0 w-[220px] h-[220px] bg-[#e8f5ef] pointer-events-none" />

                <div className="relative z-10 px-8 lg:px-16 pt-16 pb-20 w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-16 items-center">

                    {/* Left column */}
                    <div className="flex flex-col">
                        <motion.span
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e8f5ef] text-[#00674F] text-xs font-bold mb-6 border border-[#c2ddd2] w-fit"
                        >
                            🎓 Feito para estudantes, por estudantes
                        </motion.span>

                        <motion.h2
                            initial={{ opacity: 0, x: -40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-6"
                        >
                            Organize sua vida acadêmica{' '}
                            <span className="relative inline-block">
                                em um só lugar.
                                <motion.span
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 0.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                    className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[#D3AF37] rounded-full origin-left"
                                />
                            </span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="text-base text-[#5a6b63] leading-relaxed max-w-xl mb-8"
                        >
                            Gerencie tarefas, acompanhe sua agenda, salve materiais, fique por dentro das notícias
                            e alcance seus objetivos acadêmicos com o UFA ORGANIZEI.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col sm:flex-row gap-3 mb-8"
                        >
                            <motion.button
                                onClick={onAccessApp}
                                whileHover={{ scale: 1.03, boxShadow: '0 12px 32px rgba(0,103,79,0.28)' }}
                                whileTap={{ scale: 0.97 }}
                                className="bg-[#00674F] text-white px-7 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-colors hover:bg-[#005040]"
                            >
                                Começar agora
                                <ArrowRight size={17} />
                            </motion.button>

                            <motion.a
                                href="#recursos"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="bg-white border border-[#d9e3de] px-7 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#f0f5f2] transition-all text-[#1a2e26]"
                            >
                                Ver recursos
                                <ChevronDown size={16} />
                            </motion.a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.65 }}
                            className="flex flex-wrap gap-5 text-xs text-[#5a6b63]"
                        >
                            {[
                                { icon: Shield, label: 'Seguro' },
                                { icon: Zap, label: 'Rápido' },
                                { icon: Cloud, label: 'Acessível de qualquer lugar' },
                                { icon: Lock, label: 'Seus dados protegidos' },
                            ].map(({ icon: Icon, label }) => (
                                <span key={label} className="flex items-center gap-1.5">
                                    <Icon size={14} className="text-[#00674F]" /> {label}
                                </span>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right column — dashboard mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.75, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="relative z-10"
                    >
                        {/* Floating glow */}
                        <div aria-hidden className="absolute inset-0 -z-10 blur-[60px] opacity-30 bg-[#00674F] rounded-3xl scale-90 translate-y-4" />

                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-full rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.14)] border border-[#e0e7e3] overflow-hidden bg-white"
                        >
                            {/* Browser bar */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-[#f3f6f4] border-b border-[#e0e7e3]">
                                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                                <div className="ml-3 flex-1 bg-white rounded-md px-3 py-1 text-[10px] text-[#9aada5] border border-[#e0e7e3]">
                                    app.ufaorganizei.com.br
                                </div>
                            </div>
                            <img
                                src={dashboardImg}
                                alt="Dashboard UFA Organizei"
                                className="w-full block"
                                loading="eager"
                            />
                        </motion.div>
                    </motion.div>
                </div>
            </main>

            {/* ── RECURSOS ── */}
            <section id="recursos" className="relative px-8 lg:px-16 py-20 bg-[#F5F7F6]">
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full bg-[#e8f5ef] opacity-60 blur-[80px]" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <FadeUp className="text-center mb-14">
                        <span className="inline-block px-4 py-2 rounded-full bg-[#e8f5ef] text-[#00674F] text-xs font-bold mb-4 border border-[#c2ddd2]">
                            🎓 Tudo que você precisa
                        </span>
                        <h2 className="text-3xl font-black text-[#1a2e26]">Recursos que fazem a diferença</h2>
                        <p className="text-[#5a6b63] mt-2 text-sm">Ferramentas completas para otimizar sua rotina acadêmica</p>
                    </FadeUp>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map(({ icon, title, text }, i) => (
                            <FeatureCard
                                key={title}
                                icon={icon}
                                title={title}
                                text={text}
                                delay={i * 0.09}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section id="sobre" className="px-8 lg:px-16 py-16">
                <FadeUp>
                    <div className="max-w-6xl mx-auto bg-[#003d2e] rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                        {/* Subtle inner glow */}
                        <div aria-hidden className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-[#00674F] opacity-20 blur-[80px] pointer-events-none" />

                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-14 h-14 rounded-full bg-[#00674F] flex items-center justify-center shrink-0">
                                <UfaLogo className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white mb-1">Pronto para transformar sua rotina acadêmica?</h2>
                                <p className="text-white/70 text-sm">Junte-se com os estudantes que já organizam seus estudos com o UFA ORGANIZEI.</p>
                            </div>
                        </div>

                        <motion.button
                            onClick={onAccessApp}
                            whileHover={{ scale: 1.04, boxShadow: '0 12px 32px rgba(211,175,55,0.35)' }}
                            whileTap={{ scale: 0.97 }}
                            className="relative z-10 bg-[#D3AF37] text-white px-7 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#b8942a] transition-colors whitespace-nowrap shrink-0"
                        >
                            Acessar app agora
                            <ArrowRight size={17} />
                        </motion.button>
                    </div>
                </FadeUp>
            </section>

            {/* ── FOOTER ── */}
            <footer className="bg-[#003d2e] text-white px-8 lg:px-16 py-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#00674F] flex items-center justify-center">
                            <UfaLogo className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-black text-sm">UFA ORGANIZEI <span className="text-[#D3AF37]">+</span></p>
                            <p className="text-[10px] text-white/60">Sua vida acadêmica organizada.</p>
                        </div>
                    </div>

                    <p className="text-xs text-white/60">© {new Date().getFullYear()} UFA ORGANIZEI. Todos os direitos reservados.</p>

                    <div className="flex items-center gap-4 text-xs text-white/70">
                        <button type="button" onClick={() => setLegalDoc('terms')} className="hover:text-white underline-offset-2 hover:underline transition-colors">Termos de Uso</button>
                        <button type="button" onClick={() => setLegalDoc('privacy')} className="hover:text-white underline-offset-2 hover:underline transition-colors">Privacidade</button>
                    </div>
                </div>
            </footer>

            {legalDoc && <LegalModal initialDoc={legalDoc} onClose={() => setLegalDoc(null)} />}
        </div>
    )
}