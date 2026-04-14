'use client'
import { useState, useEffect, useCallback } from 'react'
import { tasksApi, clientsApi } from '@/lib/api'
import type { Task, Client } from '@/types'
import { Plus, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled']

const priorityColor: Record<string, string> = {
  urgent: 'var(--danger)', high: 'var(--warning)',
  medium: 'var(--info)', low: 'var(--text-muted)'
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [form, setForm] = useState<any>({})
  const [view, setView] = useState<'list' | 'kanban'>('list')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, cRes] = await Promise.all([
        tasksApi.list({ status: filterStatus || undefined, priority: filterPriority || undefined }),
        clientsApi.list({ size: 100 }),
      ])
      setTasks(tRes.data.items)
      setTotal(tRes.data.total)
      setClients(cRes.data.items)
    } catch { toast.error('Failed to load tasks') }
    finally { setLoading(false) }
  }, [filterStatus, filterPriority])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => { setEditTask(null); setForm({ priority: 'medium', status: 'pending' }); setShowModal(true) }
  const openEdit = (t: Task) => { setEditTask(t); setForm({ ...t }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editTask) {
        await tasksApi.update(editTask.id, form)
        toast.success('Task updated!')
      } else {
        await tasksApi.create(form)
        toast.success('Task created!')
      }
      setShowModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error saving task')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await tasksApi.update(id, { status })
      fetchData()
    } catch { toast.error('Failed to update status') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return
    try { await tasksApi.delete(id); toast.success('Task deleted'); fetchData() }
    catch { toast.error('Failed to delete') }
  }

  const kanbanCols = STATUSES.filter(s => s !== 'cancelled')

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[28px] md:text-[40px] font-semibold tracking-vercel-display leading-[1.20]">Tasks</h1>
          <p className="text-muted-foreground mt-2">{total} task{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-card rounded-md shadow-vercel overflow-hidden">
            {(['list', 'kanban'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, background: view === v ? 'var(--accent)' : 'transparent', color: view === v ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'var(--transition)' }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={openCreate} id="add-task-btn"><Plus size={15} /> Add Task</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" className="w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" className="w-auto" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {view === 'list' ? (
        <div className="relative w-full overflow-auto rounded-lg shadow-vercel bg-card">
          {loading ? (
            <div className="flex items-center justify-center p-12 gap-3"><div className="spinner" /><span className="text-muted">Loading…</span></div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-sm text-muted-foreground rounded-lg shadow-vercel border-dashed border border-border"><div className="mb-4 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center"><CheckSquare size={24} style={{ color: 'var(--text-muted)' }} /></div><h3>No tasks yet</h3><p>Create your first task</p></div>
          ) : (
            <table className="w-full caption-bottom text-sm">
              <thead className="border-b border-border"><tr className="border-b border-border transition-colors hover:bg-muted/50"><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Title</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Client</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Priority</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Status</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Due Date</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Assigned</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"></th></tr></thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 280 }}>{t.title}</td>
                    <td className="p-4 align-middle whitespace-nowrap">{t.client_name || <span className="text-muted">—</span>}</td>
                    <td className="p-4 align-middle whitespace-nowrap"><span style={{ color: priorityColor[t.priority], fontWeight: 600, fontSize: 12, textTransform: 'capitalize' }}>{t.priority}</span></td>
                    <td className="p-4 align-middle whitespace-nowrap">
                      <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 px-2 py-1 text-xs w-auto"
                        value={t.status} onChange={e => handleStatusChange(t.id, e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap">{t.due_date ? format(new Date(t.due_date), 'dd MMM') : <span className="text-muted">—</span>}</td>
                    <td className="p-4 align-middle whitespace-nowrap">{t.assignee_name || <span className="text-muted">—</span>}</td>
                    <td className="p-4 align-middle whitespace-nowrap">
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(t)}>✏</button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(t.id)} style={{ color: 'var(--danger)' }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanCols.map(col => {
            const colTasks = tasks.filter(t => t.status === col)
            return (
              <div key={col} className="w-[280px] shrink-0 bg-card border-none shadow-vercel rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{col.replace('_', ' ')}</span>
                  <span className="bg-secondary rounded-full px-2 py-0.5 text-[11px] font-bold">{colTasks.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {colTasks.map(t => (
                    <div key={t.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px', cursor: 'pointer', transition: 'var(--transition)' }}
                      onClick={() => openEdit(t)}>
                      <div className="text-[13px] font-semibold mb-1.5">{t.title}</div>
                      {t.client_name && <div className="text-[11px] text-muted-foreground mb-1.5">{t.client_name}</div>}
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 11, fontWeight: 600, color: priorityColor[t.priority], textTransform: 'capitalize' }}>{t.priority}</span>
                        {t.due_date && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{format(new Date(t.due_date), 'dd MMM')}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-background rounded-lg shadow-vercel-popover max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <span className="text-lg font-semibold tracking-vercel-card">{editTask ? 'Edit Task' : 'Create Task'}</span>
              <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group" className="md:col-span-2">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Title *</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title…" />
                </div>
                <div className="form-group" className="md:col-span-2">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Description</label>
                  <textarea className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="resize-y" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Client</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.client_id || ''} onChange={e => setForm({ ...form, client_id: e.target.value || null })}>
                    <option value="">No client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Priority</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.priority || 'medium'} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Status</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Due Date</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value || null })} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-6 border-t border-border bg-muted/20">
                <button type="button" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">{editTask ? 'Update' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
