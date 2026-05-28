import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
  Plus, CheckCircle, Circle, Trash2, LogOut, Calendar,
  ListTodo, Share2, Send, Home, Megaphone,
  LayoutGrid, BarChart, Settings, ChevronLeft, ChevronDown, Check,
  Bell, Award, Flame, MapPin, Clock, Search, SlidersHorizontal, BookOpen, Building, Users, Wallet, Wrench, ArrowRight
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
  const [visibleCategories, setVisibleCategories] = useState({
    'Acadêmico': true, 'Pessoal': true, 'PET / Projetos': true, 'Esportivo': true
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

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => { fetchPosts() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => { fetchAnnouncements() })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // ==================== LÓGICA DE TAREFAS, FEED E AGENDA ====================
  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (!error) setTasks(data || [])
  }
  const handleAddTask = async (e) => {
    e.preventDefault(); if (!newTaskTitle.trim()) return; setLoading(true)
    const { error } = await supabase.from('tasks').insert([{ user_id: session.user.id, title: newTaskTitle, due_date: newTaskDate || null, is_completed: false }])
    if (!error) { setNewTaskTitle(''); setNewTaskDate(''); fetchTasks() }; setLoading(false)
  }
  const toggleTaskComplete = async (id, currentStatus) => {
    const { error } = await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', id)
    if (!error) fetchTasks()
  }
  const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) fetchTasks()
  }
  const fetchPosts = async () => {
    const { data: pData } = await supabase.from('posts').select('id, content, created_at, user_id').order('created_at', { ascending: false })
    const { data: profData } = await supabase.from('profiles').select('id, username')
    const pMap = {}; profData?.forEach(p => { pMap[p.id] = p.username })
    setPosts(pData?.map(post => ({ ...post, profiles: pMap[post.user_id] ? { username: pMap[post.user_id] } : null })) || [])
  }
  const handleCreatePost = async (e) => {
    e.preventDefault(); if (!newPostContent.trim()) return
    const { error } = await supabase.from('posts').insert([{ user_id: session.user.id, content: newPostContent }])
    if (!error) { setNewPostContent(''); fetchPosts() }
  }
  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true })
    setEvents(data || [])
  }
  const handleAddEvent = async (e) => {
    e.preventDefault(); if (!newEventTitle.trim() || !newEventDate) return
    const { error } = await supabase.from('events').insert([{ user_id: session.user.id, title: newEventTitle, event_date: newEventDate, event_time: newEventTime || null, location: newEventLocation || null, category: newEventCategory }])
    if (!error) { setNewEventTitle(''); setNewEventTime(''); setNewEventLocation(''); setShowEventModal(false); fetchEvents() }
  }
  const handleDeleteEvent = async (id) => {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (!error) fetchEvents()
  }

  // ==================== LÓGICA DE AVISOS (NOVA MURAL) ====================
  const fetchAnnouncements = async () => {
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (!error) setAnnouncements(data || [])
  }

  const handleAddNotice = async (e) => {
    e.preventDefault(); if (!noticeTitle.trim() || !noticeContent.trim()) return
    const { error } = await supabase.from('announcements').insert([
      { user_id: session.user.id, title: noticeTitle, content: noticeContent, category: noticeCategory, is_featured: noticeFeatured, username: displayFirstName }
    ])
    if (!error) { setNoticeTitle(''); setNoticeContent(''); setNoticeFeatured(false); setShowNoticeModal(false); fetchAnnouncements() }
  }

  const handleDeleteNotice = async (id) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (!error) fetchAnnouncements()
  }

  const pendingTasksCount = tasks.filter(task => !task.is_completed).length

  // Estilizações de Categorias de Avisos (Baseado no Design Oficial)
  const getNoticeCategoryStyle = (cat) => {
    switch (cat) {
      case 'Acadêmico': return { bg: 'bg-[#e8f5ef]', text: 'text-[#00674F]', border: 'border-[#00674F]', icon: <BookOpen size={14} /> }
      case 'Administrativo': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-500', icon: <Building size={14} /> }
      case 'Eventos': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-500', icon: <Users size={14} /> }
      case 'Bolsas e Oportunidades': return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500', icon: <Wallet size={14} /> }
      case 'Infraestrutura': return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-500', icon: <Wrench size={14} /> }
      default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-300', icon: <Megaphone size={14} /> }
    }
  }

  // Filtragem dos avisos baseada nos botões superiores e input de busca
  const filteredAnnouncements = announcements.filter(item => {
    const matchCategory = selectedCategoryFilter === 'Todos' || item.category === selectedCategoryFilter;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  })

  // Encontra o aviso marcado como Destaque recente
  const featuredNotice = announcements.find(item => item.is_featured) || announcements[0];

  // Contadores de categorias para a barra lateral direita
  const getCategoryCount = (cat) => announcements.filter(item => item.category === cat).length;

  const getAgendaCategoryColor = (cat) => {
    switch (cat) {
      case 'Acadêmico': return { bg: 'bg-[#e8f5ef]', text: 'text-[#00674F]', border: 'border-[#00674F]', dot: 'bg-[#00674F]' }
      case 'Pessoal': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-500', dot: 'bg-amber-500' }
      case 'PET / Projetos': return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500', dot: 'bg-emerald-400' }
      case 'Esportivo': return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-400', dot: 'bg-gray-400' }
      default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-300', dot: 'bg-gray-300' }
    }
  }

  const daysInCalendar = [{ dayNumber: 28, isCurrentMonth: false }, { dayNumber: 29, isCurrentMonth: false }, { dayNumber: 30, isCurrentMonth: false }]
  for (let i = 1; i <= 31; i++) { daysInCalendar.push({ dayNumber: i, isCurrentMonth: true, fullDateString: `2024-05-${String(i).padStart(2, '0')}` }) }
  daysInCalendar.push({ dayNumber: 1, isCurrentMonth: false })

  return (
    <div className="flex flex-col h-screen bg-[#F5F7F6] min-h-[640px] font-sans antialiased overflow-hidden">

      {/* ==================== HEADER ==================== */}
      <header className="bg-gradient-to-br from-[#003d2e] via-[#00674F] to-[#005040] px-7 h-24 flex items-center justify-between relative overflow-hidden shrink-0 shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.04)_1px,_transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-72 h-56 rounded-full border-2 border-[rgba(211,175,55,0.25)] pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-13 h-13 bg-white/10 rounded-2xl flex items-center justify-center border border-white/15 backdrop-blur-md p-2.5">
            <svg viewBox="0 0 30 30" fill="none" className="w-8 h-8"><circle cx="10" cy="10" r="7" stroke="white" strokeWidth="1.8" /><circle cx="20" cy="10" r="7" stroke="#D3AF37" strokeWidth="1.8" /><circle cx="15" cy="19" r="7" stroke="white" strokeWidth="1.8" strokeOpacity="0.7" /></svg>
          </div>
          <div className="text-white">
            <h1 className="text-lg font-bold tracking-wide leading-none mb-0.5">UFA ORGANIZEI</h1>
            <span className="text-[#D3AF37] text-xs font-medium tracking-wider">Organizador</span>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2.5 bg-white/10 border border-white/15 rounded-full py-1.5 pl-1.5 pr-3.5 backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D3AF37] to-[#a88620] flex items-center justify-center text-xs font-semibold text-white">{avatarInitials}</div>
            <div className="text-white hidden sm:block"><span className="text-xs font-medium block">{displayFirstName}</span></div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="bg-gradient-to-br from-[#D3AF37] to-[#b8942a] text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-sm flex items-center gap-1.5"><LogOut size={14} /><span>Sair</span></button>
        </div>
      </header>

      {/* ==================== CORPO DA APLICAÇÃO ==================== */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <aside className="w-[200px] shrink-0 bg-white border-r border-[#e8ebe9] py-5 px-3 flex flex-col gap-1 overflow-y-auto hidden md:flex">
          <button onClick={() => setActiveTab('inicio')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'inicio' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2]'}`}><Home size={16} /><span>Início</span></button>
          <button onClick={() => setActiveTab('tarefas')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'tarefas' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2]'}`}><ListTodo size={16} /><span>Tarefas</span></button>
          <button onClick={() => setActiveTab('agenda')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'agenda' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2]'}`}><Calendar size={16} /><span>Agenda</span></button>
          <button onClick={() => setActiveTab('avisos')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'avisos' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2]'}`}><Megaphone size={16} /><span>Avisos</span></button>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed text-xs text-gray-300"><LayoutGrid size={16} /><span>Feed</span></div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed text-xs text-gray-300"><BarChart size={16} /><span>Relatórios</span></div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed text-xs text-gray-300"><Settings size={16} /><span>Configurações</span></div>
        </aside>

        {/* CONTAINER DE TELAS */}
        <main className="flex-1 p-[22px] grid grid-cols-1 lg:grid-cols-3 gap-[18px] overflow-auto">

          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* ABA: INÍCIO */}
            {activeTab === 'inicio' && (
              <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-sm">
                <h2 className="text-[17px] font-bold text-[#1a2e26]">Olá, {displayFirstName}! 👋</h2>
                <p className="text-xs text-[#8a9e94] mt-0.5">Aqui está um resumo do seu dia. Navegue pelas opções na barra lateral.</p>
              </div>
            )}

            {/* ABA: TAREFAS */}
            {activeTab === 'tarefas' && (
              <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col shadow-sm min-h-[400px]">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-[#e8f5ef] flex items-center justify-center"><ListTodo size={18} className="text-[#00674F]" /></div>
                  <div>
                    <div className="text-[15px] font-medium text-[#1a2e26]">Minhas Tarefas Acadêmicas</div>
                    <div className="text-xs text-[#8a9e94]">{pendingTasksCount} tarefas pendentes</div>
                  </div>
                </div>
                <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2.5 mb-5">
                  <input type="text" placeholder="Ex: Estudar para P1 de Física" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#dde5e0] text-xs outline-none focus:border-[#00674F]" required />
                  <input type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} className="px-3 py-2.5 rounded-xl border border-[#dde5e0] text-xs text-[#6a7d74] sm:w-[140px]" />
                  <button type="submit" disabled={loading} className="bg-[#00674F] text-white rounded-xl px-4 py-2.5 text-xs font-semibold shadow-sm hover:bg-[#005040]"><Plus size={14} /></button>
                </form>
                <div className="space-y-2.5 overflow-y-auto max-h-[300px]">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-[#fafcfb] border rounded-xl">
                      <div className="flex items-center space-x-3"><button onClick={() => toggleTaskComplete(t.id, t.is_completed)}>{t.is_completed ? <CheckCircle className="text-[#00674F]" size={18} /> : <Circle size={18} />}</button><p className={`text-xs ${t.is_completed ? 'line-through text-gray-400' : ''}`}>{t.title}</p></div>
                      <button onClick={() => deleteTask(t.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ABA: AGENDA */}
            {activeTab === 'agenda' && (
              <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><Calendar size={18} className="text-[#00674F]" /><span className="text-sm font-bold">Minha Agenda (Maio 2024)</span></div>
                  <button onClick={() => setShowEventModal(true)} className="bg-[#00674F] text-white rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm">+ Novo Evento</button>
                </div>
                <div className="grid grid-cols-7 gap-1 bg-gray-50 border p-1 rounded-xl">
                  {daysInCalendar.map((item, idx) => {
                    const dayEvents = events.filter(e => e.event_date === item.fullDateString);
                    return (
                      <div key={idx} className="min-h-[60px] bg-white p-1 rounded border flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-gray-500">{item.dayNumber}</span>
                        <div className="space-y-0.5 max-h-[40px] overflow-y-auto scrollbar-none">
                          {item.isCurrentMonth && dayEvents.map(ev => (
                            <div key={ev.id} className="text-[8px] bg-[#e8f5ef] text-[#00674F] p-0.5 font-bold rounded truncate">{ev.title}</div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ==================== RENDER: ABA AVISOS (NOVO DESIGN `image_c919ef.png`) ==================== */}
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

                  {/* Barra de Busca integrada */}
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

                {/* Listagem de Avisos Publicados pelos Alunos */}
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {filteredAnnouncements.length === 0 ? (
                    /* Tela Limpa Sem Avisos Fixos (Conforme Planejado) */
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
                            {/* Ícone de Categoria Customizado */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text} border border-transparent`}>
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
                                title="Excluir meu aviso"
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

          {/* ==================== COLUNA DA DIREITA: COMPONENTES DE SUPORTE ==================== */}
          <div className="space-y-4">
            {activeTab === 'avisos' ? (
              <>
                {/* Widget Lateral 1: Destaque Recente */}
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-sm flex flex-col">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-800 mb-3">
                    <span className="text-amber-500">★</span> <span>Avisos em destaque</span>
                  </div>

                  {announcements.length === 0 ? (
                    <div className="bg-gray-50/50 rounded-xl p-4 text-center text-[11px] text-gray-400 border border-dashed border-gray-100 py-8">Nenhum aviso em evidência.</div>
                  ) : (
                    <div className="bg-[#e8f5ef] rounded-xl p-4 border border-transparent flex flex-col h-full relative overflow-hidden">
                      <div className="absolute -right-4 -bottom-4 text-[#00674F] opacity-5 pointer-events-none"><Megaphone size={90} /></div>
                      <span className="text-[9px] font-extrabold bg-[#00674F] text-white px-2 py-0.5 rounded w-max uppercase tracking-wider mb-2">Destaque</span>
                      <h4 className="text-xs font-bold text-[#00674F] truncate">{featuredNotice?.title}</h4>
                      <p className="text-[11px] text-gray-600 mt-1 line-clamp-3 leading-relaxed">{featuredNotice?.content}</p>
                      <button className="mt-4 w-full bg-[#00674F] text-white text-[11px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90 shadow-sm">
                        <span>Saiba mais</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Widget Lateral 2: Contadores de Categorias Dinâmicos */}
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-sm">
                  <span className="text-xs font-bold text-[#1a2e26] block mb-3.5">Categorias</span>
                  <div className="space-y-2.5">
                    {[
                      { name: 'Acadêmico', style: getNoticeCategoryStyle('Acadêmico') },
                      { name: 'Administrativo', style: getNoticeCategoryStyle('Administrativo') },
                      { name: 'Eventos', style: getNoticeCategoryStyle('Eventos') },
                      { name: 'Bolsas e Oportunidades', style: getNoticeCategoryStyle('Bolsas e Oportunidades') },
                      { name: 'Infraestrutura', style: getNoticeCategoryStyle('Infraestrutura') }
                    ].map(cat => (
                      <div key={cat.name} className="flex items-center justify-between text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors" onClick={() => setSelectedCategoryFilter(cat.name)}>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] ${cat.style.bg} ${cat.style.text}`}>{cat.style.icon}</div>
                          <span>{cat.name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">{getCategoryCount(cat.name)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : activeTab === 'agenda' ? (
              <>
                {/* Mantém a barra lateral da agenda */}
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-sm">
                  <span className="text-xs font-bold text-gray-800 block mb-3">Próximos eventos</span>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto">{events.map(ev => (<div key={ev.id} className="p-2.5 bg-gray-50 border rounded-lg flex justify-between items-center"><div className="truncate"><h4 className="text-xs font-bold text-gray-700 truncate">{ev.title}</h4><span className="text-[9px] text-gray-400">{ev.event_date}</span></div><button onClick={() => handleDeleteEvent(ev.id)}><Trash2 size={11} className="text-gray-400 hover:text-red-500" /></button></div>))}</div>
                </div>
              </>
            ) : (
              /* Feed Geral para as abas Início e Tarefas */
              <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col h-full min-h-[400px] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00674F] to-[#D3AF37]" />
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#fdf5e0] flex items-center justify-center"><Megaphone size={18} className="text-[#D3AF37]" /></div>
                  <div><div className="text-[15px] font-medium text-[#1a2e26]">Feed Central da UFA</div><div className="text-[11px] text-[#8a9e94]">Fique por dentro das novidades.</div></div>
                </div>
                <form onSubmit={handleCreatePost} className="flex gap-2 mb-4">
                  <input type="text" placeholder="O que está acontecendo no campus?" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="flex-1 px-3 py-2 border rounded-xl text-xs outline-none focus:border-[#D3AF37]" required />
                  <button type="submit" className="w-9 h-9 rounded-xl bg-[#D3AF37] text-white flex items-center justify-center hover:bg-[#b8942a]"><Send size={14} /></button>
                </form>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {posts.map(p => (
                    <div key={p.id} className="p-3 rounded-xl bg-[#fafcfb] border flex gap-2">
                      <div className="flex-1 min-w-0"><div className="text-xs font-bold text-gray-700">{p.profiles?.username || 'Estudante'}</div><p className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">{p.content}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

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

                <div className="flex items-center gap-2 pt-4 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    id="featNotice"
                    checked={noticeFeatured}
                    onChange={(e) => setNoticeFeatured(e.target.checked)}
                    className="rounded border-gray-300 text-[#00674F] focus:ring-[#00674F] w-3.5 h-3.5 cursor-pointer"
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

      {/* MODAL DE ADICIONAR NOVO EVENTO (MANTIDO) */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border">
            <h3 className="text-sm font-bold text-gray-800">Criar Novo Compromisso</h3>
            <form onSubmit={handleAddEvent} className="space-y-3">
              <input type="text" placeholder="Ex: Prova de Cálculo" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-[#00674F]" required />
              <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs outline-none" required />
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowEventModal(false)} className="px-4 py-2 border text-gray-500 rounded-xl text-xs">Cancelar</button><button type="submit" className="px-4 py-2 bg-[#00674F] text-white rounded-xl text-xs font-bold">Salvar</button></div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}