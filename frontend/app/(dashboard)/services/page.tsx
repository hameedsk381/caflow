'use client'
import { useState, useEffect, useCallback } from 'react'
import { servicesApi } from '@/lib/api'
import { Plus, Search, Pencil, Trash2, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editService, setEditService] = useState<any | null>(null)
  const [form, setForm] = useState<any>({})

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await servicesApi.list({ search: search || undefined })
      setServices(res.data.items)
      setTotal(res.data.total)
    } catch {
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchServices() }, [fetchServices])

  const openCreate = () => { setEditService(null); setForm({}); setShowModal(true) }
  const openEdit = (s: any) => { setEditService(s); setForm({ ...s }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editService) {
        await servicesApi.update(editService.id, form)
        toast.success('Service updated!')
      } else {
        await servicesApi.create(form)
        toast.success('Service added!')
      }
      setShowModal(false)
      fetchServices()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error saving service')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return
    try {
      await servicesApi.delete(id)
      toast.success('Service deleted')
      fetchServices()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[28px] md:text-[40px] font-semibold tracking-vercel-display leading-[1.20]">Services</h1>
          <p className="text-muted-foreground mt-2">{total} service{total !== 1 ? 's' : ''} configured</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={openCreate}>
          <Plus size={15} /> Add Service
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex items-center bg-transparent border-none shadow-vercel rounded-[6px] px-3 py-1 flex-1 h-9">
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Search name, code…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="relative w-full overflow-auto rounded-lg shadow-vercel bg-card">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted"><div className="spinner mr-2" /> Loading…</div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-sm text-muted-foreground rounded-lg shadow-vercel border-dashed border border-border">
            <div className="mb-4 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center"><Briefcase size={24} style={{ color: 'var(--text-muted)' }} /></div>
            <h3>No services found</h3>
            <p>Add your firm's offerings to start tracking</p>
          </div>
        ) : (
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border"><tr className="border-b border-border transition-colors hover:bg-muted/50">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Service Name</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Code</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Base Price</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Billing Type</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Status</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"></th>
            </tr></thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td className="p-4 align-middle whitespace-nowrap"><div style={{ fontWeight: 600 }}>{s.name}</div></td>
                  <td className="p-4 align-middle whitespace-nowrap">{s.code || '—'}</td>
                  <td className="p-4 align-middle whitespace-nowrap">₹ {s.base_price?.toFixed(2)}</td>
                  <td className="p-4 align-middle whitespace-nowrap"><span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-muted text-muted-foreground hover:bg-muted/80">{s.billing_type}</span></td>
                  <td className="p-4 align-middle whitespace-nowrap"><span className={`badge ${s.is_active ? 'badge-success' : 'badge-neutral'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="p-4 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => openEdit(s)}><Pencil size={14} /></button>
                      <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => handleDelete(s.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
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
              <span className="text-lg font-semibold tracking-vercel-card">{editService ? 'Edit Service' : 'Add Service'}</span>
              <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Service Name *</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Service Code</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Base Price</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="number" step="0.01" value={form.base_price || 0} onChange={e => setForm({ ...form, base_price: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Billing Type</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.billing_type || 'fixed'} onChange={e => setForm({ ...form, billing_type: e.target.value })}>
                    {['fixed', 'hourly', 'recurring'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Active Status</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.is_active ? 'yes' : 'no'} onChange={e => setForm({ ...form, is_active: e.target.value === 'yes' })}>
                    <option value="yes">Active</option>
                    <option value="no">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-6 border-t border-border bg-muted/20">
                <button type="button" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">Save Service</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
