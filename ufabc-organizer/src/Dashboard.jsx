import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
  Plus, CheckCircle, Circle, Trash2, LogOut, Calendar,
  ListTodo, Home, Megaphone, LayoutGrid, BarChart, Settings,
  ChevronLeft, ChevronDown, Check, Bell, Award, Flame, MapPin,
  Clock, Camera, ToggleRight, Search, Send, SlidersHorizontal,
  X, ArrowDown, Minus, ArrowUp, BookOpen, User, Briefcase
} from 'lucide-react'

export default function Dashboard({ session }) {
  // Estado de Navigation das Abas
  const [activeTab, setActiveTab] = useState('inicio')

  // Estados das Tarefas
  const [tasks, setTasks] = useState([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')

  // Estados Visuais do Modal de Tarefas
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskTime, setNewTaskTime] = useState('')
  const [newTaskDifficulty, setNewTaskDifficulty] = useState('Média')
  const [newTaskLabel, setNewTaskLabel] = useState('Acadêmico')
  const [newTaskReminder, setNewTaskReminder] = useState('Sem lembrete')
  const [newTaskRecurring, setNewTaskRecurring] = useState(false)
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const [taskAttachmentsMap, setTaskAttachmentsMap] = useState({})
  const [taskAttachments, setTaskAttachments] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)

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

  // ==================== LÓGICA DE ANEXOS ====================
  const handleAttachmentAdd = (files) => {
    const allowed = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg']
    const maxSize = 10 * 1024 * 1024 // 10MB
    const newFiles = Array.from(files).filter(f => {
      const ext = f.name.split('.').pop().toLowerCase()
      return allowed.includes(ext) && f.size <= maxSize
    }).map(f => ({ id: Date.now() + Math.random(), name: f.name, size: f.size, type: f.name.split('.').pop().toUpperCase(), file: f }))
    setTaskAttachments(prev => [...prev, ...newFiles])
  }

  const handleAttachmentRemove = (id) => {
    setTaskAttachments(prev => prev.filter(a => a.id !== id))
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // ==================== LÓGICA DE EXPANSÃO DE TAREFAS ====================
  const toggleExpandTask = async (taskId) => {
    if (expandedTaskId === taskId) { setExpandedTaskId(null); return }
    setExpandedTaskId(taskId)
    if (taskAttachmentsMap[taskId]) return // já carregado
    const { data, error } = await supabase
      .from('task_attachments')
      .select('*')
      .eq('task_id', taskId)
    if (!error) setTaskAttachmentsMap(prev => ({ ...prev, [taskId]: data || [] }))
  }

  const handleDownloadAttachment = async (att) => {
    const { data } = await supabase.storage.from('task-attachments').createSignedUrl(att.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const handleDeleteAttachment = async (att, taskId) => {
    await supabase.storage.from('task-attachments').remove([att.storage_path])
    await supabase.from('task_attachments').delete().eq('id', att.id)
    setTaskAttachmentsMap(prev => ({ ...prev, [taskId]: prev[taskId].filter(a => a.id !== att.id) }))
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
    try {
      // 1. Cria a tarefa
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert([{
          user_id: session.user.id,
          title: newTaskTitle,
          due_date: newTaskDate || null,
          is_completed: false,
          difficulty: newTaskDifficulty
        }])
        .select('id')
        .single()
      if (taskError) throw taskError

      // 2. Upload dos anexos
      for (const att of taskAttachments) {
        if (!att.file) continue
        const path = `${session.user.id}/${taskData.id}/${Date.now()}_${att.name}`
        const { error: storageError } = await supabase.storage
          .from('task-attachments')
          .upload(path, att.file)
        if (storageError) { console.error('Upload falhou:', storageError.message); continue }
        await supabase.from('task_attachments').insert([{
          task_id: taskData.id,
          user_id: session.user.id,
          file_name: att.name,
          file_type: att.type,
          file_size: att.size,
          storage_path: path
        }])
      }

      // 3. Reset
      setNewTaskTitle('')
      setNewTaskDate('')
      setNewTaskDescription('')
      setNewTaskTime('')
      setNewTaskDifficulty('Média')
      setTaskAttachments([])
      setShowTaskModal(false)
      fetchTasks()
    } catch (err) {
      alert('Erro ao criar tarefa: ' + err.message)
    }
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

            {/* ==================== ABA INÍCIO (DESIGN PREMIUM + DADOS AO VIVO) ==================== */}
            {activeTab === 'inicio' && (
              <div className="space-y-5 animate-fade-in">

                {/* Header Solto */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1a2e26]">Olá, {headerDisplayName}! 👋</h2>
                    <p className="text-sm text-[#8a9e94] mt-1">Aqui está um resumo do seu dia na UFA.</p>
                  </div>
                  <button onClick={() => setActiveTab('tarefas')} className="text-sm font-semibold text-[#00674F] border-2 border-[#e8f5ef] rounded-xl px-5 py-2.5 hover:bg-[#f0f5f2] transition-colors shadow-sm">
                    Ver todas as tarefas
                  </button>
                </div>

                {/* Grid 4 Cards Superiores (Com Contadores Reais) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#e4e9e6] p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#e8f5ef] flex items-center justify-center shrink-0">
                      <ListTodo size={22} className="text-[#00674F]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-[#1a2e26] leading-none mb-1">{pendingTasksCount}</span>
                      <span className="text-[13px] font-bold text-[#1a2e26]">Tarefas pendentes</span>
                      <span className="text-[11px] text-[#8a9e94] mt-0.5">{pendingTasksCount === 0 ? 'Nada para fazer! 🎉' : 'Foque e termine!'}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e4e9e6] p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('agenda')}>
                    <div className="w-12 h-12 rounded-2xl bg-[#fdf5e0] flex items-center justify-center shrink-0">
                      <Calendar size={22} className="text-[#D3AF37]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-[#1a2e26] leading-none mb-1">{events.length}</span>
                      <span className="text-[13px] font-bold text-[#1a2e26]">Eventos agendados</span>
                      <span className="text-[11px] text-[#8a9e94] mt-0.5">{events.length === 0 ? 'Agenda livre' : 'Fique de olho!'}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e4e9e6] p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#e8f5ef] flex items-center justify-center shrink-0">
                      <Bell size={22} className="text-[#00674F]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-[#1a2e26] leading-none mb-1">2</span>
                      <span className="text-[13px] font-bold text-[#1a2e26]">Avisos não lidos</span>
                      <span className="text-[11px] text-[#8a9e94] mt-0.5">Fique por dentro</span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e4e9e6] p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#fdf5e0] flex items-center justify-center shrink-0">
                      <BarChart size={22} className="text-[#D3AF37]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-[#1a2e26] leading-none mb-1">85%</span>
                      <span className="text-[13px] font-bold text-[#1a2e26]">Produtividade</span>
                      <span className="text-[11px] text-[#8a9e94] mt-0.5">Continue assim!</span>
                    </div>
                  </div>
                </div>

                {/* Sessão do Meio (Próximos Eventos & Tarefas em Destaque Dinâmicos) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* Próximos Eventos Ao Vivo */}
                  <div className="bg-white border border-[#e4e9e6] p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col h-[280px]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[15px] font-bold text-[#1a2e26] flex items-center gap-2.5">
                        <Calendar size={18} className="text-[#00674F]" /> Próximos eventos
                      </span>
                      <span onClick={() => setActiveTab('agenda')} className="text-xs font-bold text-[#00674F] cursor-pointer hover:underline">Ver agenda</span>
                    </div>

                    {events.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center mt-2">
                        <div className="relative mb-4">
                          <div className="w-[72px] h-[72px] rounded-full bg-[#e8f5ef] flex items-center justify-center text-[#00674F] opacity-70">
                            <Calendar size={32} strokeWidth={1.5} />
                          </div>
                          <div className="absolute right-0 bottom-0 w-7 h-7 bg-[#D3AF37] text-white rounded-full flex items-center justify-center border-[3px] border-white shadow-sm">
                            <Check size={14} strokeWidth={4} />
                          </div>
                        </div>
                        <h4 className="text-[14px] font-bold text-[#1a2e26]">Nenhum evento próximo</h4>
                        <p className="text-[12px] text-[#8a9e94] mt-1 max-w-[240px]">Você não tem eventos agendados para os próximos dias.</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto mt-2 space-y-2.5 pr-1 scrollbar-none">
                        {events.slice(0, 3).map(ev => {
                          const style = getCategoryStyle(ev.category);
                          return (
                            <div key={ev.id} className="p-3 bg-[#fafcfb] border border-[#e8ede9] rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                                  <Calendar size={16} />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-[13px] font-bold text-[#1a2e26] truncate">{ev.title}</h4>
                                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">{ev.event_date} {ev.event_time ? `- ${ev.event_time}` : ''}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Tarefas em destaque Ao Vivo */}
                  <div className="bg-white border border-[#e4e9e6] p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col h-[280px]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[15px] font-bold text-[#1a2e26] flex items-center gap-2.5">
                        <ListTodo size={18} className="text-[#00674F]" /> Tarefas em destaque
                      </span>
                      <span onClick={() => setActiveTab('tarefas')} className="text-xs font-bold text-[#00674F] cursor-pointer hover:underline">Ver todas</span>
                    </div>

                    {pendingTasksCount === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center mt-2">
                        <div className="relative mb-4">
                          <div className="w-[72px] h-[72px] rounded-full bg-[#e8f5ef] flex items-center justify-center text-[#00674F] opacity-70">
                            <ListTodo size={32} strokeWidth={1.5} />
                          </div>
                          <div className="absolute right-0 bottom-0 w-7 h-7 bg-[#D3AF37] text-white rounded-full flex items-center justify-center border-[3px] border-white shadow-sm">
                            <Check size={14} strokeWidth={4} />
                          </div>
                        </div>
                        <h4 className="text-[14px] font-bold text-[#1a2e26]">Nenhuma tarefa em destaque</h4>
                        <p className="text-[12px] text-[#8a9e94] mt-1 max-w-[240px]">Crie e destaque tarefas importantes para aparecerem aqui.</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto mt-2 space-y-2.5 pr-1 scrollbar-none">
                        {tasks.filter(t => !t.is_completed).slice(0, 3).map(task => (
                          <div key={task.id} className="p-3 bg-[#fafcfb] border border-[#e8ede9] rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-[#e8f5ef] text-[#00674F] flex items-center justify-center shrink-0">
                                <ListTodo size={16} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[13px] font-bold text-[#1a2e26] truncate">{task.title}</h4>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">{task.due_date ? `Prazo: ${task.due_date}` : 'Sem prazo definido'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sessão Inferior (Hábitos - Mantida como o Design) */}
                <div className="bg-white border border-[#e4e9e6] p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[15px] font-bold text-[#1a2e26] flex items-center gap-2.5">
                        <BarChart size={18} className="text-[#00674F]" /> Seus hábitos
                      </span>
                      <p className="text-[12px] text-[#8a9e94] mt-1">Acompanhe seus hábitos diários</p>
                    </div>
                    <button className="text-xs font-semibold text-[#00674F] border border-[#e4e9e6] rounded-xl px-4 py-2 hover:bg-[#f0f5f2] transition-colors shadow-sm">
                      Ver relatório
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#fafcfb] border border-[#e8ede9] p-4 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-4 border-[#e8f5ef] flex items-center justify-center text-[11px] font-bold text-gray-400 shrink-0">0%</div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-[#1a2e26]">Estudar</span>
                        <span className="text-[10px] text-gray-400 font-medium">0%</span>
                        <span className="text-[10px] text-gray-400">0/0 dias</span>
                      </div>
                    </div>
                    <div className="bg-[#fafcfb] border border-[#e8ede9] p-4 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-4 border-[#e8f5ef] flex items-center justify-center text-[11px] font-bold text-gray-400 shrink-0">0%</div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-[#1a2e26]">Exercícios</span>
                        <span className="text-[10px] text-gray-400 font-medium">0%</span>
                        <span className="text-[10px] text-gray-400">0/0 dias</span>
                      </div>
                    </div>
                    <div className="bg-[#fafcfb] border border-[#e8ede9] p-4 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-4 border-[#e8f5ef] flex items-center justify-center text-[11px] font-bold text-gray-400 shrink-0">0%</div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-[#1a2e26]">Leitura</span>
                        <span className="text-[10px] text-gray-400 font-medium">0%</span>
                        <span className="text-[10px] text-gray-400">0/0 dias</span>
                      </div>
                    </div>
                    <div className="bg-[#fafcfb] border border-[#e8ede9] p-4 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-4 border-[#e8f5ef] flex items-center justify-center text-[11px] font-bold text-gray-400 shrink-0">0%</div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-[#1a2e26]">Projetos</span>
                        <span className="text-[10px] text-gray-400 font-medium">0%</span>
                        <span className="text-[10px] text-gray-400">0/0 dias</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ==================== ABA TAREFAS (DESIGN PREMIUM FIEL AOS ANEXOS 2 E 3) ==================== */}
            {activeTab === 'tarefas' && (
              <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col shadow-sm h-full min-h-[480px] animate-fade-in">

                {/* Header Superior */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#e8f5ef] flex items-center justify-center shrink-0">
                      <ListTodo size={22} className="text-[#00674F]" />
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold text-[#1a2e26] leading-none mb-1">Minhas Tarefas</h2>
                      <p className="text-[12px] text-[#8a9e94]">Organize, priorize e conclua suas atividades.</p>
                    </div>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Buscar tarefas..." className="w-full pl-9 pr-4 py-2.5 border border-[#dde5e0] rounded-xl text-xs bg-[#fafcfb] outline-none focus:border-[#00674F] transition-colors" />
                  </div>
                </div>

                {/* Barra de Filtros e Ações */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
                    <button className="px-3.5 py-1.5 bg-[#00674F] text-white rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap shadow-sm">
                      Todas <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{tasks.length}</span>
                    </button>
                    <button className="px-3.5 py-1.5 bg-white border border-[#dde5e0] text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors">
                      Pendentes <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">{pendingTasksCount}</span>
                    </button>
                    <button className="px-3.5 py-1.5 bg-white border border-[#dde5e0] text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors">
                      Concluídas <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">{tasks.length - pendingTasksCount}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="px-3.5 py-1.5 bg-white border border-[#dde5e0] text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                      <SlidersHorizontal size={14} /> Filtros
                    </button>
                    {/* BOTÃO QUE ABRE O MODAL */}
                    <button onClick={() => setShowTaskModal(true)} className="px-4 py-1.5 bg-[#00674F] text-white rounded-lg text-xs font-bold hover:bg-[#005040] transition-colors shadow-sm flex items-center gap-1.5">
                      <Plus size={14} /> Adicionar tarefa
                    </button>
                  </div>
                </div>

                {/* Lista de Tarefas (Estilo Tabela Rica) */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
                  <div className="space-y-2.5">
                    {/* Cabeçalho da Seção de Lista */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                      <div className="flex items-center gap-2 text-[13px] font-bold text-[#1a2e26]">
                        <ChevronDown size={16} /> Suas tarefas
                        <span className="text-gray-400 font-medium text-xs ml-1">• {tasks.length} itens</span>
                      </div>
                    </div>

                    {/* Cards Renderizados — Accordion */}
                    {tasks.length === 0 ? (
                      <p className="text-center text-gray-400 text-xs py-8">Nenhuma tarefa criada.</p>
                    ) : (
                      tasks.map((task) => {
                        const isExpanded = expandedTaskId === task.id
                        const atts = taskAttachmentsMap[task.id] || []
                        const diffColor = task.difficulty === 'Alta' ? 'bg-red-500' : task.difficulty === 'Baixa' ? 'bg-emerald-500' : 'bg-amber-500'
                        const diffBadge = task.difficulty === 'Alta'
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : task.difficulty === 'Baixa'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'

                        return (
                          <div key={task.id} className={`border rounded-xl transition-all overflow-hidden ${task.is_completed ? 'border-gray-100' : isExpanded ? 'border-[#00674F] shadow-[0_0_0_3px_rgba(0,103,79,0.06)]' : 'border-[#e8ede9] hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]'}`}>

                            {/* ── LINHA PRINCIPAL ── */}
                            <div
                              className="flex items-center justify-between p-3 bg-white cursor-pointer group"
                              onClick={() => toggleExpandTask(task.id)}
                            >
                              {/* Check + Ícone + Título + Tag */}
                              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                <button onClick={(e) => { e.stopPropagation(); toggleTaskComplete(task.id, task.is_completed) }} className="shrink-0 transition-transform active:scale-90">
                                  {task.is_completed ? <CheckCircle className="text-[#00674F]" size={20} /> : <Circle size={20} className="text-gray-300 hover:text-gray-400" />}
                                </button>
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${task.is_completed ? 'bg-gray-50 text-gray-400' : 'bg-[#e8f5ef] text-[#00674F]'}`}>
                                  <ListTodo size={16} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className={`text-[13px] font-bold truncate ${task.is_completed ? 'text-gray-400 line-through' : 'text-[#1a2e26]'}`}>{task.title}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${task.is_completed ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-[#e8f5ef] text-[#00674F] border-[#a3d9c9]'}`}>{task.label || 'Acadêmico'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Metadados */}
                              <div className="flex items-center gap-5 shrink-0 hidden lg:flex ml-4">
                                <div className="flex items-center gap-1.5 w-20">
                                  <span className={`w-1.5 h-1.5 rounded-full ${task.is_completed ? 'bg-gray-300' : diffColor}`}></span>
                                  <span className={`text-[11px] font-bold ${task.is_completed ? 'text-gray-400' : 'text-gray-600'}`}>{task.difficulty || 'Média'}</span>
                                </div>
                                <div className={`flex items-center gap-1.5 w-24 text-[11px] font-semibold ${task.is_completed ? 'text-gray-400' : 'text-gray-500'}`}>
                                  <Calendar size={12} />
                                  <span className="truncate">{task.due_date || 'Sem prazo'}</span>
                                </div>
                                <div className="w-24 flex justify-start">
                                  {task.is_completed
                                    ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md flex items-center gap-1"><Check size={10} /> Concluída</span>
                                    : <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-md flex items-center gap-1"><Clock size={10} /> Pendente</span>
                                  }
                                </div>
                              </div>

                              {/* Ações: lixeira + chevron */}
                              <div className="flex items-center gap-1 ml-2 shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }} className="text-gray-300 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-red-50">
                                  <Trash2 size={14} />
                                </button>
                                <div className={`p-1.5 rounded-md transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#00674F]' : 'text-gray-400'}`}>
                                  <ChevronDown size={15} />
                                </div>
                              </div>
                            </div>

                            {/* ── ÁREA EXPANDIDA ── */}
                            {isExpanded && (
                              <div className="border-t border-[#e8ede9] bg-[#fafcfb] px-5 py-4 space-y-5">

                                {/* Descrição */}
                                {task.description && (
                                  <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Descrição</p>
                                    <p className="text-[13px] text-[#5a6b63] leading-relaxed">{task.description}</p>
                                  </div>
                                )}

                                {/* Grid de info */}
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Informações da atividade</p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-white border border-[#e8ede9] rounded-xl p-3">
                                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1"><Calendar size={11} /> Data</div>
                                      <p className="text-[12px] font-semibold text-[#1a2e26]">{task.due_date || '—'}</p>
                                    </div>
                                    <div className="bg-white border border-[#e8ede9] rounded-xl p-3">
                                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1"><Clock size={11} /> Horário</div>
                                      <p className="text-[12px] font-semibold text-[#1a2e26]">{task.task_time || '—'}</p>
                                    </div>
                                    <div className="bg-white border border-[#e8ede9] rounded-xl p-3">
                                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1"><Flame size={11} /> Dificuldade</div>
                                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${diffBadge}`}>{task.difficulty || 'Média'}</span>
                                    </div>
                                    <div className="bg-white border border-[#e8ede9] rounded-xl p-3">
                                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1"><Award size={11} /> Etiqueta</div>
                                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border bg-[#e8f5ef] text-[#00674F] border-[#a3d9c9]">{task.label || 'Acadêmico'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Anexos */}
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Anexos {atts.length > 0 && <span className="text-gray-300 font-medium normal-case">({atts.length})</span>}
                                  </p>
                                  {atts.length === 0 ? (
                                    <p className="text-[12px] text-gray-400">Nenhum anexo.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {atts.map(att => (
                                        <div key={att.id} className="flex items-center gap-3 bg-white border border-[#e8ede9] rounded-xl px-3 py-2.5">
                                          <div className="w-8 h-8 rounded-lg bg-[#e8f5ef] flex items-center justify-center shrink-0">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00674F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                                            </svg>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-semibold text-[#1a2e26] truncate">{att.file_name}</p>
                                            <p className="text-[10px] text-gray-400">{att.file_type} • {att.file_size < 1048576 ? (att.file_size / 1024).toFixed(0) + ' KB' : (att.file_size / 1048576).toFixed(1) + ' MB'}</p>
                                          </div>
                                          <button onClick={() => handleDownloadAttachment(att)} className="p-1.5 text-gray-400 hover:text-[#00674F] hover:bg-[#e8f5ef] rounded-lg transition-colors" title="Download">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                          </button>
                                          {task.user_id === session.user.id && (
                                            <button onClick={() => handleDeleteAttachment(att, task.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remover">
                                              <Trash2 size={13} />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Lembrete */}
                                {task.reminder && task.reminder !== 'Sem lembrete' && (
                                  <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Lembrete</p>
                                    <div className="flex items-center gap-2 text-[12px] text-[#5a6b63]">
                                      <Bell size={13} className="text-[#D3AF37]" /> {task.reminder}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
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

          {/* ==================== COLUNA DA DIREITA (DESIGN PREMIUM FIEL AO ANEXO 2) ==================== */}
          <div className="space-y-6">
            {activeTab === 'agenda' ? (
              <>
                {/* Bloco Lateral: Próximos Eventos (Títulos Flutuantes e Cards Individuais) */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <span className="text-[15px] font-bold text-[#1a2e26]">Próximos eventos</span>
                    <span className="text-[11px] font-bold text-[#00674F] cursor-pointer hover:underline">Ver todos</span>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto scrollbar-none pr-1 pb-2">
                    {events.length === 0 ? (
                      <p className="text-center text-gray-400 text-xs py-8">Nenhum evento criado.</p>
                    ) : (
                      events.map(ev => {
                        const style = getCategoryStyle(ev.category);

                        // Formatação de data mockada para o visual premium (ex: "03 Mai")
                        const dateObj = new Date(ev.event_date);
                        dateObj.setDate(dateObj.getDate() + 1); // Correção simples de timezone
                        const month = dateObj.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
                        const displayDate = `${String(dateObj.getDate()).padStart(2, '0')} ${month.charAt(0).toUpperCase() + month.slice(1)}`;

                        return (
                          <div key={ev.id} className="bg-white p-3.5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#e8ede9] flex items-center justify-between group transition-all hover:shadow-md cursor-pointer relative overflow-hidden">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                                <Calendar size={18} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[13px] font-bold text-[#1a2e26] truncate">{ev.title}</h4>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                  {ev.location ? ev.location : ev.category}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end shrink-0 pl-3">
                              <span className="text-[11px] font-bold text-gray-600">{displayDate}</span>
                              {ev.event_time && <span className="text-[11px] text-gray-400 font-medium mt-0.5">{ev.event_time}</span>}
                            </div>

                            {/* Botão de deletar escondido que aparece apenas no hover */}
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev.id); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-50 text-red-500 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-100">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Bloco Lateral: Calendários (Container Branco Único com Checkboxes Customizados) */}
                <div className="flex flex-col mt-2">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <span className="text-[15px] font-bold text-[#1a2e26]">Calendários</span>
                    <span className="text-[11px] font-bold text-[#00674F] cursor-pointer hover:underline">Gerenciar</span>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#e8ede9] p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-1">
                    {Object.keys(visibleCategories).map(cat => {
                      const style = getCategoryStyle(cat);
                      return (
                        <label key={cat} className="flex items-center justify-between cursor-pointer select-none p-2.5 rounded-xl hover:bg-[#fafcfb] transition-colors">
                          <div className="flex items-center gap-3.5 text-[13px] font-semibold text-gray-700">
                            {/* Checkbox customizado idêntico ao design */}
                            <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${visibleCategories[cat] ? 'bg-[#00674F] border-[#00674F]' : 'border-gray-300'}`}>
                              {visibleCategories[cat] && <Check size={12} strokeWidth={3} className="text-white" />}
                            </div>
                            <input
                              type="checkbox"
                              checked={visibleCategories[cat]}
                              onChange={(e) => setVisibleCategories(prev => ({ ...prev, [cat]: e.target.checked }))}
                              className="hidden"
                            />
                            <span>{cat}</span>
                          </div>
                          <div className={`w-2 h-2 rounded-full shadow-sm ${style.dot}`} />
                        </label>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : activeTab === 'tarefas' ? (

              /* ==================== VISÃO GERAL DE TAREFAS ==================== */
              <div className="space-y-6 animate-fade-in">
                {/* Card Visão Geral */}
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <div className="flex justify-between items-center mb-5 px-1">
                    <span className="text-[15px] font-bold text-[#1a2e26]">Visão geral</span>
                    <span className="text-[11px] font-bold text-[#00674F] cursor-pointer hover:underline">Ver detalhes</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-[#fafcfb] border border-[#e8ede9] p-3.5 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[#00674F]" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total</span>
                      </div>
                      <span className="text-xl font-bold text-[#1a2e26] leading-none">{tasks.length}</span>
                    </div>

                    <div className="bg-[#fafcfb] border border-[#e8ede9] p-3.5 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pendentes</span>
                      </div>
                      <span className="text-xl font-bold text-[#1a2e26] leading-none">{pendingTasksCount}</span>
                    </div>

                    <div className="bg-[#fafcfb] border border-[#e8ede9] p-3.5 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-[#00674F]" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Concluídas</span>
                      </div>
                      <span className="text-xl font-bold text-[#1a2e26] leading-none">{tasks.length - pendingTasksCount}</span>
                    </div>

                    <div className="bg-[#fafcfb] border border-[#e8ede9] p-3.5 rounded-xl flex flex-col gap-2 opacity-50">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Atrasadas</span>
                      </div>
                      <span className="text-xl font-bold text-gray-400 leading-none">0</span>
                    </div>
                  </div>

                  {/* Barra de Progresso Real */}
                  <div className="px-1">
                    <div className="flex justify-between text-[11px] font-bold mb-2">
                      <span className="text-gray-600">Progresso geral</span>
                      <span className="text-[#00674F] text-[13px]">{tasks.length ? Math.round(((tasks.length - pendingTasksCount) / tasks.length) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-[#00674F] h-full rounded-full transition-all duration-500" style={{ width: `${tasks.length ? ((tasks.length - pendingTasksCount) / tasks.length) * 100 : 0}%` }}></div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">{tasks.length - pendingTasksCount} de {tasks.length} tarefas concluídas</p>
                  </div>
                </div>

                {/* Card de Etiquetas/Categorias */}
                <div className="bg-white rounded-2xl border border-[#e4e9e6] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <span className="text-[15px] font-bold text-[#1a2e26]">Etiquetas</span>
                    <span className="text-[11px] font-bold text-[#00674F] cursor-pointer hover:underline">Gerenciar</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 bg-[#e8f5ef] text-[#00674F] text-[10px] font-bold rounded-lg border border-[#a3d9c9] cursor-pointer hover:bg-[#d1ebe0] transition-colors">Acadêmico <span className="ml-1 opacity-60">12</span></span>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors">Pessoal <span className="ml-1 opacity-60">3</span></span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors">Projeto <span className="ml-1 opacity-60">2</span></span>
                  </div>
                </div>
              </div>
            ) : (
              /* FEED CENTRAL (OUTRAS ABAS) */
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

      {/* ==================== MODAL DE CRIAR NOVA TAREFA (NOVO PREMIUM) ==================== */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-[600px] w-full p-6 shadow-xl flex flex-col max-h-[90vh] overflow-y-auto scrollbar-thin border border-gray-100">

            {/* Header Modal */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#1a2e26]">Adicionar tarefa</h3>
                <p className="text-xs text-gray-500 mt-1">Preencha os dados para criar uma nova tarefa.</p>
              </div>
              <button onClick={() => { setShowTaskModal(false); setTaskAttachments([]) }} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-1.5 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddTask} className="space-y-5">

              {/* Linha 1: Título + Descrição lado a lado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome da tarefa */}
                <div>
                  <label className="text-[11px] font-bold text-[#1a2e26] block mb-1.5">Nome da tarefa <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Ex: Estudar para Prova de Cálculo I" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] bg-[#fafcfb] outline-none focus:border-[#00674F] focus:bg-white transition-colors" required />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">{newTaskTitle.length}/100</span>
                  </div>
                </div>
                {/* Descrição */}
                <div>
                  <label className="text-[11px] font-bold text-[#1a2e26] block mb-1.5">Descrição <span className="text-gray-400 font-medium">(opcional)</span></label>
                  <div className="relative">
                    <textarea value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Adicione mais detalhes sobre esta tarefa..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] bg-[#fafcfb] outline-none focus:border-[#00674F] focus:bg-white transition-colors min-h-[80px] resize-none"></textarea>
                    <span className="absolute right-3 bottom-3 text-[10px] text-gray-400">{newTaskDescription.length}/500</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Data e Horário */}
                <div>
                  <label className="text-[11px] font-bold text-[#1a2e26] block mb-1.5">Data e horário</label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-[13px] bg-[#fafcfb] outline-none text-gray-600 focus:border-[#00674F]" />
                    </div>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="time" value={newTaskTime} onChange={(e) => setNewTaskTime(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-[13px] bg-[#fafcfb] outline-none text-gray-600 focus:border-[#00674F]" />
                    </div>
                  </div>
                </div>

                {/* Dificuldade */}
                <div>
                  <label className="text-[11px] font-bold text-[#1a2e26] flex items-center gap-1 mb-1.5">Dificuldade <span className="w-3 h-3 rounded-full border border-gray-300 flex items-center justify-center text-[8px] text-gray-400">i</span></label>
                  <div className="grid grid-cols-3 gap-2 h-[88px]">
                    <button type="button" onClick={() => setNewTaskDifficulty('Baixa')} className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border transition-colors ${newTaskDifficulty === 'Baixa' ? 'bg-emerald-50 border-emerald-200' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                      <ArrowDown size={16} className={newTaskDifficulty === 'Baixa' ? 'text-emerald-600' : 'text-emerald-500'} />
                      <span className={`text-[11px] font-bold ${newTaskDifficulty === 'Baixa' ? 'text-emerald-700' : 'text-gray-500'}`}>Baixa</span>
                    </button>
                    <button type="button" onClick={() => setNewTaskDifficulty('Média')} className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border transition-colors ${newTaskDifficulty === 'Média' ? 'bg-amber-50 border-amber-200' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                      <Minus size={16} className={newTaskDifficulty === 'Média' ? 'text-amber-600' : 'text-amber-500'} />
                      <span className={`text-[11px] font-bold ${newTaskDifficulty === 'Média' ? 'text-amber-700' : 'text-gray-500'}`}>Média</span>
                    </button>
                    <button type="button" onClick={() => setNewTaskDifficulty('Alta')} className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border transition-colors ${newTaskDifficulty === 'Alta' ? 'bg-red-50 border-red-200' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                      <ArrowUp size={16} className={newTaskDifficulty === 'Alta' ? 'text-red-600' : 'text-red-500'} />
                      <span className={`text-[11px] font-bold ${newTaskDifficulty === 'Alta' ? 'text-red-700' : 'text-gray-500'}`}>Alta</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Etiqueta */}
              <div>
                <label className="text-[11px] font-bold text-[#1a2e26] block mb-1.5">Etiqueta</label>
                <p className="text-[10px] text-gray-500 mb-2.5">Selecione uma ou mais etiquetas para categorizar sua tarefa.</p>
                <div className="grid grid-cols-3 gap-2.5">
                  <button type="button" onClick={() => setNewTaskLabel('Acadêmico')} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-colors ${newTaskLabel === 'Acadêmico' ? 'bg-[#e8f5ef] border-[#00674F] text-[#00674F]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <BookOpen size={14} /> <span className="text-xs font-bold">Acadêmico</span>
                  </button>
                  <button type="button" onClick={() => setNewTaskLabel('Pessoal')} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-colors ${newTaskLabel === 'Pessoal' ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <User size={14} /> <span className="text-xs font-bold">Pessoal</span>
                  </button>
                  <button type="button" onClick={() => setNewTaskLabel('Projeto')} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-colors ${newTaskLabel === 'Projeto' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <Briefcase size={14} /> <span className="text-xs font-bold">Projeto</span>
                  </button>
                </div>
              </div>

              {/* ── ANEXOS ── */}
              <div>
                <label className="text-[11px] font-bold text-[#1a2e26] block mb-1">Anexos <span className="text-gray-400 font-medium">(opcional)</span></label>
                <p className="text-[10px] text-gray-500 mb-2.5">Adicione arquivos relacionados à sua tarefa.</p>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleAttachmentAdd(e.dataTransfer.files) }}
                  onClick={() => document.getElementById('task-file-input').click()}
                  className={`border-2 border-dashed rounded-xl px-4 py-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
                    ${isDragOver ? 'border-[#00674F] bg-[#e8f5ef]' : 'border-gray-200 bg-[#fafcfb] hover:border-[#00674F] hover:bg-[#f0faf5]'}`}
                >
                  <input
                    id="task-file-input"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => handleAttachmentAdd(e.target.files)}
                  />
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isDragOver ? '#00674F' : '#b0bdb7'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                  </svg>
                  <div className="text-center">
                    <p className="text-[12px] font-medium text-gray-600">Arraste e solte arquivos aqui</p>
                    <p className="text-[11px] text-gray-400">ou clique para selecionar</p>
                  </div>
                  <p className="text-[10px] text-gray-400">Máximo de 10MB por arquivo • PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG</p>
                </div>

                {/* Lista de arquivos anexados */}
                {taskAttachments.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    {taskAttachments.map(file => (
                      <div key={file.id} className="flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-200 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-[#e8f5ef] flex items-center justify-center shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00674F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-[#1a2e26] truncate">{file.name}</p>
                          <p className="text-[10px] text-gray-400">{file.type} • {formatFileSize(file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAttachmentRemove(file.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1 shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lembrete */}
              <div>
                <label className="text-[11px] font-bold text-[#1a2e26] block mb-1.5">Lembrete <span className="text-gray-400 font-medium">(opcional)</span></label>
                <div className="relative">
                  <Bell size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select value={newTaskReminder} onChange={(e) => setNewTaskReminder(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs bg-white outline-none focus:border-[#00674F] appearance-none text-gray-600 font-medium cursor-pointer">
                    <option value="Sem lembrete">Sem lembrete</option>
                    <option value="10 minutos antes">10 minutos antes</option>
                    <option value="30 minutos antes">30 minutos antes</option>
                    <option value="1 hora antes">1 hora antes</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Footer Modal: Recorrente e Botões */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-5 border-t border-gray-100 gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer w-full sm:w-auto justify-center sm:justify-start">
                  <input type="checkbox" checked={newTaskRecurring} onChange={(e) => setNewTaskRecurring(e.target.checked)} className="rounded border-gray-300 text-[#00674F] focus:ring-[#00674F] w-4 h-4 cursor-pointer" />
                  Tarefa recorrente
                </label>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button type="button" onClick={() => { setShowTaskModal(false); setTaskAttachments([]) }} className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 sm:flex-none px-6 py-2.5 bg-[#00674F] text-white rounded-xl text-xs font-bold hover:bg-[#005040] transition-colors shadow-sm disabled:opacity-50">
                    Adicionar tarefa
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE COMPROMISSO AGENDA (MANTIDO) */}
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