'use client'
import { useState, useEffect, useCallback } from 'react'
import { leadsApi } from '@/lib/api'
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editLead, setEditLead] = useState<any | null>(null)
  const [form, setForm] = useState<any>({})

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await leadsApi.list({ search: search || undefined, status: status || undefined })
      setLeads(res.data.items)
      setTotal(res.data.total)
    } catch {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const openCreate = () => { setEditLead(null); setForm({}); setShowModal(true) }
  const openEdit = (l: any) => { setEditLead(l); setForm({ ...l }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editLead) {
        await leadsApi.update(editLead.id, form)
        toast.success('Lead updated!')
      } else {
        await leadsApi.create(form)
        toast.success('Lead added!')
      }
      setShowModal(false)
      fetchLeads()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error saving lead')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return
    try {
      await leadsApi.delete(id)
      toast.success('Lead deleted')
      fetchLeads()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">{total} lead{total !== 1 ? 's' : ''} in pipeline</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Lead
        </button>
      </div>

      <div className="filter-row">
        <div className="search-bar">
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Search name, company…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: 'auto' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal_sent">Proposal Sent</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted"><div className="spinner mr-2" /> Loading…</div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={24} style={{ color: 'var(--text-muted)' }} /></div>
            <h3>No leads found</h3>
            <p>Add leads to start tracking your CRM pipeline</p>
          </div>
        ) : (
          <table>
            <thead><tr>
              <th>Name</th><th>Company</th><th>Contact</th><th>Status</th><th>Added</th><th></th>
            </tr></thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{l.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Priority: {l.priority}</div>
                  </td>
                  <td>{l.company_name || '—'}</td>
                  <td>{l.email || l.phone || '—'}</td>
                  <td><span className="badge badge-neutral">{l.status}</span></td>
                  <td>{format(new Date(l.created_at), 'dd MMM yyyy')}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-ghost btn-icon" onClick={() => openEdit(l)}><Pencil size={14} /></button>
                      <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(l.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
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
              <span className="modal-title">{editLead ? 'Edit Lead' : 'Add Lead'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Name *</label>
                  <input className="form-input" required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input className="form-input" value={form.company_name || ''} onChange={e => setForm({ ...form, company_name: e.target.value })} />
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
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status || 'new'} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={form.priority || 'medium'} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {['low', 'medium', 'high'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
