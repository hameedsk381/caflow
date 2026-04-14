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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[28px] md:text-[40px] font-semibold tracking-vercel-display leading-[1.20]">Notices</h1>
          <p className="text-muted-foreground mt-2">{total} open notice{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={openCreate}>
          <Plus size={15} /> Add Notice
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex items-center bg-transparent border-none shadow-vercel rounded-[6px] px-3 py-1 flex-1 h-9">
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Search ref, type…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="relative w-full overflow-auto rounded-lg shadow-vercel bg-card">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted"><div className="spinner mr-2" /> Loading…</div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-sm text-muted-foreground rounded-lg shadow-vercel border-dashed border border-border">
            <div className="mb-4 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center"><Bell size={24} style={{ color: 'var(--text-muted)' }} /></div>
            <h3>No notices found</h3>
            <p>Track departmental notices mapped to your clients</p>
          </div>
        ) : (
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border"><tr className="border-b border-border transition-colors hover:bg-muted/50">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Notice Detail</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Client</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Due Date</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Status</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"></th>
            </tr></thead>
            <tbody>
              {notices.map(n => (
                <tr key={n.id}>
                  <td className="p-4 align-middle whitespace-nowrap">
                    <div style={{ fontWeight: 600 }}>{n.notice_type}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ref: {n.reference_no || '—'}</div>
                  </td>
                  <td className="p-4 align-middle whitespace-nowrap">{clients.find(c => c.id === n.client_id)?.name || 'Unknown Client'}</td>
                  <td className="p-4 align-middle whitespace-nowrap">
                    {n.due_date ? format(new Date(n.due_date), 'dd MMM yyyy') : 'No Due Date'}
                    {n.status !== 'closed' && isOverdue(n.due_date) && (
                      <span className="badge" style={{ backgroundColor: 'var(--danger)', color: 'white', marginLeft: 8, fontSize: 10 }}>Overdue</span>
                    )}
                  </td>
                  <td className="p-4 align-middle whitespace-nowrap"><span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-muted text-muted-foreground hover:bg-muted/80">{n.status.replace('_', ' ')}</span></td>
                  <td className="p-4 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => openEdit(n)}><Pencil size={14} /></button>
                      <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => handleDelete(n.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-background rounded-lg shadow-vercel-popover max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <span className="text-lg font-semibold tracking-vercel-card">{editNotice ? 'Edit Notice' : 'Add Notice'}</span>
              <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Client *</label>
                  <select required className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.client_id || ''} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                    <option value="">Select client…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Notice Type *</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={form.notice_type || ''} onChange={e => setForm({ ...form, notice_type: e.target.value })} placeholder="e.g. Income Tax 143(1)" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Reference No</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.reference_no || ''} onChange={e => setForm({ ...form, reference_no: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Status</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.status || 'open'} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {['open', 'in_progress', 'responded', 'closed'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Issue Date</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="date" value={form.issue_date?.split('T')[0] || ''} onChange={e => setForm({ ...form, issue_date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Due Date</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="date" value={form.due_date?.split('T')[0] || ''} onChange={e => setForm({ ...form, due_date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-6 border-t border-border bg-muted/20">
                <button type="button" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">Save Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
