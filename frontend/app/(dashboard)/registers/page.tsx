'use client'
import { useState, useEffect, useCallback } from 'react'
import { registersApi, clientsApi } from '@/lib/api'
import { Plus, Search, Pencil, Trash2, Database } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function RegistersPage() {
  const [registers, setRegisters] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editRegister, setEditRegister] = useState<any | null>(null)
  const [form, setForm] = useState<any>({})

  const fetchRegisters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await registersApi.list({ search: search || undefined })
      setRegisters(res.data.items)
      setTotal(res.data.total)
    } catch {
      toast.error('Failed to load registers')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { 
    fetchRegisters()
    clientsApi.list({ size: 100 }).then(res => setClients(res.data.items))
  }, [fetchRegisters])

  const openCreate = () => { setEditRegister(null); setForm({}); setShowModal(true) }
  const openEdit = (r: any) => { setEditRegister(r); setForm({ ...r }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (!payload.client_id) { toast.error('Client is required'); return }
      
      if (editRegister) {
        await registersApi.update(editRegister.id, payload)
        toast.success('Register updated!')
      } else {
        await registersApi.create(payload)
        toast.success('Register added!')
      }
      setShowModal(false)
      fetchRegisters()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error saving register')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this register?')) return
    try {
      await registersApi.delete(id)
      toast.success('Register deleted')
      fetchRegisters()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[28px] md:text-[40px] font-semibold tracking-vercel-display leading-[1.20]">Registers</h1>
          <p className="text-muted-foreground mt-2">{total} statutory register{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={openCreate}>
          <Plus size={15} /> Add Register
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex items-center bg-transparent border-none shadow-vercel rounded-[6px] px-3 py-1 flex-1 h-9">
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Search title, type…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="relative w-full overflow-auto rounded-lg shadow-vercel bg-card">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted"><div className="spinner mr-2" /> Loading…</div>
        ) : registers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-sm text-muted-foreground rounded-lg shadow-vercel border-dashed border border-border">
            <div className="mb-4 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center"><Database size={24} style={{ color: 'var(--text-muted)' }} /></div>
            <h3>No registers found</h3>
            <p>Maintain statutory registers and compliance records</p>
          </div>
        ) : (
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border"><tr className="border-b border-border transition-colors hover:bg-muted/50">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Register Detail</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Client</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Period</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Status</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"></th>
            </tr></thead>
            <tbody>
              {registers.map(r => (
                <tr key={r.id}>
                  <td className="p-4 align-middle whitespace-nowrap">
                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Type: {r.register_type}</div>
                  </td>
                  <td className="p-4 align-middle whitespace-nowrap">{clients.find(c => c.id === r.client_id)?.name || '—'}</td>
                  <td className="p-4 align-middle whitespace-nowrap">{r.period || '—'}</td>
                  <td className="p-4 align-middle whitespace-nowrap"><span className={`badge ${r.status === 'maintained' ? 'badge-success' : 'badge-neutral'}`}>{r.status}</span></td>
                  <td className="p-4 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                      <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => handleDelete(r.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
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
              <span className="text-lg font-semibold tracking-vercel-card">{editRegister ? 'Edit Register' : 'Add Register'}</span>
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
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Title *</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Fixed Asset Register" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Register Type *</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={form.register_type || ''} onChange={e => setForm({ ...form, register_type: e.target.value })} placeholder="e.g. Asset, Shareholder" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Period</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.period || ''} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="e.g. FY 23-24" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Status</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {['pending', 'maintained', 'overdue'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-6 border-t border-border bg-muted/20">
                <button type="button" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">Save Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
