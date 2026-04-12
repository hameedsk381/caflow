'use client'
import { useState, useEffect, useCallback } from 'react'
import { noticesApi, clientsApi } from '@/lib/api'
import { Plus, Search, Pencil, Trash2, Bell, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, isPast } from 'date-fns'

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editNotice, setEditNotice] = useState<any | null>(null)
  const [form, setForm] = useState<any>({})

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await noticesApi.list({ search: search || undefined })
      setNotices(res.data.items)
      setTotal(res.data.total)
    } catch {
      toast.error('Failed to load notices')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { 
    fetchNotices()
    clientsApi.list({ size: 100 }).then(res => setClients(res.data.items))
  }, [fetchNotices])

  const openCreate = () => { setEditNotice(null); setForm({}); setShowModal(true) }
  const openEdit = (n: any) => { setEditNotice(n); setForm({ ...n }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (!payload.client_id) { toast.error('Client is required'); return }
      
      if (editNotice) {
        await noticesApi.update(editNotice.id, payload)
        toast.success('Notice updated!')
      } else {
        await noticesApi.create(payload)
        toast.success('Notice added!')
      }
      setShowModal(false)
      fetchNotices()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error saving notice')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notice?')) return
    try {
      await noticesApi.delete(id)
      toast.success('Notice deleted')
      fetchNotices()
    } catch { toast.error('Failed to delete') }
  }

  const isOverdue = (due_date: string) => due_date && isPast(new Date(due_date))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notices</h1>
          <p className="page-subtitle">{total} open notice{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Notice
        </button>
      </div>

      <div className="filter-row">
        <div className="search-bar">
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Search ref, type…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted"><div className="spinner mr-2" /> Loading…</div>
        ) : notices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bell size={24} style={{ color: 'var(--text-muted)' }} /></div>
            <h3>No notices found</h3>
            <p>Track departmental notices mapped to your clients</p>>
          </div>
        ) : (
          <table>
            <thead><tr>
              <th>Notice Detail</th><th>Client</th><th>Due Date</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {notices.map(n => (
                <tr key={n.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{n.notice_type}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ref: {n.reference_no || '—'}</div>
                  </td>
                  <td>{clients.find(c => c.id === n.client_id)?.name || 'Unknown Client'}</td>
                  <td>
                    {n.due_date ? format(new Date(n.due_date), 'dd MMM yyyy') : 'No Due Date'}
                    {n.status !== 'closed' && isOverdue(n.due_date) && (
                      <span className="badge" style={{ backgroundColor: 'var(--danger)', color: 'white', marginLeft: 8, fontSize: 10 }}>Overdue</span>
                    )}
                  </td>
                  <td><span className="badge badge-neutral">{n.status.replace('_', ' ')}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-ghost btn-icon" onClick={() => openEdit(n)}><Pencil size={14} /></button>
                      <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(n.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editNotice ? 'Edit Notice' : 'Add Notice'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Client *</label>
                  <select required className="form-input" value={form.client_id || ''} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                    <option value="">Select client…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notice Type *</label>
                  <input className="form-input" required value={form.notice_type || ''} onChange={e => setForm({ ...form, notice_type: e.target.value })} placeholder="e.g. Income Tax 143(1)" />
                </div>
                <div className="form-group">
                  <label className="form-label">Reference No</label>
                  <input className="form-input" value={form.reference_no || ''} onChange={e => setForm({ ...form, reference_no: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status || 'open'} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {['open', 'in_progress', 'responded', 'closed'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Issue Date</label>
                  <input className="form-input" type="date" value={form.issue_date?.split('T')[0] || ''} onChange={e => setForm({ ...form, issue_date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={form.due_date?.split('T')[0] || ''} onChange={e => setForm({ ...form, due_date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
