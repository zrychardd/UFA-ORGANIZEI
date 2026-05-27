import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Plus, CheckCircle, Circle, Trash2, LogOut, Calendar, ListTodo, Share2, MessageSquare, Send } from 'lucide-react'

export default function Dashboard({ session }) {
  // Estados das Tarefas
  const [tasks, setTasks] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')
  
  // Estados do Feed Coletivo
  const [posts, setPosts] = useState([])
  const [newPostContent, setNewPostContent] = useState('')
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTasks()
    fetchPosts()

    // Sistema em tempo real: escuta novos posts no Feed automaticamente
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // ==================== LÓGICA DAS TAREFAS (PRIVADAS) ====================
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

  // ==================== LÓGICA DO FEED (PÚBLICO) ====================
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Erro ao buscar feed:', error.message)
    else setPosts(data || [])
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
  
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Barra Superior */}
      <nav className="bg-ufabc-verde text-white px-6 py-4 shadow-md flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold tracking-wide">UFABC Organizador</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm opacity-90 hidden sm:inline">{session.user.email}</span>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="flex items-center space-x-1 bg-ufabc-dourado hover:bg-ufabc-dourado/80 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition shadow"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </nav>

      {/* Grid Principal */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna de Tarefas (Privadas) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2 mb-4">
              <ListTodo className="text-ufabc-verde" size={22} />
              <span>Minhas Tarefas Acadêmicas</span>
            </h2>

            <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="Ex: Estudar para P1 de Física"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ufabc-verde outline-none text-sm"
                required
              />
              <input
                type="date"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ufabc-verde outline-none text-sm text-gray-600"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-ufabc-verde hover:bg-ufabc-verde/80 text-white px-5 py-2 rounded-lg font-semibold text-sm transition flex items-center justify-center space-x-1 disabled:opacity-50"
              >
                <Plus size={18} />
                <span>Adicionar</span>
              </button>
            </form>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">Nenhuma tarefa cadastrada.</p>
              ) : (
                tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border transition ${
                      task.is_completed ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <button 
                        onClick={() => toggleTaskComplete(task.id, task.is_completed)}
                        className="text-gray-400 hover:text-ufabc-verde transition shrink-0"
                      >
                        {task.is_completed ? (
                          <CheckCircle className="text-ufabc-verde" size={20} />
                        ) : (
                          <Circle size={20} />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium text-gray-800 truncate ${task.is_completed ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </p>
                        {task.due_date && (
                          <span className="inline-flex items-center space-x-1 text-xs text-gray-500 mt-0.5">
                            <Calendar size={12} />
                            <span>Entrega: {new Date(task.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="text-gray-400 hover:text-red-500 p-1 transition shrink-0 ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Coluna do Feed Coletivo (Público) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-[550px]">
            <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2 mb-1">
              <Share2 className="text-ufabc-dourado" size={22} />
              <span>Feed Central da UFABC</span>
            </h2>
            <p className="text-xs text-gray-500 mb-4">Compartilhe avisos, links ou resumos com a comunidade.</p>
            
            {/* Form de Postar no Feed */}
            <form onSubmit={handleCreatePost} className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="O que está acontecendo no campus?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-ufabc-dourado outline-none"
                required
              />
              <button
                type="submit"
                className="bg-ufabc-dourado hover:bg-amber-600 text-white p-2 rounded-lg transition shrink-0 flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </form>

            {/* Caixa de Mensagens Rolável */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {posts.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-12">Nenhuma publicação ainda. Seja o primeiro!</p>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-gray-50 p-3 rounded-lg border border-gray-150">
                    <p className="text-[11px] font-semibold text-ufabc-verde truncate mb-1">
                        Estudante UFABC
                    </p>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                      {post.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}