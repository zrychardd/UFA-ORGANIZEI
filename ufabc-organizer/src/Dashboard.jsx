import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
  Plus, CheckCircle, Circle, Trash2, LogOut, Calendar,
  ListTodo, Share2, Send, Home, Megaphone,
  LayoutGrid, BarChart, Settings, ChevronLeft, ChevronDown, Check,
  Bell, Award, Flame, ChevronJanelas, MapPin, Clock
} from 'lucide-react'

export default function Dashboard({ session }) {
  // Estado de Navegação das Abas
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

  const [loading, setLoading] = useState(false)

  // Extrai informações do usuário logado
  const userEmail = session?.user?.email || 'estudante@ufabc.edu.br'
  const userPrefix = userEmail.split('@')[0]
  const displayFirstName = userPrefix.charAt(0).toUpperCase() + userPrefix.slice(1)
  const avatarInitials = userPrefix.slice(0, 2).toUpperCase()

  useEffect(() => {
    fetchTasks()
    fetchPosts()
    fetchEvents()

    // Sistema em tempo real do Feed Coletivo
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

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
      .insert([
        {
          user_id: session.user.id,
          title: newTaskTitle,
          due_date: newTaskDate || null,
          is_completed: false
        }
      ])

    if (error) {
      alert('Erro ao criar tarefa: ' + error.message)
    } else {
      setNewTaskTitle('')
      setNewTaskDate('')
      fetchTasks()
    }
    setLoading(false)
  }

  const toggleTaskComplete = async (id, currentStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', id)

    if (error) console.error('Erro ao atualizar tarefa:', error.message)
    else fetchTasks()
  }

  const deleteTask = async (id) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) console.error('Erro ao deletar tarefa:', error.message)
    else fetchTasks()
  }

  // ==================== LÓGICA DO FEED ====================
  const fetchPosts = async () => {
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('id, content, created_at, user_id')
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Erro ao buscar feed:', postsError.message)
      return
    }

    if (!postsData || postsData.length === 0) {
      setPosts([])
      return
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')

    if (profilesError) {
      console.error('Erro ao buscar perfis:', profilesError.message)
      setPosts(postsData.map(post => ({ ...post, profiles: null })))
      return
    }

    const profilesMap = {}
    profilesData?.forEach(p => {
      profilesMap[p.id] = p.username
    })

    const formattedPosts = postsData.map(post => ({
      ...post,
      profiles: profilesMap[post.user_id] ? { username: profilesMap[post.user_id] } : null
    }))

    setPosts(formattedPosts)
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newPostContent.trim()) return

    const { error } = await supabase
      .from('posts')
      .insert([
        {
          user_id: session.user.id,
          content: newPostContent
        }
      ])

    if (error) {
      alert('Erro ao postar no feed: ' + error.message)
    } else {
      setNewPostContent('')
      fetchPosts()
    }
  }

  // ==================== LÓGICA DA AGENDA ====================
  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })

    if (error) console.error('Erro ao buscar eventos:', error.message)
    else setEvents(data || [])
  }

  const handleAddEvent = async (e) => {
    e.preventDefault()
    if (!newEventTitle.trim() || !newEventDate) return

    const { error } = await supabase
      .from('events')
      .insert([
        {
          user_id: session.user.id,
          title: newEventTitle,
          event_date: newEventDate,
          event_time: newEventTime || null,
          location: newEventLocation || null,
          category: newEventCategory
        }
      ])

    if (error) {
      alert('Erro ao criar evento: ' + error.message)
    } else {
      setNewEventTitle('')
      setNewEventTime('')
      setNewEventLocation('')
      setShowEventModal(false)
      fetchEvents()
    }
  }

  const handleDeleteEvent = async (id) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) console.error('Erro ao deletar evento:', error.message)
    else fetchEvents()
  }

  // Contadores estatísticos para a tela Início
  const pendingTasksCount = tasks.filter(task => !task.is_completed).length

  // Estrutura de cor por categoria da agenda
  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Acadêmico': return { bg: 'bg-[#e8f5ef]', text: 'text-[#00674F]', border: 'border-[#00674F]', dot: 'bg-[#00674F]' }
      case 'Pessoal': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-500', dot: 'bg-amber-500' }
      case 'PET / Projetos': return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500', dot: 'bg-emerald-400' }
      case 'Esportivo': return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-400', dot: 'bg-gray-400' }
      default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-300', dot: 'bg-gray-300' }
    }
  }

  // Geração da grade de dias para o mês fixo de Maio de 2024 (conforme o print)
  const daysInCalendar = []
  // Dias vazios/do mês anterior (Abril termina na terça-feira dia 30, então Maio começa na Quarta-feira dia 1)
  daysInCalendar.push({ dayNumber: 28, isCurrentMonth: false }, { dayNumber: 29, isCurrentMonth: false }, { dayNumber: 30, isCurrentMonth: false })
  // Dias de Maio (1 a 31)
  for (let i = 1; i <= 31; i++) {
    daysInCalendar.push({ dayNumber: i, isCurrentMonth: true, fullDateString: `2024-05-${String(i).padStart(2, '0')}` })
  }
  // Dias do próximo mês (Junho) para fechar a grade perfeita de 5 semanas (35 slots no total, restam 1)
  daysInCalendar.push({ dayNumber: 1, isCurrentMonth: false })

  return (
    <div className="flex flex-col h-screen bg-[#F5F7F6] min-h-[640px] font-sans antialiased overflow-hidden">

      {/* ==================== HEADER ==================== */}
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
            <strong className="text-sm font-medium block">Bem-vindo de volta, {displayFirstName}!</strong>
            <span className="text-xs text-white/70">Organize suas tarefas e fique por dentro da UFA.</span>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2.5 bg-white/10 border border-white/15 rounded-full py-1.5 pl-1.5 pr-3.5 backdrop-blur-md cursor-pointer hover:bg-white/15 transition-all duration-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D3AF37] to-[#a88620] flex items-center justify-center text-xs font-semibold text-white shrink-0 shadow-sm">
              {avatarInitials}
            </div>
            <div className="text-white hidden sm:block">
              <span className="text-xs font-medium block">{displayFirstName}</span>
              <span className="text-[10px] text-white/60 block truncate max-w-[140px]">{userEmail}</span>
            </div>
            <ChevronDown size={14} className="text-white/50 ml-0.5" />
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 bg-gradient-to-br from-[#D3AF37] to-[#b8942a] text-white rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 hover:opacity-90 shadow-sm"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* ==================== CORPO DA APLICAÇÃO ==================== */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <aside className="w-[200px] shrink-0 bg-white border-r border-[#e8ebe9] py-5 px-3 flex flex-col gap-1 overflow-y-auto hidden md:flex">
          <button
            onClick={() => setActiveTab('inicio')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${activeTab === 'inicio' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2] hover:text-[#00674F]'
              }`}
          >
            <Home size={16} className="shrink-0" />
            <span>Início</span>
          </button>
          <button
            onClick={() => setActiveTab('tarefas')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${activeTab === 'tarefas' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2] hover:text-[#00674F]'
              }`}
          >
            <ListTodo size={16} className="shrink-0" />
            <span>Tarefas</span>
          </button>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${activeTab === 'agenda' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2] hover:text-[#00674F]'
              }`}
          >
            <Calendar size={16} className="shrink-0" />
            <span>Agenda</span>
          </button>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed text-xs font-normal text-gray-300">
            <Megaphone size={16} className="shrink-0" />
            <span>Avisos</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed text-xs font-normal text-gray-300">
            <LayoutGrid size={16} className="shrink-0" />
            <span>Feed</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed text-xs font-normal text-gray-300">
            <BarChart size={16} className="shrink-0" />
            <span>Relatórios</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed text-xs font-normal text-gray-300">
            <Settings size={16} className="shrink-0" />
            <span>Configurações</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#8a9e94] text-[11px] font-medium opacity-50">
            <ChevronLeft size={14} />
            <span>Recolher</span>
          </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL CONFIGURADO DINÂMICAMENTE */}
        <main className="flex-1 p-[22px] grid grid-cols-1 lg:grid-cols-3 gap-[18px] overflow-auto">

          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* ==================== RENDER: ABA INÍCIO ==================== */}
            {activeTab === 'inicio' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 flex justify-between items-center shadow-sm">
                  <div>
                    <h2 className="text-[17px] font-bold text-[#1a2e26]">Olá, {displayFirstName}! 👋</h2>
                    <p className="text-xs text-[#8a9e94] mt-0.5">Aqui está um resumo do seu dia na UFA.</p>
                  </div>
                  <button onClick={() => setActiveTab('tarefas')} className="text-xs font-semibold text-[#00674F] border border-[#00674F] rounded-xl px-3 py-1.5 hover:bg-[#f0f5f2] transition-colors">
                    Ver todas as tarefas
                  </button>
                </div>

                {/* Cards Estatísticos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="bg-white border border-[#e4e9e6] p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-[#e8f5ef] flex items-center justify-center shrink-0">
                      <ListTodo size={18} className="text-[#00674F]" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800 leading-none">{pendingTasksCount}</div>
                      <div className="text-[11px] font-medium text-[#1a2e26] mt-0.5">Tarefas pendentes</div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e4e9e6] p-4 rounded-2xl flex items-center gap-3.5 shadow-sm cursor-pointer" onClick={() => setActiveTab('agenda')}>
                    <div className="w-10 h-10 rounded-xl bg-[#fdf5e0] flex items-center justify-center shrink-0">
                      <Calendar size={18} className="text-[#D3AF37]" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800 leading-none">{events.length}</div>
                      <div className="text-[11px] font-medium text-[#1a2e26] mt-0.5">Eventos agendados</div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e4e9e6] p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Bell size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800 leading-none">2</div>
                      <div className="text-[11px] font-medium text-[#1a2e26] mt-0.5">Avisos não lidos</div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e4e9e6] p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Award size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800 leading-none">85%</div>
                      <div className="text-[11px] font-medium text-[#1a2e26] mt-0.5">Produtividade</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== RENDER: ABA TAREFAS ==================== */}
            {activeTab === 'tarefas' && (
              <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col shadow-sm h-full min-h-[480px]">
                {/* O bloco interno de tarefas continua intacto aqui */}
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-[#e8f5ef] flex items-center justify-center shrink-0">
                    <ListTodo size={18} className="text-[#00674F]" />
                  </div>
                  <div>
                    <div className="text-[15px] font-medium text-[#1a2e26]">Minhas Tarefas Acadêmicas</div>
                    <div className="text-xs text-[#8a9e94] mt-0.5">{pendingTasksCount} tarefas pendentes</div>
                  </div>
                </div>

                <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2.5 mb-5">
                  <input
                    type="text"
                    placeholder="Ex: Estudar para P1 de Física"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#dde5e0] text-xs text-[#1a2e26] bg-[#fafcfb] outline-none focus:border-[#00674F] focus:bg-white"
                    required
                  />
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-[#dde5e0] text-xs text-[#6a7d74] bg-[#fafcfb] outline-none sm:w-[140px]"
                  />
                  <button type="submit" disabled={loading} className="flex items-center justify-center gap-1.5 bg-[#00674F] text-white rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-[#005040] disabled:opacity-50">
                    <Plus size={14} />
                    <span>Adicionar</span>
                  </button>
                </form>

                <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[400px]">
                  {tasks.map((task) => (
                    <div key={task.id} className={`flex items-center justify-between p-3.5 rounded-xl border ${task.is_completed ? 'bg-gray-50/70 opacity-60' : 'bg-[#fafcfb] border-[#e8ede9]'}`}>
                      <div className="flex items-center space-x-3 flex-1 truncate">
                        <button onClick={() => toggleTaskComplete(task.id, task.is_completed)} className="text-gray-400 hover:text-[#00674F]">{task.is_completed ? <CheckCircle className="text-[#00674F]" size={18} /> : <Circle size={18} />}</button>
                        <p className={`text-xs font-medium text-[#1a2e26] truncate ${task.is_completed ? 'line-through text-gray-400' : ''}`}>{task.title}</p>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 ml-2"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== RENDER: ABA AGENDA (NOVO COMPONENTE DESIGN `image_c83220.png`) ==================== */}
            {activeTab === 'agenda' && (
              <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col shadow-sm">

                {/* Topo da Agenda */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#e8f5ef] flex items-center justify-center shrink-0">
                      <Calendar size={18} className="text-[#00674F]" />
                    </div>
                    <div>
                      <div className="text-[15px] font-bold text-[#1a2e26]">Minha Agenda</div>
                      <div className="text-xs text-[#8a9e94] mt-0.5">Visualize e gerencie seus compromissos.</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="flex items-center justify-center gap-1.5 bg-[#00674F] hover:bg-[#005040] text-white rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Novo evento</span>
                  </button>
                </div>

                {/* Barra de Controles de Período */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fafcfb] border border-[#e8ede9] p-3 rounded-xl mb-4">
                  <div className="flex items-center gap-1.5">
                    <button className="px-3 py-1.5 bg-white border border-[#dde5e0] rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">Hoje</button>
                    <button className="p-1.5 bg-white border border-[#dde5e0] rounded-lg text-xs text-gray-600 hover:bg-gray-50">&lt;</button>
                    <button className="p-1.5 bg-white border border-[#dde5e0] rounded-lg text-xs text-gray-600 hover:bg-gray-50">&gt;</button>
                  </div>
                  <div className="text-sm font-bold text-[#1a2e26] tracking-wide">Maio 2024</div>
                  <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                    <button className="px-3 py-1 bg-white text-[#00674F] font-bold rounded-md text-xs shadow-sm">Mês</button>
                    <button className="px-3 py-1 text-gray-500 font-medium rounded-md text-xs cursor-not-allowed">Semana</button>
                    <button className="px-3 py-1 text-gray-500 font-medium rounded-md text-xs cursor-not-allowed">Dia</button>
                  </div>
                </div>

                {/* Grade dos Dias da Semana */}
                <div className="grid grid-cols-7 gap-px text-center mb-1 text-[10px] font-bold text-gray-400 tracking-wider">
                  <div>DOM</div><div>SEG</div><div>TER</div><div>QUA</div><div>QUI</div><div>SEX</div><div>SÁB</div>
                </div>

                {/* Grade do Calendário (Mês Completo) */}
                <div className="grid grid-cols-7 gap-1 bg-gray-100 border border-gray-200 rounded-xl overflow-hidden p-1 bg-opacity-60">
                  {daysInCalendar.map((item, idx) => {
                    // Busca se existem eventos salvos para este dia específico
                    const dayEvents = events.filter(e => e.event_date === item.fullDateString && visibleCategories[e.category]);

                    return (
                      <div
                        key={idx}
                        className={`min-h-[72px] bg-white p-1.5 flex flex-col justify-between rounded-lg border border-gray-50 transition-colors ${!item.isCurrentMonth ? 'bg-gray-50/50 opacity-40' : ''
                          } ${item.dayNumber === 15 && item.isCurrentMonth ? 'ring-1 ring-[#00674F]' : ''}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-[11px] font-bold ${item.dayNumber === 15 && item.isCurrentMonth
                            ? 'w-5 h-5 bg-[#00674F] text-white rounded-full flex items-center justify-center shadow-sm'
                            : 'text-gray-700'
                            }`}>
                            {item.dayNumber}
                          </span>
                        </div>

                        {/* Eventos dentro do quadradinho do dia */}
                        <div className="space-y-0.5 mt-1 flex-1 overflow-y-auto max-h-[50px] scrollbar-none">
                          {item.isCurrentMonth && dayEvents.map(ev => {
                            const colors = getCategoryColor(ev.category);
                            return (
                              <div key={ev.id} className={`text-[9px] px-1 py-0.5 font-bold rounded flex flex-col border-l-2 ${colors.bg} ${colors.text} ${colors.border} leading-tight`}>
                                <span className="truncate">{ev.title}</span>
                                {ev.event_time && <span className="text-[8px] opacity-80 font-normal">{ev.event_time}</span>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Legendas de Categorias */}
                <div className="flex gap-4 items-center mt-3 text-[10px] font-bold text-gray-500 px-1">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#00674F]" /> Acadêmico</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Pessoal</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Outros</div>
                </div>
              </div>
            )}
          </div>

          {/* ==================== COLUNA DA DIREITA: WIDGETS DINÂMICOS DA AGENDA ==================== */}
          <div className="space-y-4">

            {/* Se estiver na aba Agenda, renderiza a lista de "Próximos Eventos" e o gerenciador de calendários */}
            {activeTab === 'agenda' ? (
              <>
                {/* Card de Próximos Eventos */}
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-[#1a2e26]">Próximos eventos</span>
                    <span className="text-[11px] font-bold text-[#00674F]">Ver todos</span>
                  </div>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {events.length === 0 ? (
                      <p className="text-center text-gray-400 text-xs py-8">Nenhum evento criado.</p>
                    ) : (
                      events.map(ev => {
                        const colors = getCategoryColor(ev.category);
                        return (
                          <div key={ev.id} className="p-3 bg-[#fafcfb] border border-[#e8ede9] rounded-xl flex items-center justify-between group">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}>
                                <Calendar size={14} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-[#1a2e26] truncate">{ev.title}</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1.5 truncate">
                                  {ev.location && <span className="flex items-center gap-0.5"><MapPin size={9} /> {ev.location}</span>}
                                  {ev.event_time && <span className="flex items-center gap-0.5"><Clock size={9} /> {ev.event_time}</span>}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="text-gray-300 hover:text-red-500 p-1 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Card de Filtro de Calendários */}
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-[#1a2e26]">Calendários</span>
                    <span className="text-[11px] font-bold text-[#00674F] cursor-pointer">Gerenciar</span>
                  </div>

                  <div className="space-y-3">
                    {Object.keys(visibleCategories).map(cat => {
                      const colors = getCategoryColor(cat);
                      return (
                        <label key={cat} className="flex items-center justify-between cursor-pointer select-none">
                          <div className="flex items-center gap-2.5 text-xs font-medium text-gray-600">
                            <input
                              type="checkbox"
                              checked={visibleCategories[cat]}
                              onChange={() => setVisibleCategories(prev => ({ ...prev, [cat]: !prev[cat] }))}
                              className="rounded border-gray-300 text-[#00674F] focus:ring-[#00674F] w-3.5 h-3.5 cursor-pointer"
                            />
                            <span>{cat}</span>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                        </label>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* ==================== CASO SEJA OUTRA ABA: MANTÉM O CHAT DO FEED ORIGINAL ==================== */
              <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col h-full min-h-[480px] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00674F] to-[#D3AF37]" />

                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#fdf5e0] flex items-center justify-center shrink-0">
                    <Megaphone size={18} className="text-[#D3AF37]" />
                  </div>
                  <div>
                    <div className="text-[15px] font-medium text-[#1a2e26]">Feed Central da UFA</div>
                    <div className="text-[11px] text-[#8a9e94] mt-0.5">Fique por dentro das novidades da comunidade.</div>
                  </div>
                </div>

                <form onSubmit={handleCreatePost} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="O que está acontecendo no campus?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#dde5e0] rounded-xl text-xs bg-[#fafcfb] outline-none focus:border-[#D3AF37]"
                    required
                  />
                  <button type="submit" className="w-9 h-9 rounded-xl bg-[#D3AF37] flex items-center justify-center hover:bg-[#b8942a] text-white shrink-0 shadow-sm">
                    <Send size={14} />
                  </button>
                </form>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {posts.map((post) => {
                    const isOwnPost = post.user_id === session?.user?.id;
                    return (
                      <div key={post.id} className="p-3 rounded-xl bg-[#fafcfb] border border-[#e8ede9] flex gap-2.5 hover:bg-[#f0f5f2]">
                        <div className={`w-[3px] rounded-full shrink-0 ${isOwnPost ? 'bg-[#00674F]' : 'bg-[#D3AF37]'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-[#1a2e26] flex items-center gap-1.5">
                            {post.profiles?.username || 'Estudante UFA'}
                            <span className="text-[10px] text-[#aabdb5] font-normal">
                              {post.created_at ? new Date(post.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-[#5a6b63] mt-1 whitespace-pre-wrap break-words leading-relaxed">{post.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ==================== MODAL DE ADICIONAR NOVO EVENTO ==================== */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Criar Novo Compromisso</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Adicione um evento diretamente na grade da sua agenda.</p>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">Título do Evento</label>
                <input
                  type="text"
                  placeholder="Ex: Prova de Cálculo I"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-[#fafcfb] outline-none focus:border-[#00674F]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Data (Maio 2024)</label>
                  <input
                    type="date"
                    min="2024-05-01"
                    max="2024-05-31"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-[#fafcfb] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Horário (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: 08:00"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-[#fafcfb] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">Local / Sala (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Sala A-203"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-[#fafcfb] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">Categoria de Calendário</label>
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-[#fafcfb] outline-none cursor-pointer text-gray-600"
                >
                  <option value="Acadêmico">Acadêmico (Verde)</option>
                  <option value="Pessoal">Pessoal (Amarelo)</option>
                  <option value="PET / Projetos">PET / Projetos (Verde Claro)</option>
                  <option value="Esportivo">Esportivo (Cinza)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00674F] text-white rounded-xl text-xs font-bold hover:bg-[#005040]"
                >
                  Salvar evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}