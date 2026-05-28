import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
  Plus, CheckCircle, Circle, Trash2, LogOut, Calendar,
  ListTodo, Share2, Send, Home, Megaphone,
  LayoutGrid, BarChart, Settings, ChevronLeft, ChevronDown, Check,
  Bell, Award, Flame, MapPin, Clock, Search, SlidersHorizontal, ArrowRight,
  BookOpen, Building, Users, Wallet, Wrench
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

  // Filtros de Categorias da Agenda (Restaurado com Sucesso)
  const [visibleCategories, setVisibleCategories] = useState({
    'Acadêmico': true,
    'Pessoal': true,
    'PET / Projetos': true,
    'Esportivo': true
  })

  // Estados dos Avisos (Mural Dinâmico)
  const [announcements, setAnnouncements] = useState([])
  const [showNoticeModal, setShowNoticeModal] = useState(false)
  const [noticeTitle, setNoticeTitle] = useState('')
  const [noticeContent, setNoticeContent] = useState('')
  const [noticeCategory, setNoticeCategory] = useState('Acadêmico')
  const [noticeFeatured, setNoticeFeatured] = useState(false)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')

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
    fetchAnnouncements()

    // Sincronização em tempo real do banco de dados
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => { fetchPosts() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => { fetchAnnouncements() })
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

  // ==================== LÓGICA DE AVISOS ====================
  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setAnnouncements(data || [])
  }

  const handleAddNotice = async (e) => {
    e.preventDefault()
    if (!noticeTitle.trim() || !noticeContent.trim()) return

    const { error } = await supabase
      .from('announcements')
      .insert([
        {
          user_id: session.user.id,
          title: noticeTitle,
          content: noticeContent,
          category: noticeCategory,
          is_featured: noticeFeatured,
          username: displayFirstName
        }
      ])
    if (!error) {
      setNoticeTitle('')
      setNoticeContent('')
      setNoticeFeatured(false)
      setShowNoticeModal(false)
      fetchAnnouncements()
    }
  }

  const handleDeleteNotice = async (id) => {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)
    if (!error) fetchAnnouncements()
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

  // Estilos de Categorias para o mural de Avisos
  const getNoticeCategoryStyle = (cat) => {
    switch (cat) {
      case 'Acadêmico': return { bg: 'bg-[#e8f5ef]', text: 'text-[#00674F]', icon: <BookOpen size={14} /> }
      case 'Administrativo': return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <Building size={14} /> }
      case 'Eventos': return { bg: 'bg-amber-50', text: 'text-amber-600', icon: <Users size={14} /> }
      case 'Bolsas e Oportunidades': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <Wallet size={14} /> }
      case 'Infraestrutura': return { bg: 'bg-orange-50', text: 'text-orange-600', icon: <Wrench size={14} /> }
      default: return { bg: 'bg-gray-50', text: 'text-gray-600', icon: <Megaphone size={14} /> }
    }
  }

  // Geração da grade de dias para a Agenda (Maio 2024)
  const daysInCalendar = []
  daysInCalendar.push({ dayNumber: 28, isCurrentMonth: false }, { dayNumber: 29, isCurrentMonth: false }, { dayNumber: 30, isCurrentMonth: false })
  for (let i = 1; i <= 31; i++) {
    daysInCalendar.push({ dayNumber: i, isCurrentMonth: true, fullDateString: `2024-05-${String(i).padStart(2, '0')}` })
  }
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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${activeTab === 'inicio' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2] hover:text-[#00674F]'}`}
          >
            <Home size={16} className="shrink-0" />
            <span>Início</span>
          </button>
          <button
            onClick={() => setActiveTab('tarefas')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${activeTab === 'tarefas' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2] hover:text-[#00674F]'}`}
          >
            <ListTodo size={16} className="shrink-0" />
            <span>Tarefas</span>
          </button>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${activeTab === 'agenda' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2] hover:text-[#00674F]'}`}
          >
            <Calendar size={16} className="shrink-0" />
            <span>Agenda</span>
          </button>
          <button
            onClick={() => setActiveTab('avisos')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${activeTab === 'avisos' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2] hover:text-[#00674F]'}`}
          >
            <Megaphone size={16} className="shrink-0" />
            <span>Avisos</span>
          </button>
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

                {/* Próximos Eventos e Tarefas em Destaque */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-[#e4e9e6] p-5 rounded-2xl shadow-sm flex flex-col h-48">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-[#1a2e26] flex items-center gap-2">
                        <Calendar size={14} className="text-[#00674F]" /> Próximos eventos
                      </span>
                      <span onClick={() => setActiveTab('agenda')} className="text-[11px] font-semibold text-[#00674F] cursor-pointer">Ver agenda</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-1.5 text-gray-400">✓</div>
                      <div className="text-[11px] font-medium text-[#4a5e56]">Nenhum evento próximo</div>
                      <div className="text-[10px] text-[#9aada5] mt-0.5">Você não tem eventos agendados.</div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e4e9e6] p-5 rounded-2xl shadow-sm flex flex-col h-48">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-[#1a2e26] flex items-center gap-2">
                        <ListTodo size={14} className="text-[#00674F]" /> Tarefas em destaque
                      </span>
                      <span onClick={() => setActiveTab('tarefas')} className="text-[11px] font-semibold text-[#00674F] cursor-pointer">Ver todas</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-1.5 text-gray-400">★</div>
                      <div className="text-[11px] font-medium text-[#4a5e56]">Nenhuma tarefa em destaque</div>
                      <div className="text-[10px] text-[#9aada5] mt-0.5">Crie e marque tarefas importantes.</div>
                    </div>
                  </div>
                </div>

                {/* Seus Hábitos */}
                <div className="bg-white border border-[#e4e9e6] p-5 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-[#1a2e26] flex items-center gap-2">
                      <Flame size={14} className="text-[#00674F]" /> Seus hábitos
                    </span>
                    <span className="text-[11px] font-semibold text-[#00674F] cursor-not-allowed opacity-50">Ver relatório</span>
                  </div>
                  <p className="text-[11px] text-[#9aada5] mb-4">Acompanhe seus hábitos diários</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#fafcfb] border border-[#e8ede9] p-3 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-xs font-bold text-[#00674F]">0%</div>
                      <div>
                        <div className="text-[11px] font-bold text-gray-700">Estudar</div>
                        <div className="text-[10px] text-gray-400">0/0 dias</div>
                      </div>
                    </div>
                    <div className="bg-[#fafcfb] border border-[#e8ede9] p-3 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-xs font-bold text-[#D3AF37]">0%</div>
                      <div>
                        <div className="text-[11px] font-bold text-gray-700">Exercícios</div>
                        <div className="text-[10px] text-gray-400">0/0 dias</div>
                      </div>
                    </div>
                    <div className="bg-[#fafcfb] border border-[#e8ede9] p-3 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600">0%</div>
                      <div>
                        <div className="text-[11px] font-bold text-gray-700">Leitura</div>
                        <div className="text-[10px] text-gray-400">0/0 dias</div>
                      </div>
                    </div>
                    <div className="bg-[#fafcfb] border border-[#e8ede9] p-3 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-xs font-bold text-purple-600">0%</div>
                      <div>
                        <div className="text-[11px] font-bold text-gray-700">Projetos</div>
                        <div className="text-[10px] text-gray-400">0/0 dias</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== RENDER: ABA TAREFAS ==================== */}
            {activeTab === 'tarefas' && (
              <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col shadow-sm h-full min-h-[480px]">
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
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <button onClick={() => toggleTaskComplete(task.id, task.is_completed)} className="text-gray-400 hover:text-[#00674F]">{task.is_completed ? <CheckCircle className="text-[#00674F]" size={18} /> : <Circle size={18} />}</button>
                        <p className={`text-xs font-medium text-[#1a2e26] truncate ${task.is_completed ? 'line-through text-gray-400' : ''}`}>{task.title}</p>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 ml-2"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== RENDER: ABA AGENDA ==================== */}
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

            {/* ==================== RENDER: ABA AVISOS ==================== */}
            {activeTab === 'avisos' && (
              <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col shadow-sm space-y-5">

                {/* Topo do Módulo de Avisos */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#e8f5ef] flex items-center justify-center shrink-0">
                      <Megaphone size={18} className="text-[#00674F]" />
                    </div>
                    <div>
                      <div className="text-[15px] font-bold text-[#1a2e26]">Avisos</div>
                      <div className="text-xs text-[#8a9e94] mt-0.5">Confira os comunicados oficiais e importantes da UFA.</div>
                    </div>
                  </div>

                  {/* Barra de Busca e botão de Criação */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar avisos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs bg-[#fafcfb] outline-none w-full sm:w-[180px] focus:border-[#00674F]"
                      />
                    </div>
                    <button
                      onClick={() => setShowNoticeModal(true)}
                      className="bg-[#00674F] hover:bg-[#005040] text-white font-bold rounded-xl px-4 py-2 text-xs shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                    >
                      <Plus size={13} />
                      <span>Criar aviso</span>
                    </button>
                  </div>
                </div>

                {/* Filtros Horizontais por Categorias */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 overflow-x-auto gap-2 scrollbar-none">
                  <div className="flex items-center gap-1.5 shrink-0">
                    {['Todos', 'Acadêmico', 'Administrativo', 'Eventos', 'Bolsas e Oportunidades', 'Infraestrutura'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedCategoryFilter === cat
                          ? 'bg-[#00674F] text-white border-[#00674F] font-bold shadow-sm'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <button className="flex items-center gap-1.5 text-gray-500 font-semibold border rounded-lg px-3 py-1.5 text-xs bg-white hover:bg-gray-50 shrink-0">
                    <SlidersHorizontal size={13} />
                    <span>Filtros</span>
                  </button>
                </div>

                {/* Mural de Avisos Dinâmico */}
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {filteredAnnouncements.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 border border-dashed border-gray-200">
                        <Megaphone size={24} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-700">Mural limpo por enquanto</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">Nenhum aviso publicado. Seja o primeiro a criar um comunicado!</div>
                      </div>
                    </div>
                  ) : (
                    filteredAnnouncements.map((item) => {
                      const style = getNoticeCategoryStyle(item.category);
                      const isOwnNotice = item.user_id === session?.user?.id;
                      return (
                        <div
                          key={item.id}
                          className="bg-white border border-[#e4e9e6] rounded-xl p-4 flex items-center justify-between hover:border-gray-300 transition-all shadow-sm group"
                        >
                          <div className="flex items-start gap-4 min-w-0 flex-1">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                              {style.icon}
                            </div>
                            <div className="min-w-0 flex-1 pr-4">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-gray-800 truncate leading-snug">{item.title}</h4>
                                {item.is_featured && <span className="text-[9px] font-extrabold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-wider">Destaque</span>}
                              </div>
                              <p className="text-[11px] text-gray-500 mt-1 whitespace-pre-wrap leading-relaxed break-words">{item.content}</p>

                              <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 font-medium">
                                <span className={`px-2 py-0.5 rounded-full font-bold ${style.bg} ${style.text}`}>{item.category}</span>
                                <span>Por: <strong className="text-gray-500">{item.username || 'Estudante'}</strong></span>
                                <span>•</span>
                                <span>{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isOwnNotice && (
                              <button
                                onClick={() => handleDeleteNotice(item.id)}
                                className="text-gray-300 hover:text-red-500 p-1.5 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                            <div className="text-gray-300 group-hover:text-[#00674F] p-1 transition-colors">
                              <ArrowRight size={14} />
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ==================== COLUNA DA DIREITA: WIDGETS DE SUPORTE ==================== */}
          <div className="space-y-4">

            {activeTab === 'agenda' ? (
              <>
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-[#1a2e26]">Próximos eventos</span>
                    <span onClick={() => setActiveTab('agenda')} className="text-[11px] font-bold text-[#00674F] cursor-pointer">Ver todos</span>
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
                            <button onClick={() => handleDeleteEvent(ev.id)} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-[#1a2e26]">Calendários</span>
                    <span className="text-[11px] font-bold text-[#00674F] cursor-not-allowed opacity-50">Gerenciar</span>
                  </div>
                  <div className="space-y-3">
                    {Object.keys(visibleCategories).map(cat => {
                      const colors = getCategoryColor(cat);
                      return (
                        <label key={cat} className="flex items-center justify-between cursor-pointer select-none">
                          <div className="flex items-center gap-2.5 text-xs font-medium text-gray-600">
                            <input type="checkbox" checked={visibleCategories[cat]} onChange={() => setVisibleCategories(prev => ({ ...prev, [cat]: !prev[cat] }))} className="rounded border-gray-300 text-[#00674F] w-3.5 h-3.5" />
                            <span>{cat}</span>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                        </label>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : activeTab === 'avisos' ? (
              <>
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-sm flex flex-col">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-800 mb-3">
                    <span className="text-amber-500">★</span> <span>Avisos em destaque</span>
                  </div>
                  {announcements.length === 0 ? (
                    <div className="bg-gray-50/50 rounded-xl p-4 text-center text-[11px] text-gray-400 border border-dashed border-gray-100 py-8">Nenhum aviso em evidência.</div>
                  ) : (
                    <div className="bg-[#e8f5ef] rounded-xl p-4 border border-transparent flex flex-col h-full relative overflow-hidden">
                      <span className="text-[9px] font-extrabold bg-[#00674F] text-white px-2 py-0.5 rounded w-max uppercase tracking-wider mb-2">Destaque</span>
                      <h4 className="text-xs font-bold text-[#00674F] truncate">{featuredNotice?.title}</h4>
                      <p className="text-[11px] text-gray-600 mt-1 line-clamp-3 leading-relaxed">{featuredNotice?.content}</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-sm">
                  <span className="text-xs font-bold text-[#1a2e26] block mb-3.5">Categorias do Mural</span>
                  <div className="space-y-2.5">
                    {['Acadêmico', 'Administrativo', 'Eventos', 'Bolsas e Oportunidades', 'Infraestrutura'].map(name => (
                      <div key={name} className="flex items-center justify-between text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded-lg" onClick={() => setSelectedCategoryFilter(name)}>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">•</span>
                          <span>{name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">{getCategoryCount(name)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* FEED CENTRAL DA UFA */
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
                <button type="button" onClick={() => setShowEventModal(false)} className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-xs font-semibold hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#00674F] text-white rounded-xl text-xs font-bold hover:bg-[#005040]">Salvar evento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL DE CRIAR NOVO AVISO ==================== */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Publicar Comunicado no Mural</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Seu aviso ficará visível imediatamente para toda a comunidade estudantil.</p>
            </div>

            <form onSubmit={handleAddNotice} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">Título do Comunicado</label>
                <input
                  type="text"
                  placeholder="Ex: Inscrições abertas para Monitoria"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs bg-[#fafcfb] outline-none focus:border-[#00674F]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">Conteúdo/Descrição Completa</label>
                <textarea
                  placeholder="Descreva aqui os prazos, links e detalhes do aviso..."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs bg-[#fafcfb] outline-none focus:border-[#00674F] resize-none leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Selecione o Canal/Categoria</label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-[#fafcfb] outline-none cursor-pointer text-gray-600"
                  >
                    <option value="Acadêmico">Acadêmico</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Eventos">Eventos</option>
                    <option value="Bolsas e Oportunidades">Bolsas e Oportunidades</option>
                    <option value="Infraestrutura">Infraestrutura</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4 select-none">
                  <input
                    type="checkbox"
                    id="featNotice"
                    checked={noticeFeatured}
                    onChange={(e) => setNoticeFeatured(e.target.checked)}
                    className="rounded border-gray-300 text-[#00674F] w-3.5 h-3.5 cursor-pointer"
                  />
                  <label htmlFor="featNotice" className="text-xs font-medium text-gray-600 cursor-pointer">Marcar como Destaque</label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNoticeModal(false)} className="px-4 py-2 border text-gray-500 rounded-xl text-xs font-semibold hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#00674F] text-white rounded-xl text-xs font-bold hover:bg-[#005040]">Publicar aviso</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}