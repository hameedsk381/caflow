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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[28px] md:text-[40px] font-semibold tracking-vercel-display leading-[1.20]">Compliance Tracker</h1>
          <p className="text-muted-foreground mt-2">{total} records · {overdue > 0 && <span style={{ color: 'var(--danger)' }}>{overdue} overdue</span>}</p>
        </div>
        <button id="add-compliance-btn" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={openCreate}>
          <Plus size={15} /> Add Record
        </button>
      </div>

      {overdue > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 13, color: 'var(--danger)' }}>
          <AlertTriangle size={16} /><strong>{overdue} compliance item{overdue > 1 ? 's are' : ' is'} overdue!</strong> Please file immediately.
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="relative w-full overflow-auto rounded-lg shadow-vercel bg-card">
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 48, gap: 12 }}>
            <div className="spinner" /><span className="text-muted">Loading…</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-sm text-muted-foreground rounded-lg shadow-vercel border-dashed border border-border">
            <div className="mb-4 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center"><ShieldCheck size={24} style={{ color: 'var(--text-muted)' }} /></div>
            <h3>No compliance records</h3><p>Add GST, ITR, TDS or other compliance items</p>
          </div>
        ) : (
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border"><tr className="border-b border-border transition-colors hover:bg-muted/50">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Client</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Type</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Period</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Due Date</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Status</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Assigned</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Reference</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"></th>
            </tr></thead>
            <tbody>
              {records.map(r => {
                const isLate = r.status !== 'filed' && isPast(new Date(r.due_date))
                return (
                  <tr key={r.id} style={isLate ? { background: 'rgba(239,68,68,0.04)' } : {}}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.client_name || '—'}</td>
                    <td className="p-4 align-middle whitespace-nowrap"><span className="badge badge-accent">{r.type}</span></td>
                    <td className="p-4 align-middle whitespace-nowrap">{r.period || '—'}</td>
                    <td style={{ color: isLate ? 'var(--danger)' : 'inherit', fontWeight: isLate ? 600 : 400 }}>
                      {format(new Date(r.due_date), 'dd MMM yyyy')}
                      {isLate && <span style={{ fontSize: 10, marginLeft: 6 }}>⚠</span>}
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap">
                      <select
                        className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ padding: '4px 28px 4px 8px', fontSize: 12, width: 'auto' }}
                        value={r.status}
                        onChange={e => handleQuickStatus(r.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap">{r.assignee_name || <span className="text-muted">Unassigned</span>}</td>
                    <td style={{ fontSize: 12 }}>{r.filing_reference || <span className="text-muted">—</span>}</td>
                    <td className="p-4 align-middle whitespace-nowrap">
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-background rounded-lg shadow-vercel-popover max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <span className="text-lg font-semibold tracking-vercel-card">{editRecord ? 'Edit Compliance Record' : 'Add Compliance Record'}</span>
              <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Client *</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={form.client_id || ''} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                    <option value="">Select client…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Type *</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={form.type || ''} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="">Select type</option>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Period</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.period || ''} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="e.g. Q1 FY2024-25" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Due Date *</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="date" required value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Status</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                {editRecord && (
                  <div className="form-group">
                    <label className="text-sm font-medium leading-none mb-2 block text-foreground">Filing Reference</label>
                    <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.filing_reference || ''} onChange={e => setForm({ ...form, filing_reference: e.target.value })} placeholder="ARN / Ack Number" />
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Notes</label>
                  <textarea className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-6 border-t border-border bg-muted/20">
                <button type="button" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">{editRecord ? 'Update' : 'Add Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
