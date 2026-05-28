import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
  Plus, CheckCircle, Circle, Trash2, LogOut, Calendar,
  ListTodo, Share2, Send, Home, Megaphone,
  LayoutGrid, BarChart, Settings, ChevronLeft, ChevronDown, Check,
  Bell, Award, Flame, MapPin, Clock, Search, SlidersHorizontal, ArrowRight,
  BookOpen, Building, Users, Wallet, Wrench, Camera, Shield, User, Sliders, ToggleLeft, ToggleRight
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

  // Estados dos Avisos (Mural Dinâmico)
  const [announcements, setAnnouncements] = useState([])
  const [showNoticeModal, setShowNoticeModal] = useState(false)
  const [noticeTitle, setNoticeTitle] = useState('')
  const [noticeContent, setNoticeContent] = useState('')
  const [noticeCategory, setNoticeCategory] = useState('Acadêmico')
  const [noticeFeatured, setNoticeFeatured] = useState(false)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')

  // ==================== ESTADOS DE CONFIGURAÇÃO PERSISTIDOS ====================
  // Valores Oficiais do Header (Só mudam no clique do botão)
  const [headerDisplayName, setHeaderDisplayName] = useState('Estudante')
  const [headerEmail, setHeaderEmail] = useState(session?.user?.email || 'rychardeduardos@gmail.com')

  // Valores de Rascunho (Capturam o que o usuário digita nos inputs sem afetar o header)
  const [draftFullName, setDraftFullName] = useState('Rychard Eduardo')
  const [draftDisplayName, setDraftDisplayName] = useState('Rychard')
  const [draftEmail, setDraftEmail] = useState(session?.user?.email || 'rychardeduardos@gmail.com')
  const [draftCourse, setDraftCourse] = useState('Ciência e Tecnologia')
  const [draftYear, setDraftYear] = useState('2022')

  // Configurações e Toggles Secundários
  const [configSubTab, setConfigSubTab] = useState('Perfil')
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyPush, setNotifyPush] = useState(true)
  const [notifyImportant, setNotifyImportant] = useState(true)
  const [notifyTasks, setNotifyTasks] = useState(true)
  const [notifyDaily, setNotifyDaily] = useState(false)

  const [loading, setLoading] = useState(false)

  // Iniciais do Avatar baseadas no display name ativo no topo
  const avatarInitials = headerDisplayName.slice(0, 2).toUpperCase()

  useEffect(() => {
    fetchProfile()
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

  // ==================== BUSCAR PERFIL DO BANCO DE DADOS ====================
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
        // Alimenta o Header Oficial
        setHeaderDisplayName(data.username || user.email.split('@')[0])
        setHeaderEmail(user.email)

        // Alimenta os campos de Inputs
        setDraftFullName(data.full_name || 'Rychard Eduardo')
        setDraftDisplayName(data.username || user.email.split('@')[0])
        setDraftEmail(user.email)
        setDraftCourse(data.course || 'Ciência e Tecnologia')
        setDraftYear(data.entry_year || '2022')
      } else {
        // Fallback caso não encontre registro na tabela profiles
        setHeaderDisplayName(user.email.split('@')[0])
      }
    } catch (err) {
      console.error('Erro ao buscar dados do perfil:', err)
    }
  }

  // ==================== SALVAR PERFIL E ALTERAR LOGIN ====================
  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = session?.user
      if (!user) return

      // 1. Salva Nome, Curso e Ingresso de forma persistente na tabela profiles
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

      // 2. Verifica se o usuário alterou o e-mail de login para disparar a troca de autenticação
      if (draftEmail.trim() !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: draftEmail.trim()
        })
        if (authError) throw authError
        alert('Uma confirmação de alteração foi enviada para o novo e-mail digitado. Por segurança, valide o link enviado para atualizar seu e-mail de login oficial!')
      }

      // 3. Atualiza os valores estáticos no Header Oficial do app
      setHeaderDisplayName(draftDisplayName)
      setHeaderEmail(draftEmail)

      alert('Configurações salvas e armazenadas no seu aluno com sucesso!')
    } catch (error) {
      alert('Erro ao atualizar configurações: ' + error.message)
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
      .insert([
        {
          user_id: session?.user?.id,
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
          user_id: session?.user?.id,
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
          user_id: session?.user?.id,
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
          user_id: session?.user?.id, 
          title: noticeTitle, 
          content: noticeContent, 
          category: noticeCategory, 
          is_featured: noticeFeatured, 
          username: headerDisplayName 
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

  const pendingTasksCount = tasks.filter(task => !task.is_completed).length

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Acadêmico': return { bg: 'bg-[#e8f5ef]', text: 'text-[#00674F]', border: 'border-[#00674F]', dot: 'bg-[#00674F]' }
      case 'Pessoal': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-500', dot: 'bg-amber-500' }
      case 'PET / Projetos': return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500', dot: 'bg-emerald-400' }
      case 'Esportivo': return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-400', dot: 'bg-gray-400' }
      default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-300', dot: 'bg-gray-300' }
    }
  }

  const getNoticeTheme = (cat) => {
    switch(cat) {
      case 'Acadêmico': return { bg: 'bg-[#e8f5ef]', text: 'text-[#00674F]' }
      case 'Administrativo': return { bg: 'bg-emerald-50', text: 'text-emerald-700' }
      case 'Eventos': return { bg: 'bg-amber-50', text: 'text-amber-600' }
      case 'Bolsas e Oportunidades': return { bg: 'bg-blue-50', text: 'text-blue-600' }
      case 'Infraestrutura': return { bg: 'bg-orange-50', text: 'text-orange-600' }
      default: return { bg: 'bg-gray-50', text: 'text-gray-600' }
    }
  }

  const filteredAnnouncements = announcements.filter(item => {
    const matchCategory = selectedCategoryFilter === 'Todos' || item.category === selectedCategoryFilter;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  })

  const featuredNotice = announcements.find(item => item.is_featured) || announcements[0];
  const getCategoryCount = (cat) => announcements.filter(item => item.category === cat).length;

  return (
    <div className="flex flex-col h-screen bg-[#F5F7F6] min-h-[640px] font-sans antialiased overflow-hidden">

      {/* ==================== HEADER (FIXADO SEGURO) ==================== */}
      <header className="bg-gradient-to-br from-[#003d2e] via-[#00674F] to-[#005040] px-7 h-24 flex items-center justify-between relative overflow-hidden shrink-0 shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.04)_1px,_transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-72 h-56 rounded-full border-2 border-[rgba(211,175,55,0.25)] pointer-events-none" />

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
            <span className="text-xs text-white/70">Personalize sua experiência e gerencie suas preferências.</span>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2.5 bg-white/10 border border-white/15 rounded-full py-1.5 pl-1.5 pr-3.5 backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D3AF37] to-[#a88620] flex items-center justify-center text-xs font-semibold text-white shrink-0 shadow-sm">
              {avatarInitials}
            </div>
            <div className="text-white hidden sm:block">
              <span className="text-xs font-medium block">{headerDisplayName}</span>
              <span className="text-[10px] text-white/60 block truncate max-w-[140px]">{headerEmail}</span>
            </div>
            <ChevronDown size={14} className="text-white/50 ml-0.5" />
          </div>
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1.5 bg-gradient-to-br from-[#D3AF37] to-[#b8942a] text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-sm"><LogOut size={14} /><span>Sair</span></button>
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
          <button onClick={() => setActiveTab('configuracoes')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'configuracoes' ? 'bg-[#00674F] text-white shadow-sm' : 'text-[#5a6b63] hover:bg-[#f0f5f2]'}`}><Settings size={16} /><span>Configurações</span></button>
        </aside>

        {/* CONTEÚDO PRINCIPAL DINÂMICO */}
        <main className="flex-1 p-[22px] grid grid-cols-1 lg:grid-cols-3 gap-[18px] overflow-auto">
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* ABA INÍCIO */}
            {activeTab === 'inicio' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 flex justify-between items-center shadow-sm">
                  <div>
                    <h2 className="text-[17px] font-bold text-[#1a2e26]">Olá, {headerDisplayName}! 👋</h2>
                    <p className="text-xs text-[#8a9e94]">Aqui está um resumo do seu dia na UFA.</p>
                  </div>
                </div>
              </div>
            )}

            {/* CONFIGURAÇÕES (REATIVO E PERSISTIDO) */}
            {activeTab === 'configuracoes' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col shadow-sm">
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-[#e8f5ef] flex items-center justify-center shrink-0"><Settings size={18} className="text-[#00674F]" /></div>
                    <div>
                      <div className="text-[15px] font-bold text-[#1a2e26]">Configurações</div>
                      <div className="text-xs text-[#8a9e94] mt-0.5">Gerencie suas preferências e personalize sua experiência no UFA Organizei.</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 border-b border-gray-100 pb-3 mb-6 overflow-x-auto scrollbar-none">
                    {['Perfil', 'Notificações', 'Preferências', 'Categorias', 'Integrações', 'Segurança', 'Área de Trabalho'].map(subTab => (
                      <button key={subTab} onClick={() => setConfigSubTab(subTab)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${configSubTab === subTab ? 'bg-[#00674F] text-white border-[#00674F] font-bold' : 'bg-white text-gray-500 border-gray-200'}`}>{subTab}</button>
                    ))}
                  </div>

                  {/* FORMULÁRIO COM DRAFT STATES ISOLADOS */}
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xs font-bold text-gray-800">Informações do perfil</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">Atualize seus dados pessoais e informações de contato.</p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="w-20 h-20 rounded-full bg-[#003d2e] flex items-center justify-center text-sm font-bold text-white border-2 border-white shadow-md">
                        {draftDisplayName.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 block mb-1">Nome completo</label>
                          <input type="text" value={draftFullName} onChange={(e) => setDraftFullName(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-[#fafcfb] text-gray-700 outline-none focus:border-[#00674F]" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 block mb-1">Nome de exibição</label>
                          <input type="text" value={draftDisplayName} onChange={(e) => setDraftDisplayName(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-[#fafcfb] text-gray-700 outline-none focus:border-[#00674F]" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 block mb-1">E-mail (Altera o login oficial)</label>
                          <input type="email" value={draftEmail} onChange={(e) => setDraftEmail(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-[#fafcfb] text-gray-700 outline-none focus:border-[#00674F]" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">Curso</label>
                            <input type="text" value={draftCourse} onChange={(e) => setDraftCourse(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-[#fafcfb] text-gray-700 outline-none" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">Ingresso</label>
                            <input type="text" value={draftYear} onChange={(e) => setDraftYear(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-[#fafcfb] text-gray-700 outline-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-gray-50">
                      <button type="submit" disabled={loading} className="bg-[#00674F] hover:bg-[#005040] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm disabled:opacity-50">
                        {loading ? 'Salvando...' : 'Salvar alterações'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA MANTIDA CONFORME O DESIGN */}
          <div className="space-y-4">
            {activeTab === 'configuracoes' && (
              <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-sm flex flex-col">
                <h3 className="text-xs font-bold text-gray-800">Notificações</h3>
                <p className="text-[10px] text-gray-400 mt-0.5 mb-4">Escolha como e quando deseja ser notificado.</p>
                <div className="space-y-4 text-xs font-medium text-gray-600">
                  <div className="flex justify-between items-center"><span>E-mail</span><ToggleRight size={24} className="text-[#00674F]" /></div>
                  <div className="flex justify-between items-center"><span>Push</span><ToggleRight size={24} className="text-[#00674F]" /></div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}