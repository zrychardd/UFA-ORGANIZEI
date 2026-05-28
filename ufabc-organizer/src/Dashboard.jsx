import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
  Plus, CheckCircle, Circle, Trash2, LogOut, Calendar,
  ListTodo, Share2, Send, Home, Megaphone,
  LayoutGrid, BarChart, Settings, ChevronLeft, ChevronDown, Check,
  Bell, Award, Flame
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

  const [loading, setLoading] = useState(false)

  // Extrai informações do usuário logado
  const userEmail = session?.user?.email || 'estudante@ufabc.edu.br'
  const userPrefix = userEmail.split('@')[0]
  const displayFirstName = userPrefix.charAt(0).toUpperCase() + userPrefix.slice(1)
  const avatarInitials = userPrefix.slice(0, 2).toUpperCase()

  useEffect(() => {
    fetchTasks()
    fetchPosts()

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

  // Contadores estatísticos para a tela Início
  const pendingTasksCount = tasks.filter(task => !task.is_completed).length

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
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed text-xs font-normal text-gray-300">
            <Calendar size={16} className="shrink-0" />
            <span>Agenda</span>
          </div>
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

        {/* CONTEÚDO PRINCIPAL RENDERIZADO POR ABA */}
        <main className="flex-1 p-[22px] grid grid-cols-1 lg:grid-cols-3 gap-[18px] overflow-auto">

          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* ABA: INÍCIO */}
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

                {/* 4 Mini Cards Superiores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="bg-white border border-[#e4e9e6] p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-[#e8f5ef] flex items-center justify-center shrink-0">
                      <ListTodo size={18} className="text-[#00674F]" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800 leading-none">{pendingTasksCount}</div>
                      <div className="text-[11px] font-medium text-[#1a2e26] mt-0.5">Tarefas pendentes</div>
                      <div className="text-[10px] text-[#9aada5] mt-px truncate">
                        {pendingTasksCount === 0 ? 'Nada para fazer! 🎉' : 'Foco nos estudos!'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e4e9e6] p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-[#fdf5e0] flex items-center justify-center shrink-0">
                      <Calendar size={18} className="text-[#D3AF37]" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800 leading-none">0</div>
                      <div className="text-[11px] font-medium text-[#1a2e26] mt-0.5">Eventos hoje</div>
                      <div className="text-[10px] text-[#9aada5] mt-px">Nenhum evento hoje</div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e4e9e6] p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Bell size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800 leading-none">2</div>
                      <div className="text-[11px] font-medium text-[#1a2e26] mt-0.5">Avisos não lidos</div>
                      <div className="text-[10px] text-[#9aada5] mt-px">Fique por dentro</div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e4e9e6] p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Award size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800 leading-none">85%</div>
                      <div className="text-[11px] font-medium text-[#1a2e26] mt-0.5">Produtividade</div>
                      <div className="text-[10px] text-[#9aada5] mt-px">Continue assim!</div>
                    </div>
                  </div>
                </div>

                {/* Eventos e Destaques */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-[#e4e9e6] p-5 rounded-2xl shadow-sm flex flex-col h-48">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-[#1a2e26] flex items-center gap-2">
                        <Calendar size={14} className="text-[#00674F]" /> Próximos eventos
                      </span>
                      <span className="text-[11px] font-semibold text-[#00674F] cursor-not-allowed opacity-50">Ver agenda</span>
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

                {/* Hábitos Diários */}
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

            {/* ABA: TAREFAS */}
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
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#dde5e0] text-xs text-[#1a2e26] bg-[#fafcfb] outline-none transition-colors focus:border-[#00674F] focus:bg-white"
                    required
                  />
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-[#dde5e0] text-xs text-[#6a7d74] bg-[#fafcfb] outline-none sm:w-[140px]"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 bg-[#00674F] text-white rounded-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors hover:bg-[#005040] disabled:opacity-50"
                  >
                    <Plus size={14} />
                    <span>Adicionar</span>
                  </button>
                </form>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[400px]">
                  {tasks.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2.5">
                      <div className="w-20 h-20 relative">
                        <div className="w-14 h-[68px] border-[2.5px] border-[#c8e0d6] rounded-lg bg-[#f0f7f3] flex flex-col gap-1.5 p-3">
                          <div className="h-1 bg-[#b0d4c4] rounded flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-[#00674F]" /><div className="w-full h-[2px] bg-[#c8e0d6] rounded" /></div>
                          <div className="h-1 bg-transparent rounded flex items-center gap-1"><div className="w-1 h-1 rounded-full border border-[#c8e0d6]" /><div className="w-3/4 h-[2px] bg-[#e0ece7] rounded" /></div>
                        </div>
                        <div className="w-[26px] h-[26px] rounded-full bg-[#D3AF37] border-2 border-white absolute -bottom-1.5 -right-2 flex items-center justify-center shadow-sm">
                          <Check size={13} className="text-white font-bold" />
                        </div>
                      </div>
                      <div className="text-xs font-medium text-[#4a5e56]">Nenhuma tarefa cadastrada.</div>
                      <div className="text-[11px] text-[#9aada5]">Adicione uma nova tarefa para começar!</div>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${task.is_completed ? 'bg-gray-50/70 border-gray-100 opacity-60' : 'bg-[#fafcfb] border-[#e8ede9] hover:bg-[#f0f5f2]'
                          }`}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <button
                            onClick={() => toggleTaskComplete(task.id, task.is_completed)}
                            className="text-gray-400 hover:text-[#00674F] transition shrink-0"
                          >
                            {task.is_completed ? (
                              <CheckCircle className="text-[#00674F]" size={18} />
                            ) : (
                              <Circle size={18} />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-medium text-[#1a2e26] truncate ${task.is_completed ? 'line-through text-gray-400' : ''}`}>
                              {task.title}
                            </p>
                            {task.due_date && (
                              <span className="inline-flex items-center space-x-1 text-[10px] text-gray-400 mt-0.5">
                                <Calendar size={10} />
                                <span>Entrega: {new Date(task.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-gray-400 hover:text-red-500 p-1 transition shrink-0 ml-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PAINEL DO FEED (FIXO À DIREITA) */}
          <div className="bg-white rounded-2xl border border-[#e4e9e6] p-6 flex flex-col h-full min-h-0 shadow-sm relative overflow-hidden">
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
              <button
                type="submit"
                className="w-9 h-9 rounded-xl bg-[#D3AF37] flex items-center justify-center transition-colors hover:bg-[#b8942a] text-white shrink-0 shadow-sm"
              >
                <Send size={14} />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {posts.length === 0 ? (
                <p className="text-center text-gray-400 text-[11px] py-12">Nenhuma publicação ainda. Seja o primeiro!</p>
              ) : (
                posts.map((post) => {
                  const isOwnPost = post.user_id === session?.user?.id;
                  return (
                    <div
                      key={post.id}
                      className="p-3 rounded-xl bg-[#fafcfb] border border-[#e8ede9] flex gap-2.5 hover:bg-[#f0f5f2] transition-colors cursor-pointer"
                    >
                      <div className={`w-[3px] rounded-full shrink-0 ${isOwnPost ? 'bg-[#00674F]' : 'bg-[#D3AF37]'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#1a2e26] flex items-center gap-1.5">
                          {post.profiles?.username || 'Estudante UFA'}
                          <span className="text-[10px] text-[#aabdb5] font-normal">
                            {post.created_at ? new Date(post.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-[#5a6b63] mt-1 whitespace-pre-wrap break-words leading-relaxed">
                          {post.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}