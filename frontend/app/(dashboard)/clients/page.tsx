'use client'
import { useState, useEffect, useCallback } from 'react'
import { clientsApi } from '@/lib/api'
import type { Client } from '@/types'
import { Plus, Search, Pencil, Trash2, User, Building } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [form, setForm] = useState<any>({})

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await clientsApi.list({ search: search || undefined, status: status || undefined })
      setClients(res.data.items)
      setTotal(res.data.total)
    } catch {
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => { fetchClients() }, [fetchClients])

  const openCreate = () => { setEditClient(null); setForm({}); setShowModal(true) }
  const openEdit = (c: Client) => { setEditClient(c); setForm({ ...c }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editClient) {
        await clientsApi.update(editClient.id, form)
        toast.success('Client updated!')
      } else {
        await clientsApi.create(form)
        toast.success('Client added!')
      }
      setShowModal(false)
      fetchClients()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error saving client')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client?')) return
    try {
      await clientsApi.delete(id)
      toast.success('Client deleted')
      fetchClients()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[28px] md:text-[40px] font-semibold tracking-vercel-display leading-[1.20]">Clients</h1>
          <p className="text-muted-foreground mt-2">{total} client{total !== 1 ? 's' : ''} in your firm</p>
        </div>
        <button id="add-client-btn" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={openCreate}>
          <Plus size={15} /> Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex items-center bg-transparent border-none shadow-vercel rounded-[6px] px-3 py-1 flex-1 h-9">
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Search name, GSTIN, PAN…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" style={{ width: 'auto', padding: '8px 36px 8px 12px' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="relative w-full overflow-auto rounded-lg shadow-vercel bg-card">
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 48, gap: 12 }}>
            <div className="spinner" /><span className="text-muted">Loading…</span>
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-sm text-muted-foreground rounded-lg shadow-vercel border-dashed border border-border">
            <div className="mb-4 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center"><User size={24} style={{ color: 'var(--text-muted)' }} /></div>
            <h3>No clients yet</h3>
            <p>Add your first client to get started</p>
          </div>
        ) : (
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border"><tr className="border-b border-border transition-colors hover:bg-muted/50">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Name</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">GSTIN</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">PAN</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Business Type</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Contact</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Status</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Added</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"></th>
            </tr></thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td className="p-4 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex shrink-0 overflow-hidden rounded-full font-medium items-center justify-center text-white h-8 w-8 text-xs" style={{ background: '#' + c.id.slice(-6) }}>
                        {c.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                        {c.email && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle whitespace-nowrap">{c.gstin || <span className="text-muted">—</span>}</td>
                  <td className="p-4 align-middle whitespace-nowrap">{c.pan || <span className="text-muted">—</span>}</td>
                  <td className="p-4 align-middle whitespace-nowrap">
                    {c.business_type ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-muted text-muted-foreground hover:bg-muted/80">{c.business_type}</span>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td className="p-4 align-middle whitespace-nowrap">{c.phone || <span className="text-muted">—</span>}</td>
                  <td className="p-4 align-middle whitespace-nowrap">
                    <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 align-middle whitespace-nowrap">{format(new Date(c.created_at), 'dd MMM yyyy')}</td>
                  <td className="p-4 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => openEdit(c)} title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => handleDelete(c.id)} title="Delete"
                        style={{ color: 'var(--danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-background rounded-lg shadow-vercel-popover max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <span className="text-lg font-semibold tracking-vercel-card">{editClient ? 'Edit Client' : 'Add New Client'}</span>
              <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Name *</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sharma Enterprises" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">GSTIN</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.gstin || ''} onChange={e => setForm({ ...form, gstin: e.target.value })} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">PAN</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.pan || ''} onChange={e => setForm({ ...form, pan: e.target.value })} placeholder="AAAAA0000A" maxLength={10} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Email</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Phone</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Business Type</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.business_type || ''} onChange={e => setForm({ ...form, business_type: e.target.value })}>
                    <option value="">Select type</option>
                    {['Proprietorship', 'Partnership', 'LLP', 'Private Ltd', 'Public Ltd', 'HUF', 'Trust', 'Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                {editClient && (
                  <div className="form-group">
                    <label className="text-sm font-medium leading-none mb-2 block text-foreground">Status</label>
                    <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Address</label>
                  <textarea className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" rows={2} value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-6 border-t border-border bg-muted/20">
                <button type="button" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" id="save-client-btn">
                  {editClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
