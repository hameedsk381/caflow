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
      <div className="page-header">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-subtitle">{total} service{total !== 1 ? 's' : ''} configured</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Service
        </button>
      </div>

      <div className="filter-row">
        <div className="search-bar">
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Search name, code…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted"><div className="spinner mr-2" /> Loading…</div>
        ) : services.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Briefcase size={24} style={{ color: 'var(--text-muted)' }} /></div>
            <h3>No services found</h3>
            <p>Add your firm's offerings to start tracking</p>
          </div>
        ) : (
          <table>
            <thead><tr>
              <th>Service Name</th><th>Code</th><th>Base Price</th><th>Billing Type</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td><div style={{ fontWeight: 600 }}>{s.name}</div></td>
                  <td>{s.code || '—'}</td>
                  <td>₹ {s.base_price?.toFixed(2)}</td>
                  <td><span className="badge badge-neutral">{s.billing_type}</span></td>
                  <td><span className={`badge ${s.is_active ? 'badge-success' : 'badge-neutral'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-ghost btn-icon" onClick={() => openEdit(s)}><Pencil size={14} /></button>
                      <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(s.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
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
              <span className="modal-title">{editService ? 'Edit Service' : 'Add Service'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Service Name *</label>
                  <input className="form-input" required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Service Code</label>
                  <input className="form-input" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Base Price</label>
                  <input className="form-input" type="number" step="0.01" value={form.base_price || 0} onChange={e => setForm({ ...form, base_price: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Billing Type</label>
                  <select className="form-input" value={form.billing_type || 'fixed'} onChange={e => setForm({ ...form, billing_type: e.target.value })}>
                    {['fixed', 'hourly', 'recurring'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Active Status</label>
                  <select className="form-input" value={form.is_active ? 'yes' : 'no'} onChange={e => setForm({ ...form, is_active: e.target.value === 'yes' })}>
                    <option value="yes">Active</option>
                    <option value="no">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Service</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
