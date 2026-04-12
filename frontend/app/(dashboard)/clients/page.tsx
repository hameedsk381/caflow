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
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{total} client{total !== 1 ? 's' : ''} in your firm</p>
        </div>
        <button id="add-client-btn" className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-bar">
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Search name, GSTIN, PAN…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-input" style={{ width: 'auto', padding: '8px 36px 8px 12px' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 48, gap: 12 }}>
            <div className="spinner" /><span className="text-muted">Loading…</span>
          </div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><User size={24} style={{ color: 'var(--text-muted)' }} /></div>
            <h3>No clients yet</h3>
            <p>Add your first client to get started</p>
          </div>
        ) : (
          <table>
            <thead><tr>
              <th>Name</th><th>GSTIN</th><th>PAN</th><th>Business Type</th>
              <th>Contact</th><th>Status</th><th>Added</th><th></th>
            </tr></thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar avatar-sm" style={{ background: '#' + c.id.slice(-6) }}>
                        {c.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                        {c.email && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{c.gstin || <span className="text-muted">—</span>}</td>
                  <td>{c.pan || <span className="text-muted">—</span>}</td>
                  <td>
                    {c.business_type ? (
                      <span className="badge badge-neutral">{c.business_type}</span>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td>{c.phone || <span className="text-muted">—</span>}</td>
                  <td>
                    <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>{format(new Date(c.created_at), 'dd MMM yyyy')}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-ghost btn-icon" onClick={() => openEdit(c)} title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(c.id)} title="Delete"
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editClient ? 'Edit Client' : 'Add New Client'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Name *</label>
                  <input className="form-input" required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sharma Enterprises" />
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN</label>
                  <input className="form-input" value={form.gstin || ''} onChange={e => setForm({ ...form, gstin: e.target.value })} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                </div>
                <div className="form-group">
                  <label className="form-label">PAN</label>
                  <input className="form-input" value={form.pan || ''} onChange={e => setForm({ ...form, pan: e.target.value })} placeholder="AAAAA0000A" maxLength={10} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Type</label>
                  <select className="form-input" value={form.business_type || ''} onChange={e => setForm({ ...form, business_type: e.target.value })}>
                    <option value="">Select type</option>
                    {['Proprietorship', 'Partnership', 'LLP', 'Private Ltd', 'Public Ltd', 'HUF', 'Trust', 'Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                {editClient && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Address</label>
                  <textarea className="form-input" rows={2} value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="save-client-btn">
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
