import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
  Plus, CheckCircle, Circle, Trash2, LogOut, Calendar,
  ListTodo, Home, Megaphone, LayoutGrid, BarChart, Settings,
  ChevronLeft, ChevronDown, Check, Bell, Award, Flame, MapPin,
  Clock, Camera, ToggleRight, Search, Send
} from 'lucide-react'

export default function Dashboard({ session }) {
  // Estado de Navigation das Abas
  const [activeTab, setActiveTab] = useState('inicio')

  // Estados das Tarefas
  const [tasks, setTasks] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')

  // Estados do Feed Coletivo
  const [posts, setPosts] = useState([])
  const [newPostContent, setNewPostContent] = useState('')

  // Estados da Agenda
  const [events, setEvents] = useState([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDate, setNewEventDate] = useState('2024-05-01')
  const [newEventTime, setNewEventTime] = useState('')
  const [newEventLocation, setNewEventLocation] = useState('')
  const [newEventCategory, setNewEventCategory] = useState('Acadêmico')

  // Filtros de Categorias da Agenda
  const [visibleCategories, setVisibleCategories] = useState({
    'Acadêmico': true,
    'Pessoal': true,
    'PET / Projetos': true,
    'Esportivo': true
  })

  // ==================== ESTADOS DE CONFIGURAÇÃO PERSISTIDOS ====================
  const [headerDisplayName, setHeaderDisplayName] = useState('Estudante')
  const [headerEmail, setHeaderEmail] = useState(session?.user?.email || 'rychardeduardos@gmail.com')

  const [draftFullName, setDraftFullName] = useState('Rychard Eduardo')
  const [draftDisplayName, setDraftDisplayName] = useState('Rychard')
  const [draftEmail, setDraftEmail] = useState(session?.user?.email || 'rychardeduardos@gmail.com')
  const [draftCourse, setDraftCourse] = useState('Ciência e Tecnologia')
  const [draftYear, setDraftYear] = useState('2022')

  const [configSubTab, setConfigSubTab] = useState('Perfil')
  const [loading, setLoading] = useState(false)

  const avatarInitials = headerDisplayName.slice(0, 2).toUpperCase()

  useEffect(() => {
    fetchProfile()
    fetchTasks()
    fetchPosts()
    fetchEvents()

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => { fetchPosts() })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const fetchProfile = async () => {
    try {
      const user = session?.user
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name, course, entry_year')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setHeaderDisplayName(data.username || user.email.split('@')[0])
        setHeaderEmail(user.email)

        setDraftFullName(data.full_name || 'Rychard Eduardo')
        setDraftDisplayName(data.username || user.email.split('@')[0])
        setDraftEmail(user.email)
        setDraftCourse(data.course || 'Ciência e Tecnologia')
        setDraftYear(data.entry_year || '2022')
      } else {
        setHeaderDisplayName(user.email.split('@')[0])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = session?.user
      if (!user) return

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: draftDisplayName,
          full_name: draftFullName,
          course: draftCourse,
          entry_year: draftYear
        })

      if (profileError) throw profileError

      if (draftEmail.trim() !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: draftEmail.trim()
        })
        if (authError) throw authError
        alert('Confirmação enviada! Acesse o seu novo e-mail para validar a alteração do seu login oficial.')
      }

      setHeaderDisplayName(draftDisplayName)
      setHeaderEmail(draftEmail)

      alert('Alterações salvas com sucesso e guardadas no aluno!')
    } catch (error) {
      alert('Erro ao salvar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // ==================== LÓGICA DAS TAREFAS ====================
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Erro ao buscar tarefas:', error.message)
    else setTasks(data || [])
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    setLoading(true)
    const { error } = await supabase
      .from('tasks')
      .insert([{ user_id: session.user.id, title: newTaskTitle, due_date: newTaskDate || null, is_completed: false }])

    if (error) alert('Erro ao criar tarefa: ' + error.message)
    else { setNewTaskTitle(''); setNewTaskDate(''); fetchTasks() }
    setLoading(false)
  }

  const toggleTaskComplete = async (id, currentStatus) => {
    const { error } = await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', id)
    if (error) console.error(error.message)
    else fetchTasks()
  }

  const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) console.error(error.message)
    else fetchTasks()
  }

  // ==================== LÓGICA DO FEED ====================
  const fetchPosts = async () => {
    const { data: postsData, error: postsError } = await supabase.from('posts').select('id, content, created_at, user_id').order('created_at', { ascending: false })
    if (postsError) return

    const { data: profilesData } = await supabase.from('profiles').select('id, username')
    const profilesMap = {}
    profilesData?.forEach(p => { profilesMap[p.id] = p.username })

    setPosts(postsData.map(post => ({
      ...post,
      profiles: profilesMap[post.user_id] ? { username: profilesMap[post.user_id] } : null
    })) || [])
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newPostContent.trim()) return
    const { error } = await supabase.from('posts').insert([{ user_id: session.user.id, content: newPostContent }])
    if (!error) { setNewPostContent(''); fetchPosts() }
  }

  // ==================== LÓGICA DA AGENDA ====================
  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true })
    if (!error) setEvents(data || [])
  }

  const handleAddEvent = async (e) => {
    e.preventDefault()
    if (!newEventTitle.trim() || !newEventDate) return
    const { error } = await supabase.from('events').insert([{ user_id: session.user.id, title: newEventTitle, event_date: newEventDate, event_time: newEventTime || null, location: newEventLocation || null, category: newEventCategory }])
    if (!error) { setNewEventTitle(''); setNewEventTime(''); setNewEventLocation(''); setShowEventModal(false); fetchEvents() }
  }

  const handleDeleteEvent = async (id) => {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (!error) fetchEvents()
  }

  const pendingTasksCount = tasks.filter(task => !task.is_completed).length

  // Estilos das tags internas dos dias do calendário
  const getCategoryStyle = (cat) => {
    switch (cat) {
      case 'Acadêmico': return { bg: 'bg-[#e8f5ef]', text: 'text-[#00674F]', border: 'border-[#a3d9c9]', dot: 'bg-[#00674F]' }
      case 'Pessoal': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' }
      case 'PET / Projetos': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' }
      case 'Esportivo': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' }
      default: return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-400' }
    }
  }

  const daysInCalendar = []
  daysInCalendar.push({ dayNumber: 28, isCurrentMonth: false, fullDateString: '2024-04-28' }, { dayNumber: 29, isCurrentMonth: false, fullDateString: '2024-04-29' }, { dayNumber: 30, isCurrentMonth: false, fullDateString: '2024-04-30' })
  for (let i = 1; i <= 31; i++) {
    daysInCalendar.push({ dayNumber: i, isCurrentMonth: true, fullDateString: `2024-05-${String(i).padStart(2, '0')}` })
  }
  daysInCalendar.push({ dayNumber: 1, isCurrentMonth: false, fullDateString: '2024-06-01' })

  return (
    <div className="flex flex-col h-screen bg-[#F5F7F6] min-h-[640px] font-sans antialiased overflow-hidden">

      {/* ==================== HEADER OFICIAL ==================== */}
      <header className="bg-gradient-to-br from-[#003d2e] via-[#00674F] to-[#005040] px-7 h-24 flex items-center justify-between relative overflow-hidden shrink-0 shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.04)_1px,_transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-72 h-56 rounded-full border-2 border-[rgba(211,175,55,0.25)] pointer-events-none" />
        <div className="absolute right-14 -top-24 w-80 h-72 rounded-full border border-[rgba(211,175,55,0.12)] pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-13 h-13 bg-white/10 rounded-2xl flex items-center justify-center border border-white/15 backdrop-blur-md p-2.5 shadow-inner">
            <svg viewBox="0 0 30 30" fill="none" className="w-8 h-8">
              <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="1.8" />
              <circle cx="20" cy="10" r="7" stroke="#D3AF37" strokeWidth="1.8" />
              <circle cx="15" cy="19" r="7" stroke="white" strokeWidth="1.8" strokeOpacity="0.7" />
            </svg>
          </div>
          <div className="text-white">
            <h1 className="text-lg font-bold tracking-wide leading-none mb-0.5">UFA ORGANIZEI</h1>
            <span className="text-[#D3AF37] text-xs font-medium tracking-wider">Organizador</span>
          </div>
          <div className="w-px h-10 bg-white/20 mx-1 hidden md:block" />
          <div className="text-white/90 relative z-10 hidden md:block">
            <strong className="text-sm font-medium block">Bem-vindo de volta, {headerDisplayName}!</strong>
            <span className="text-xs text-white/70">Organize suas tarefas e fique por dentro da UFA.</span>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2.5 bg-white/10 border border-white/15 rounded-full py-1.5 pl-1.5 pr-3.5 backdrop-blur-md cursor-pointer hover:bg-white/15 transition-all duration-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D3AF37] to-[#a88620] flex items-center justify-center text-xs font-semibold text-white shrink-0 shadow-sm">
              {avatarInitials}
            </div>
            <div className="text-white hidden sm:block">
              <span className="text-xs font-medium block">{headerDisplayName}</span>
              <span className="text-[10px] text-white/60 block truncate max-w-[140px]">{headerEmail}</span>
            </div>
            <ChevronDown size={14} className="text-white/50 ml-0.5" />
          </div>
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1.5 bg-gradient-to-br from-[#D3AF37] to-[#b8942a] text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-sm"><LogOut size={14} /><span className="hidden sm:inline">Sair</span></button>
        </div>
      </header>

      {/* ==================== CORPO CENTRAL ==================== */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-[200px] shrink-0 bg-white border-r border-[#e8ebe9] py-5 px-3 flex flex-col gap-1 overflow-y-auto hidden md:flex">
          <button onClick={() => setActiveTab('inicio')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'inicio' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2]'}`}><Home size={16} /><span>Início</span></button>
          <button onClick={() => setActiveTab('tarefas')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'tarefas' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2]'}`}><ListTodo size={16} /><span>Tarefas</span></button>
          <button onClick={() => setActiveTab('agenda')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'agenda' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2]'}`}><Calendar size={16} /><span>Agenda</span></button>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-gray-300 cursor-not-allowed"><Megaphone size={16} /><span>Avisos</span></div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-gray-300 cursor-not-allowed"><LayoutGrid size={16} /><span>Feed</span></div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-gray-300 cursor-not-allowed"><BarChart size={16} /><span>Relatórios</span></div>
          <button onClick={() => setActiveTab('configuracoes')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'configuracoes' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2]'}`}><Settings size={16} /><span>Configurações</span></button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#8a9e94] text-[11px] opacity-50"><ChevronLeft size={14} /><span>Recolher</span></div>
        </aside>

        {/* CONTEÚDO DAS ABAS */}
        <main className="flex-1 p-[22px] grid grid-cols-1 lg:grid-cols-3 gap-[18px] overflow-auto">
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* ABA INÍCIO */}
            {activeTab === 'inicio' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 flex justify-between items-center shadow-sm">
                  <div>
                    <h2 className="text-[17px] font-bold text-[#1a2e26]">Olá, {headerDisplayName}! 👋</h2>
                    <p className="text-xs text-[#8a9e94] mt-0.5">Aqui está um resumo do seu dia na UFA.</p>
                  </div>
                  <button onClick={() => setActiveTab('tarefas')} className="text-xs font-semibold text-[#00674F] border border-[#00674F] rounded-xl px-3 py-1.5 hover:bg-[#f0f5f2]">Ver todas as tarefas</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="bg-white border border-[#e4e9e6] p-4 rounded-2xl flex items-center gap-3.5 shadow-sm"><div className="w-10 h-10 rounded-xl bg-[#e8f5ef] flex items-center justify-center"><ListTodo size={18} className="text-[#00674F]" /></div><div><div className="text-lg font-bold text-gray-800 leading-none">{pendingTasksCount}</div><div className="text-[11px] font-medium text-[#1a2e26] mt-0.5">Tarefas pendentes</div></div></div>
                  <div className="bg-white border border-[#e4e9e6] p-4 rounded-2xl flex items-center gap-3.5 shadow-sm cursor-pointer" onClick={() => setActiveTab('agenda')}><div className="w-10 h-10 rounded-xl bg-[#fdf5e0] flex items-center justify-center"><Calendar size={18} className="text-[#D3AF37]" /></div><div><div className="text-lg font-bold text-gray-800 leading-none">{events.length}</div><div className="text-[11px] font-medium text-[#1a2e26] mt-0.5">Eventos agendados</div></div></div>
                  <div className="bg-white border border-[#e4e9e6] p-4 rounded-2xl flex items-center gap-3.5 shadow-sm"><div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Bell size={18} className="text-blue-600" /></div><div><div className="text-lg font-bold text-gray-800 leading-none">2</div><div className="text-[11px] font-medium text-[#1a2e26] mt-0.5">Avisos não lidos</div></div></div>
                  <div className="bg-white border border-[#e4e9e6] p-4 rounded-2xl flex items-center gap-3.5 shadow-sm"><div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><Award size={18} className="text-purple-600" /></div><div><div className="text-lg font-bold text-gray-800 leading-none">85%</div><div className="text-[11px] font-medium text-[#1a2e26] mt-0.5">Produtividade</div></div></div>
                </div>
              </div>
            )}

            {/* ABA TAREFAS */}
            {activeTab === 'tarefas' && (
              <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col shadow-sm h-full min-h-[480px]">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-[#e8f5ef] flex items-center justify-center"><ListTodo size={18} className="text-[#00674F]" /></div>
                  <div><div className="text-[15px] font-medium text-[#1a2e26]">Minhas Tarefas Acadêmicas</div><div className="text-xs text-[#8a9e94] mt-0.5">{pendingTasksCount} tarefas pendentes</div></div>
                </div>
                <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2.5 mb-5">
                  <input type="text" placeholder="Ex: Estudar para P1 de Física" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#dde5e0] text-xs text-[#1a2e26] bg-[#fafcfb] outline-none" required />
                  <button type="submit" className="bg-[#00674F] text-white rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-[#005040]">Adicionar</button>
                </form>
              </div>
            )}

            {/* ==================== ABA AGENDA — REDESIGN PREMIUM ==================== */}
            {activeTab === 'agenda' && (
              <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col shadow-sm">

                {/* Cabeçalho */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e8f5ef] flex items-center justify-center shrink-0">
                      <Calendar size={20} className="text-[#00674F]" />
                    </div>
                    <div>
                      <div className="text-[16px] font-bold text-[#1a2e26]">Minha Agenda</div>
                      <div className="text-xs text-[#8a9e94] mt-0.5">Visualize e gerencie seus compromissos.</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="flex items-center gap-1.5 bg-[#00674F] hover:bg-[#005040] text-white rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-all"
                  >
                    <Plus size={14} /> Novo evento
                  </button>
                </div>

                {/* Barra de controles: Hoje / setas / título / Mês·Semana·Dia */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-1.5">
                    <button className="px-3 py-1.5 bg-white border border-[#dde5e0] rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                      Hoje
                    </button>
                    <button className="p-1.5 bg-white border border-[#dde5e0] rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <button className="p-1.5 bg-white border border-[#dde5e0] rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm font-bold text-[#1a2e26]">
                    Maio 2024
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>

                  <div className="flex bg-[#f3f6f4] rounded-lg p-0.5 border border-[#e4e9e6]">
                    <button className="px-3 py-1 bg-white text-[#00674F] font-bold rounded-md text-xs shadow-sm">Mês</button>
                    <button className="px-3 py-1 text-gray-400 font-medium rounded-md text-xs">Semana</button>
                    <button className="px-3 py-1 text-gray-400 font-medium rounded-md text-xs">Dia</button>
                  </div>
                </div>

                {/* Cabeçalho dias da semana */}
                <div className="grid grid-cols-7 mb-1">
                  {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-[#8a9e94] tracking-widest py-2">{d}</div>
                  ))}
                </div>

                {/* Grade do calendário — estilo Notion/Linear */}
                <div className="grid grid-cols-7 border-t border-l border-[#e8ede9] rounded-b-xl overflow-hidden">
                  {daysInCalendar.map((item, idx) => {
                    const dayEvents = events.filter(e => e.event_date === item.fullDateString && visibleCategories[e.category])
                    const isToday = item.dayNumber === 15 && item.isCurrentMonth
                    return (
                      <div
                        key={idx}
                        className={`min-h-[90px] border-r border-b border-[#e8ede9] p-1.5 flex flex-col transition-colors hover:bg-[#fafcfb]
                          ${!item.isCurrentMonth ? 'bg-[#f9fbfa]' : 'bg-white'}`}
                      >
                        {/* Número do dia */}
                        <div className="mb-1">
                          <span className={`text-[11px] font-semibold inline-flex items-center justify-center w-5 h-5 rounded-full
                            ${isToday
                              ? 'bg-[#00674F] text-white'
                              : item.isCurrentMonth ? 'text-[#1a2e26]' : 'text-[#c4d0cb]'
                            }`}>
                            {item.dayNumber}
                          </span>
                        </div>
                        {/* Eventos do dia */}
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          {dayEvents.map(ev => {
                            const style = getCategoryStyle(ev.category)
                            return (
                              <div
                                key={ev.id}
                                className={`text-[9px] px-1.5 py-0.5 rounded-md border-l-2 leading-tight ${style.bg} ${style.text} ${style.border}`}
                              >
                                <div className="font-semibold truncate">{ev.title}</div>
                                {ev.event_time && <div className="opacity-70 font-normal">{ev.event_time}</div>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Legenda de categorias */}
                <div className="flex items-center gap-4 mt-3 px-1">
                  {Object.keys(visibleCategories).map(cat => {
                    const style = getCategoryStyle(cat)
                    return (
                      <div key={cat} className="flex items-center gap-1.5 text-[10px] text-[#5a6b63]">
                        <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                        {cat}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ABA CONFIGURAÇÕES */}
            {activeTab === 'configuracoes' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col shadow-sm">
                  <h3 className="text-sm font-bold text-gray-800 mb-4">Informações do perfil</h3>
                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">Nome completo</label>
                        <input type="text" value={draftFullName} onChange={(e) => setDraftFullName(e.target.value)} className="w-full px-3.5 py-2 border rounded-xl text-xs bg-[#fafcfb] text-gray-700 outline-none focus:border-[#00674F]" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">Nome de exibição</label>
                        <input type="text" value={draftDisplayName} onChange={(e) => setDraftDisplayName(e.target.value)} className="w-full px-3.5 py-2 border rounded-xl text-xs bg-[#fafcfb] text-gray-700 outline-none focus:border-[#00674F]" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">E-mail</label>
                        <input type="email" value={draftEmail} onChange={(e) => setDraftEmail(e.target.value)} className="w-full px-3.5 py-2 border rounded-xl text-xs bg-[#fafcfb] text-gray-700 outline-none focus:border-[#00674F]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 block mb-1">Curso</label>
                          <input type="text" value={draftCourse} onChange={(e) => setDraftCourse(e.target.value)} className="w-full px-3.5 py-2 border rounded-xl text-xs bg-[#fafcfb] text-gray-700 outline-none focus:border-[#00674F]" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 block mb-1">Ingresso</label>
                          <input type="text" value={draftYear} onChange={(e) => setDraftYear(e.target.value)} className="w-full px-3.5 py-2 border rounded-xl text-xs bg-[#fafcfb] text-gray-700 outline-none focus:border-[#00674F]" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2 border-t">
                      <button type="submit" disabled={loading} className="bg-[#00674F] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm">
                        {loading ? 'Salvando...' : 'Salvar alterações'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DA DIREITA */}
          <div className="space-y-4">
            {activeTab === 'agenda' ? (
              <>
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-[#1a2e26]">Próximos eventos</span>
                    <span className="text-[11px] font-bold text-[#00674F] cursor-pointer">Ver todos</span>
                  </div>
                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {events.map(ev => {
                      const style = getCategoryStyle(ev.category);
                      return (
                        <div key={ev.id} className="p-3 bg-[#fafcfb] border border-[#e8ede9] rounded-xl flex items-center justify-between group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                              <Calendar size={14} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-[#1a2e26] truncate">{ev.title}</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                                {ev.location && <span className="flex items-center gap-0.5"><MapPin size={9} /> {ev.location}</span>}
                                {ev.event_time && <span className="flex items-center gap-0.5"><Clock size={9} /> {ev.event_time}</span>}
                              </p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteEvent(ev.id)} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-[#1a2e26]">Calendários</span>
                  </div>
                  <div className="space-y-3">
                    {Object.keys(visibleCategories).map(cat => {
                      const style = getCategoryStyle(cat);
                      return (
                        <label key={cat} className="flex items-center justify-between cursor-pointer select-none">
                          <div className="flex items-center gap-2.5 text-xs font-medium text-gray-600">
                            <input
                              type="checkbox"
                              checked={visibleCategories[cat]}
                              onChange={(e) => setVisibleCategories(prev => ({ ...prev, [cat]: e.target.checked }))}
                              className="rounded border-gray-300 text-[#00674F] w-3.5 h-3.5 cursor-pointer"
                            />
                            <span>{cat}</span>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                        </label>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col h-full min-h-[480px] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00674F] to-[#D3AF37]" />
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#fdf5e0] flex items-center justify-center"><Megaphone size={18} className="text-[#D3AF37]" /></div>
                  <div><div className="text-[15px] font-medium text-[#1a2e26]">Feed Central da UFA</div><div className="text-[11px] text-[#8a9e94] mt-0.5">Fique por dentro das novidades.</div></div>
                </div>
                <form onSubmit={handleCreatePost} className="flex gap-2 mb-4">
                  <input type="text" placeholder="O que está acontecendo no campus?" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="flex-1 px-3 py-2 border border-[#dde5e0] rounded-xl text-xs bg-[#fafcfb] outline-none" required />
                  <button type="submit" className="w-9 h-9 rounded-xl bg-[#D3AF37] text-white flex items-center justify-center shadow-sm"><Send size={14} /></button>
                </form>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {posts.map((post) => (
                    <div key={post.id} className="p-3 rounded-xl bg-[#fafcfb] border border-[#e8ede9] flex gap-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#1a2e26]">{post.profiles?.username || 'Estudante UFA'}</div>
                        <p className="text-xs text-[#5a6b63] mt-1 whitespace-pre-wrap break-words leading-relaxed">{post.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL DE COMPROMISSO */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">Criar Novo Compromisso</h3>
            <form onSubmit={handleAddEvent} className="space-y-3">
              <input type="text" placeholder="Título do Evento" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs outline-none" required />
              <input type="date" min="2024-05-01" max="2024-05-31" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs outline-none" required />
              <input type="text" placeholder="Horário (Ex: 08:00)" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs outline-none" />
              <input type="text" placeholder="Local (Ex: Sala A-203)" value={newEventLocation} onChange={(e) => setNewEventLocation(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs outline-none" />
              <select value={newEventCategory} onChange={(e) => setNewEventCategory(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-[#fafcfb] text-gray-600 outline-none">
                <option value="Acadêmico">Acadêmico</option>
                <option value="Pessoal">Pessoal</option>
                <option value="PET / Projetos">PET / Projetos</option>
                <option value="Esportivo">Esportivo</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEventModal(false)} className="px-4 py-2 border rounded-xl text-xs text-gray-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#00674F] text-white rounded-xl text-xs font-bold">Salvar evento</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}