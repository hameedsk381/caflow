'use client'
import { useState, useEffect, useCallback } from 'react'
import { complianceApi, clientsApi } from '@/lib/api'
import type { ComplianceRecord, Client } from '@/types'
import { Plus, ShieldCheck, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, isPast, isToday } from 'date-fns'

const TYPES = ['GST', 'ITR', 'TDS', 'ROC', 'PT', 'OTHER']
const STATUS_OPTIONS = ['pending', 'in_progress', 'filed', 'overdue']

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'badge-warning', in_progress: 'badge-info',
    filed: 'badge-success', overdue: 'badge-danger'
  }
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status?.replace('_', ' ')}</span>
}

export default function CompliancePage() {
  const [records, setRecords] = useState<ComplianceRecord[]>([])
  const [total, setTotal] = useState(0)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editRecord, setEditRecord] = useState<ComplianceRecord | null>(null)
  const [form, setForm] = useState<any>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, clRes] = await Promise.all([
        complianceApi.list({ status: filterStatus || undefined, type: filterType || undefined }),
        clientsApi.list({ size: 100 }),
      ])
      setRecords(cRes.data.items)
      setTotal(cRes.data.total)
      setClients(clRes.data.items)
    } catch { toast.error('Failed to load compliance data') }
    finally { setLoading(false) }
  }, [filterStatus, filterType])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => { setEditRecord(null); setForm({ status: 'pending' }); setShowModal(true) }
  const openEdit = (r: ComplianceRecord) => { setEditRecord(r); setForm({ ...r }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editRecord) {
        await complianceApi.update(editRecord.id, form)
        toast.success('Record updated!')
      } else {
        await complianceApi.create(form)
        toast.success('Compliance record added!')
      }
      setShowModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error saving record')
    }
  }

  const handleQuickStatus = async (id: string, status: string) => {
    try {
      await complianceApi.update(id, { status })
      toast.success('Status updated')
      fetchData()
    } catch { toast.error('Failed to update status') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this compliance record?')) return
    try {
      await complianceApi.delete(id)
      toast.success('Deleted')
      fetchData()
    } catch { toast.error('Failed to delete') }
  }

  const overdue = records.filter(r => r.status === 'overdue').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance Tracker</h1>
          <p className="page-subtitle">{total} records · {overdue > 0 && <span style={{ color: 'var(--danger)' }}>{overdue} overdue</span>}</p>
        </div>
        <button id="add-compliance-btn" className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Record
        </button>
      </div>

      {overdue > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 13, color: 'var(--danger)' }}>
          <AlertTriangle size={16} /><strong>{overdue} compliance item{overdue > 1 ? 's are' : ' is'} overdue!</strong> Please file immediately.
        </div>
      )}

      <div className="filter-row">
        <select className="form-input" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="form-input" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 48, gap: 12 }}>
            <div className="spinner" /><span className="text-muted">Loading…</span>
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ShieldCheck size={24} style={{ color: 'var(--text-muted)' }} /></div>
            <h3>No compliance records</h3><p>Add GST, ITR, TDS or other compliance items</p>
          </div>
        ) : (
          <table>
            <thead><tr>
              <th>Client</th><th>Type</th><th>Period</th><th>Due Date</th>
              <th>Status</th><th>Assigned</th><th>Reference</th><th></th>
            </tr></thead>
            <tbody>
              {records.map(r => {
                const isLate = r.status !== 'filed' && isPast(new Date(r.due_date))
                return (
                  <tr key={r.id} style={isLate ? { background: 'rgba(239,68,68,0.04)' } : {}}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.client_name || '—'}</td>
                    <td><span className="badge badge-accent">{r.type}</span></td>
                    <td>{r.period || '—'}</td>
                    <td style={{ color: isLate ? 'var(--danger)' : 'inherit', fontWeight: isLate ? 600 : 400 }}>
                      {format(new Date(r.due_date), 'dd MMM yyyy')}
                      {isLate && <span style={{ fontSize: 10, marginLeft: 6 }}>⚠</span>}
                    </td>
                    <td>
                      <select
                        className="form-input"
                        style={{ padding: '4px 28px 4px 8px', fontSize: 12, width: 'auto' }}
                        value={r.status}
                        onChange={e => handleQuickStatus(r.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td>{r.assignee_name || <span className="text-muted">Unassigned</span>}</td>
                    <td style={{ fontSize: 12 }}>{r.filing_reference || <span className="text-muted">—</span>}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(r)}>✏</button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(r.id)} style={{ color: 'var(--danger)' }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editRecord ? 'Edit Compliance Record' : 'Add Compliance Record'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Client *</label>
                  <select className="form-input" required value={form.client_id || ''} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                    <option value="">Select client…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select className="form-input" required value={form.type || ''} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="">Select type</option>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Period</label>
                  <input className="form-input" value={form.period || ''} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="e.g. Q1 FY2024-25" />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input className="form-input" type="date" required value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                {editRecord && (
                  <div className="form-group">
                    <label className="form-label">Filing Reference</label>
                    <input className="form-input" value={form.filing_reference || ''} onChange={e => setForm({ ...form, filing_reference: e.target.value })} placeholder="ARN / Ack Number" />
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editRecord ? 'Update' : 'Add Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
