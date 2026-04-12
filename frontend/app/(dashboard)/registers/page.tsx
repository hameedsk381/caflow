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
      <div className="page-header">
        <div>
          <h1 className="page-title">Registers</h1>
          <p className="page-subtitle">{total} statutory register{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Register
        </button>
      </div>

      <div className="filter-row">
        <div className="search-bar">
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Search title, type…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted"><div className="spinner mr-2" /> Loading…</div>
        ) : registers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Database size={24} style={{ color: 'var(--text-muted)' }} /></div>
            <h3>No registers found</h3>
            <p>Maintain statutory registers and compliance records</p>
          </div>
        ) : (
          <table>
            <thead><tr>
              <th>Register Detail</th><th>Client</th><th>Period</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {registers.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Type: {r.register_type}</div>
                  </td>
                  <td>{clients.find(c => c.id === r.client_id)?.name || '—'}</td>
                  <td>{r.period || '—'}</td>
                  <td><span className={`badge ${r.status === 'maintained' ? 'badge-success' : 'badge-neutral'}`}>{r.status}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-ghost btn-icon" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                      <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(r.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
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
              <span className="modal-title">{editRegister ? 'Edit Register' : 'Add Register'}</span>
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
                  <label className="form-label">Title *</label>
                  <input className="form-input" required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Fixed Asset Register" />
                </div>
                <div className="form-group">
                  <label className="form-label">Register Type *</label>
                  <input className="form-input" required value={form.register_type || ''} onChange={e => setForm({ ...form, register_type: e.target.value })} placeholder="e.g. Asset, Shareholder" />
                </div>
                <div className="form-group">
                  <label className="form-label">Period</label>
                  <input className="form-input" value={form.period || ''} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="e.g. FY 23-24" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {['pending', 'maintained', 'overdue'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
