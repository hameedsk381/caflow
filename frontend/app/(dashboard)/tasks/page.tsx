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
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{total} task{total !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            {(['list', 'kanban'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, background: view === v ? 'var(--accent)' : 'transparent', color: view === v ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'var(--transition)' }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={openCreate} id="add-task-btn"><Plus size={15} /> Add Task</button>
        </div>
      </div>

      <div className="filter-row">
        <select className="form-input" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="form-input" style={{ width: 'auto' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {view === 'list' ? (
        <div className="table-wrapper">
          {loading ? (
            <div className="flex items-center justify-center" style={{ padding: 48, gap: 12 }}><div className="spinner" /><span className="text-muted">Loading…</span></div>
          ) : tasks.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><CheckSquare size={24} style={{ color: 'var(--text-muted)' }} /></div><h3>No tasks yet</h3><p>Create your first task</p></div>
          ) : (
            <table>
              <thead><tr><th>Title</th><th>Client</th><th>Priority</th><th>Status</th><th>Due Date</th><th>Assigned</th><th></th></tr></thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 280 }}>{t.title}</td>
                    <td>{t.client_name || <span className="text-muted">—</span>}</td>
                    <td><span style={{ color: priorityColor[t.priority], fontWeight: 600, fontSize: 12, textTransform: 'capitalize' }}>{t.priority}</span></td>
                    <td>
                      <select className="form-input" style={{ padding: '4px 28px 4px 8px', fontSize: 12, width: 'auto' }}
                        value={t.status} onChange={e => handleStatusChange(t.id, e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td>{t.due_date ? format(new Date(t.due_date), 'dd MMM') : <span className="text-muted">—</span>}</td>
                    <td>{t.assignee_name || <span className="text-muted">—</span>}</td>
                    <td>
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
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
          {kanbanCols.map(col => {
            const colTasks = tasks.filter(t => t.status === col)
            return (
              <div key={col} style={{ flex: '0 0 280px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{col.replace('_', ' ')}</span>
                  <span style={{ background: 'var(--bg-secondary)', borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{colTasks.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {colTasks.map(t => (
                    <div key={t.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px', cursor: 'pointer', transition: 'var(--transition)' }}
                      onClick={() => openEdit(t)}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{t.title}</div>
                      {t.client_name && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{t.client_name}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editTask ? 'Edit Task' : 'Create Task'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Title *</label>
                  <input className="form-input" required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title…" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Client</label>
                  <select className="form-input" value={form.client_id || ''} onChange={e => setForm({ ...form, client_id: e.target.value || null })}>
                    <option value="">No client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={form.priority || 'medium'} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value || null })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editTask ? 'Update' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
