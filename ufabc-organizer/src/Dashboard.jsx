import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Plus, CheckCircle, Circle, Trash2, LogOut, Calendar, Send, Moon, Sun, ChevronDown, Home, ClipboardList, CalendarDays, Megaphone, LayoutGrid, BarChart3, Settings, ChevronsLeft, ChevronsRight, Check } from 'lucide-react'

// CSS gerado dinamicamente com variáveis que mudam conforme isDark
const buildCss = (dark) => `
  .dash {
    --bg: ${dark ? '#0a0f0d' : '#F5F7F6'};
    --sidebar-bg: ${dark ? '#111815' : '#ffffff'};
    --sidebar-border: ${dark ? '#1e2a24' : '#e8ebe9'};
    --nav-color: ${dark ? '#7a9e8a' : '#5a6b63'};
    --nav-hover-bg: ${dark ? '#1a2e24' : '#f0f5f2'};
    --nav-hover-color: ${dark ? '#6ee7b7' : '#00674F'};
    --card-bg: ${dark ? '#111815' : '#ffffff'};
    --card-border: ${dark ? '#1e2a24' : '#e4e9e6'};
    --card-title: ${dark ? '#e2ede8' : '#1a2e26'};
    --input-bg: ${dark ? '#1a2420' : '#fafcfb'};
    --input-bg-focus: ${dark ? '#1f2d28' : '#ffffff'};
    --input-border: ${dark ? '#2a3d34' : '#dde5e0'};
    --input-color: ${dark ? '#d4e8de' : '#1a2e26'};
    --input-placeholder: ${dark ? '#4a6a58' : '#b0bdb7'};
    --task-item-bg: ${dark ? '#161e1a' : '#ffffff'};
    --task-item-done-bg: ${dark ? '#111815' : '#fafcfb'};
    --task-title-color: ${dark ? '#d4e8de' : '#1a2e26'};
    --post-bg: ${dark ? '#161e1a' : '#fafcfb'};
    --post-hover-bg: ${dark ? '#1a2420' : '#f0f5f2'};
    --post-border: ${dark ? '#1e2a24' : '#e8ede9'};
    --post-author: ${dark ? '#d4e8de' : '#1a2e26'};
    --post-content: ${dark ? '#7a9e8a' : '#5a6b63'};
    --empty-title: ${dark ? '#7a9e8a' : '#4a5e56'};
    --scrollbar-thumb: ${dark ? '#2a3d34' : '#d0ddd7'};
    display: flex; flex-direction: column; height: 100vh;
    background: var(--bg);
    transition: background 0.3s;
  }
  .header {
    background: ${dark
    ? 'linear-gradient(135deg, #001a12 0%, #003d2e 55%, #002d22 100%)'
    : 'linear-gradient(135deg, #003d2e 0%, #00674F 55%, #005040 100%)'};
    padding: 0 28px; height: 100px;
    display: flex; align-items: center; justify-content: space-between;
    position: relative; overflow: hidden; flex-shrink: 0;
    transition: background 0.3s;
  }
  .header-arc { position: absolute; right: -40px; top: -60px; width: 280px; height: 220px; border-radius: 50%; border: 2px solid rgba(211,175,55,0.25); pointer-events: none; }
  .header-arc2 { position: absolute; right: 60px; top: -100px; width: 320px; height: 280px; border-radius: 50%; border: 1px solid rgba(211,175,55,0.12); pointer-events: none; }
  .header-dots { position: absolute; left: 0; top: 0; width: 100%; height: 100%; background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 28px 28px; pointer-events: none; }
  .logo-area { display: flex; align-items: center; gap: 16px; position: relative; z-index: 1; }
  .logo-icon { width: 58px; height: 58px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .logo-icon svg { width: 58px; height: 58px; }
  .logo-text { color: white; }
  .logo-text h1 { font-size: 18px; font-weight: 500; letter-spacing: 0.3px; }
  .logo-text .brand { color: #D3AF37; font-size: 13px; font-weight: 500; }
  .logo-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.2); margin: 0 4px; }
  .header-welcome { color: rgba(255,255,255,0.9); position: relative; z-index: 1; }
  .header-welcome strong { font-size: 15px; font-weight: 500; display: block; }
  .header-welcome span { font-size: 12px; opacity: 0.7; }
  .header-right { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }
  .user-pill { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 40px; padding: 6px 14px 6px 6px; backdrop-filter: blur(8px); cursor: pointer; transition: background 0.2s; }
  .user-pill:hover { background: rgba(255,255,255,0.13); }
  .avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #D3AF37, #a88620); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; color: white; flex-shrink: 0; }
  .user-info { color: white; }
  .user-info .uname { font-size: 13px; font-weight: 500; display: block; }
  .user-info .uemail { font-size: 11px; opacity: 0.65; }
  .chevron { color: rgba(255,255,255,0.5); font-size: 12px; margin-left: 2px; }
  .btn-sair { display: flex; align-items: center; gap: 7px; background: linear-gradient(135deg, #D3AF37, #b8942a); color: white; border: none; border-radius: 10px; padding: 9px 18px; font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity 0.2s; }
  .btn-sair:hover { opacity: 0.88; }
  .btn-dark { display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); color: white; border-radius: 10px; padding: 9px; cursor: pointer; transition: background 0.2s; }
  .btn-dark:hover { background: rgba(255,255,255,0.18); }
  .body { display: flex; flex: 1; overflow: hidden; }
  .sidebar { width: 200px; flex-shrink: 0; background: var(--sidebar-bg); border-right: 0.5px solid var(--sidebar-border); padding: 20px 12px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; transition: width 0.25s, background 0.3s; }
  .sidebar.collapsed { width: 60px; }
  .nav-item { display: flex; align-items: center; gap: 11px; padding: 9px 12px; border-radius: 10px; cursor: pointer; color: var(--nav-color); font-size: 13px; font-weight: 400; transition: all 0.15s; border: none; background: none; width: 100%; text-align: left; white-space: nowrap; overflow: hidden; }
  .nav-item:hover { background: var(--nav-hover-bg); color: var(--nav-hover-color); }
  .nav-item.active { background: #00674F; color: white; font-weight: 500; }
  .nav-spacer { flex: 1; }
  .nav-collapse { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 10px; cursor: pointer; color: #8a9e94; font-size: 12px; border: none; background: none; width: 100%; white-space: nowrap; overflow: hidden; }
  .nav-collapse:hover { background: var(--nav-hover-bg); }
  .main { flex: 1; padding: 22px; display: grid; grid-template-columns: 1fr 360px; gap: 18px; overflow: auto; }
  .card { background: var(--card-bg); border-radius: 16px; border: 0.5px solid var(--card-border); padding: 24px; display: flex; flex-direction: column; transition: background 0.3s, border-color 0.3s; }
  .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .card-header-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .card-header-icon.verde { background: ${dark ? 'rgba(0,103,79,0.2)' : '#e8f5ef'}; color: #00674F; }
  .card-header-icon.dourado { background: ${dark ? 'rgba(211,175,55,0.12)' : '#fdf5e0'}; color: #D3AF37; }
  .card-title { font-size: 15px; font-weight: 500; color: var(--card-title); }
  .card-subtitle { font-size: 12px; color: #8a9e94; margin-top: 1px; }
  .input-row { display: flex; gap: 10px; margin-bottom: 20px; }
  .task-input { flex: 1; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--input-border); font-size: 13px; color: var(--input-color); background: var(--input-bg); outline: none; transition: border 0.2s, background 0.2s; }
  .task-input:focus { border-color: #00674F; background: var(--input-bg-focus); }
  .task-input::placeholder { color: var(--input-placeholder); }
  .date-input { padding: 10px 12px; border-radius: 10px; border: 1px solid var(--input-border); font-size: 12px; color: var(--input-color); background: var(--input-bg); outline: none; width: 140px; transition: background 0.3s; }
  .btn-add { display: flex; align-items: center; gap: 6px; background: #00674F; color: white; border: none; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
  .btn-add:hover { background: #005040; }
  .btn-add:disabled { opacity: 0.5; cursor: not-allowed; }
  .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 32px 0; }
  .empty-ilu { width: 80px; height: 80px; position: relative; }
  .empty-ilu-inner { width: 60px; height: 72px; border: 2.5px solid ${dark ? '#2a3d34' : '#c8e0d6'}; border-radius: 8px; background: ${dark ? '#161e1a' : '#f0f7f3'}; position: relative; display: flex; flex-direction: column; gap: 6px; padding: 12px 10px; }
  .check-line { height: 3px; background: ${dark ? '#2a3d34' : '#b0d4c4'}; border-radius: 2px; display: flex; align-items: center; gap: 4px; }
  .check-dot { width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid ${dark ? '#2a3d34' : '#c8e0d6'}; flex-shrink: 0; }
  .check-dot.done { background: #00674F; border-color: #00674F; }
  .check-bar { flex: 1; height: 2.5px; background: ${dark ? '#2a3d34' : '#c8e0d6'}; border-radius: 2px; }
  .coin { width: 26px; height: 26px; border-radius: 50%; background: #D3AF37; border: 2px solid ${dark ? '#111815' : 'white'}; position: absolute; bottom: -6px; right: -10px; display: flex; align-items: center; justify-content: center; color: white; }
  .empty-title { font-size: 13px; font-weight: 500; color: var(--empty-title); }
  .empty-sub { font-size: 12px; color: #9aada5; }
  .task-list { display: flex; flex-direction: column; gap: 10px; flex: 1; overflow-y: auto; }
  .task-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--card-border); transition: all 0.15s; background: var(--task-item-bg); }
  .task-item:hover { box-shadow: 0 1px 6px rgba(0,103,79,0.12); }
  .task-item.done { opacity: 0.6; background: var(--task-item-done-bg); }
  .task-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
  .task-check { background: none; border: none; cursor: pointer; display: flex; align-items: center; color: #4a6a58; transition: color 0.15s; flex-shrink: 0; padding: 0; }
  .task-check:hover { color: #00674F; }
  .task-check.done { color: #00674F; }
  .task-info { flex: 1; min-width: 0; }
  .task-title { font-size: 13px; font-weight: 500; color: var(--task-title-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .task-title.done { text-decoration: line-through; color: #4a6a58; }
  .task-date { font-size: 11px; color: #8a9e94; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
  .task-delete { background: none; border: none; cursor: pointer; color: #4a6a58; transition: color 0.15s; padding: 4px; flex-shrink: 0; display: flex; }
  .task-delete:hover { color: #ef4444; }
  .feed-card { height: 100%; min-height: 0; }
  .feed-top-bar { height: 3px; background: linear-gradient(90deg, #00674F, #D3AF37); margin: -24px -24px 20px; border-radius: 15px 15px 0 0; flex-shrink: 0; }
  .feed-input-row { display: flex; gap: 8px; margin-bottom: 16px; flex-shrink: 0; }
  .feed-input { flex: 1; padding: 9px 13px; border-radius: 10px; border: 1px solid var(--input-border); font-size: 12px; color: var(--input-color); background: var(--input-bg); outline: none; transition: background 0.3s; }
  .feed-input::placeholder { color: var(--input-placeholder); }
  .feed-input:focus { border-color: #D3AF37; }
  .btn-send { width: 36px; height: 36px; border-radius: 10px; background: #D3AF37; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s; color: white; }
  .btn-send:hover { background: #b8942a; }
  .feed-scroll { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 2px; min-height: 0; }
  .feed-scroll::-webkit-scrollbar { width: 3px; }
  .feed-scroll::-webkit-scrollbar-track { background: transparent; }
  .feed-scroll::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
  .post { padding: 12px 14px; border-radius: 12px; background: var(--post-bg); border: 0.5px solid var(--post-border); display: flex; gap: 10px; cursor: pointer; transition: background 0.15s; }
  .post:hover { background: var(--post-hover-bg); }
  .post-accent { width: 3px; border-radius: 3px; flex-shrink: 0; }
  .post-accent.v { background: #00674F; }
  .post-accent.d { background: #D3AF37; }
  .post-body { flex: 1; min-width: 0; }
  .post-author { font-size: 12px; font-weight: 500; color: var(--post-author); display: flex; align-items: center; gap: 6px; }
  .post-time { font-size: 11px; color: #aabdb5; font-weight: 400; }
  .post-content { font-size: 12px; color: var(--post-content); margin-top: 3px; line-height: 1.5; word-break: break-word; }
  .feed-empty { text-align: center; font-size: 12px; color: #4a6a58; padding: 40px 0; }
`

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 3600) return `Há ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `Há ${Math.floor(diff / 86400)} dia${Math.floor(diff / 86400) > 1 ? 's' : ''}`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function Dashboard({ session, isDark, toggleDark }) {
  const [tasks, setTasks] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')
  const [posts, setPosts] = useState([])
  const [newPostContent, setNewPostContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState('inicio')

  useEffect(() => {
    fetchTasks()
    fetchPosts()
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (error) console.error(error.message)
    else setTasks(data || [])
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    setLoading(true)
    const { error } = await supabase.from('tasks').insert([{
      user_id: session.user.id, title: newTaskTitle, due_date: newTaskDate || null, is_completed: false
    }])
    if (error) alert('Erro: ' + error.message)
    else { setNewTaskTitle(''); setNewTaskDate(''); fetchTasks() }
    setLoading(false)
  }

  const toggleTaskComplete = async (id, current) => {
    await supabase.from('tasks').update({ is_completed: !current }).eq('id', id)
    fetchTasks()
  }

  const deleteTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    fetchTasks()
  }

  const fetchPosts = async () => {
    const [postsResult, profilesResult] = await Promise.all([
      supabase.from('posts').select('id, content, created_at, user_id').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, username')
    ])
    if (postsResult.error) { console.error(postsResult.error.message); return }
    const profilesMap = Object.fromEntries((profilesResult.data ?? []).map(p => [p.id, p.username]))
    setPosts((postsResult.data ?? []).map(post => ({
      ...post,
      username: profilesMap[post.user_id] || 'Estudante UFA'
    })))
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newPostContent.trim()) return
    const { error } = await supabase.from('posts').insert([{ user_id: session.user.id, content: newPostContent }])
    if (error) alert('Erro: ' + error.message)
    else { setNewPostContent(''); fetchPosts() }
  }

  const username = session.user.user_metadata?.username || session.user.email.split('@')[0]
  const initials = username.slice(0, 2).toUpperCase()
  const pendingCount = tasks.filter(t => !t.is_completed).length

  const navItems = [
    { key: 'inicio', Icon: Home, label: 'Início' },
    { key: 'tarefas', Icon: ClipboardList, label: 'Tarefas' },
    { key: 'agenda', Icon: CalendarDays, label: 'Agenda' },
    { key: 'avisos', Icon: Megaphone, label: 'Avisos' },
    { key: 'feed', Icon: LayoutGrid, label: 'Feed' },
    { key: 'relatorios', Icon: BarChart3, label: 'Relatórios' },
    { key: 'configuracoes', Icon: Settings, label: 'Configurações' },
  ]

  return (
    <>
      <style>{buildCss(isDark)}</style>
      <div className="dash">

        {/* ── HEADER ── */}
        <div className="header">
          <div className="header-dots" />
          <div className="header-arc" />
          <div className="header-arc2" />

          <div className="logo-area">
            <div className="logo-icon">
              {/* Logo UFA Organizador — documento + checklist + checkmark dourado */}
              <svg viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Corpo do documento */}
                <path
                  d="M10 6 H36 L46 16 V50 Q46 54 42 54 H10 Q6 54 6 50 V10 Q6 6 10 6 Z"
                  fill="none" stroke="white" strokeWidth="3" strokeLinejoin="round"
                />
                {/* Corner fold */}
                <path d="M36 6 L36 16 L46 16" fill="none" stroke="#D3AF37" strokeWidth="3" strokeLinejoin="round" />
                <path d="M36 6 L46 16" fill="#D3AF37" />
                {/* Bullet + linha 1 */}
                <circle cx="16" cy="23" r="2.2" fill="white" />
                <line x1="21" y1="23" x2="36" y2="23" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                {/* Bullet + linha 2 */}
                <circle cx="16" cy="31" r="2.2" fill="white" />
                <line x1="21" y1="31" x2="36" y2="31" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                {/* Bullet + linha 3 */}
                <circle cx="16" cy="39" r="2.2" fill="white" />
                <line x1="21" y1="39" x2="33" y2="39" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                {/* Checkmark dourado grande */}
                <path
                  d="M18 47 L26 55 L44 36"
                  fill="none" stroke="#D3AF37" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="logo-text">
              <h1>UFA ORGANIZEI</h1>
              <span className="brand">Organizador</span>
            </div>
            <div className="logo-divider" />
            <div className="header-welcome">
              <strong>Bem-vindo de volta, {username}!</strong>
              <span>Organize suas tarefas e fique por dentro da UFA.</span>
            </div>
          </div>

          <div className="header-right">
            <div className="user-pill">
              <div className="avatar">{initials}</div>
              <div className="user-info">
                <span className="uname">{username}</span>
                <span className="uemail">{session.user.email}</span>
              </div>
              <span className="chevron"><ChevronDown size={13} /></span>
            </div>
            <button className="btn-dark" onClick={toggleDark} title={isDark ? 'Modo claro' : 'Modo escuro'}>
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="btn-sair" onClick={() => supabase.auth.signOut()}>
              <LogOut size={15} /> Sair
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="body">

          {/* ── SIDEBAR ── */}
          <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
            {navItems.map(({ key, Icon, label }) => (
              <button
                key={key}
                className={`nav-item${activeNav === key ? ' active' : ''}`}
                onClick={() => setActiveNav(key)}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                {!collapsed && label}
              </button>
            ))}
            <div className="nav-spacer" />
            <button className="nav-collapse" onClick={() => setCollapsed(p => !p)}>
              {collapsed ? <ChevronsRight size={15} /> : <><ChevronsLeft size={15} /> Recolher</>}
            </button>
          </div>

          {/* ── MAIN ── */}
          <div className="main">

            {/* TAREFAS */}
            <div className="card">
              <div className="card-header">
                <div className="card-header-icon verde">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <div className="card-title">Minhas Tarefas Acadêmicas</div>
                  <div className="card-subtitle">{pendingCount} {pendingCount === 1 ? 'tarefa pendente' : 'tarefas pendentes'}</div>
                </div>
              </div>

              <form className="input-row" onSubmit={handleAddTask}>
                <input
                  className="task-input"
                  type="text"
                  placeholder="Ex: Estudar para P1 de Física"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  required
                />
                <input
                  className="date-input"
                  type="date"
                  value={newTaskDate}
                  onChange={e => setNewTaskDate(e.target.value)}
                />
                <button className="btn-add" type="submit" disabled={loading}>
                  <Plus size={16} /> Adicionar
                </button>
              </form>

              {tasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-ilu">
                    <div className="empty-ilu-inner">
                      <div className="check-line"><div className="check-dot done" /><div className="check-bar" /></div>
                      <div className="check-line"><div className="check-dot" /><div className="check-bar" style={{ background: '#e0ece7' }} /></div>
                      <div className="check-line"><div className="check-dot" /><div className="check-bar" style={{ background: '#e0ece7', width: '60%' }} /></div>
                    </div>
                    <div className="coin"><Check size={13} /></div>
                  </div>
                  <div className="empty-title">Nenhuma tarefa cadastrada.</div>
                  <div className="empty-sub">Adicione uma nova tarefa para começar!</div>
                </div>
              ) : (
                <div className="task-list">
                  {tasks.map(task => (
                    <div key={task.id} className={`task-item${task.is_completed ? ' done' : ''}`}>
                      <div className="task-left">
                        <button
                          className={`task-check${task.is_completed ? ' done' : ''}`}
                          onClick={() => toggleTaskComplete(task.id, task.is_completed)}
                        >
                          {task.is_completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                        </button>
                        <div className="task-info">
                          <div className={`task-title${task.is_completed ? ' done' : ''}`}>{task.title}</div>
                          {task.due_date && (
                            <div className="task-date">
                              <Calendar size={11} />
                              Entrega: {new Date(task.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                            </div>
                          )}
                        </div>
                      </div>
                      <button className="task-delete" onClick={() => deleteTask(task.id)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FEED */}
            <div className="card feed-card">
              <div className="feed-top-bar" />
              <div className="card-header" style={{ marginBottom: 14 }}>
                <div className="card-header-icon dourado">
                  <Megaphone size={18} />
                </div>
                <div>
                  <div className="card-title">Feed Central da UFA</div>
                  <div className="card-subtitle">Fique por dentro das novidades da comunidade.</div>
                </div>
              </div>

              <form className="feed-input-row" onSubmit={handleCreatePost}>
                <input
                  className="feed-input"
                  type="text"
                  placeholder="O que está acontecendo no campus?"
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                  required
                />
                <button className="btn-send" type="submit">
                  <Send size={15} />
                </button>
              </form>

              <div className="feed-scroll">
                {posts.length === 0 ? (
                  <div className="feed-empty">Nenhuma publicação ainda. Seja o primeiro!</div>
                ) : (
                  posts.map((post, i) => (
                    <div key={post.id} className="post">
                      <div className={`post-accent ${i % 2 === 0 ? 'v' : 'd'}`} />
                      <div className="post-body">
                        <div className="post-author">
                          {post.username}
                          <span className="post-time">{timeAgo(post.created_at)}</span>
                        </div>
                        <div className="post-content">{post.content}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
