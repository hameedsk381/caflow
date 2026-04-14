'use client'
import { useState, useEffect, useCallback } from 'react'
import { invoicesApi, clientsApi } from '@/lib/api'
import type { Invoice, Client } from '@/types'
import { Plus, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled']
const statusBadge: Record<string, string> = {
  draft: 'badge-neutral', sent: 'badge-info',
  paid: 'badge-success', overdue: 'badge-danger', cancelled: 'badge-neutral'
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null)
  const [form, setForm] = useState<any>({ amount: '', tax_amount: '0' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [iRes, cRes] = await Promise.all([
        invoicesApi.list({ status: filterStatus || undefined }),
        clientsApi.list({ size: 100 }),
      ])
      setInvoices(iRes.data.items)
      setTotal(iRes.data.total)
      setClients(cRes.data.items)
    } catch { toast.error('Failed to load invoices') }
    finally { setLoading(false) }
  }, [filterStatus])

  useEffect(() => { fetchData() }, [fetchData])

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount), 0)
  const pendingAmount = invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + Number(i.total_amount), 0)

  const openCreate = () => {
    const num = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900 + 100))}`
    setEditInvoice(null)
    setForm({ amount: '', tax_amount: '0', status: 'draft', invoice_number: num })
    setShowModal(true)
  }
  const openEdit = (inv: Invoice) => { setEditInvoice(inv); setForm({ ...inv }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...form, amount: parseFloat(form.amount), tax_amount: parseFloat(form.tax_amount || '0') }
      if (editInvoice) {
        await invoicesApi.update(editInvoice.id, payload)
        toast.success('Invoice updated!')
      } else {
        await invoicesApi.create(payload)
        toast.success('Invoice created!')
      }
      setShowModal(false)
      fetchData()
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Error saving invoice') }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try { await invoicesApi.update(id, { status }); fetchData() }
    catch { toast.error('Failed to update') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return
    try { await invoicesApi.delete(id); toast.success('Deleted'); fetchData() }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[28px] md:text-[40px] font-semibold tracking-vercel-display leading-[1.20]">Billing & Invoices</h1>
          <p className="text-muted-foreground mt-2">{total} invoice{total !== 1 ? 's' : ''}</p>
        </div>
        <button id="add-invoice-btn" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={openCreate}><Plus size={15} /> New Invoice</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Collected', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: '#10b981' },
          { label: 'Pending Amount', value: `₹${pendingAmount.toLocaleString('en-IN')}`, color: '#f59e0b' },
          { label: 'Total Invoices', value: total, color: '#6366f1' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ flex: 1 }}>
            <div className="stat-card-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="relative w-full overflow-auto rounded-lg shadow-vercel bg-card">
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 48, gap: 12 }}><div className="spinner" /><span className="text-muted">Loading…</span></div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-sm text-muted-foreground rounded-lg shadow-vercel border-dashed border border-border">
            <div className="mb-4 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center"><Receipt size={24} style={{ color: 'var(--text-muted)' }} /></div>
            <h3>No invoices yet</h3><p>Create your first invoice</p>
          </div>
        ) : (
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border"><tr className="border-b border-border transition-colors hover:bg-muted/50"><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Invoice #</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Client</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Amount</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Tax</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Total</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Status</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Due Date</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"></th></tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-light)', fontFamily: 'monospace' }}>{inv.invoice_number}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.client_name || <span className="text-muted">—</span>}</td>
                  <td className="p-4 align-middle whitespace-nowrap">₹{Number(inv.amount).toLocaleString('en-IN')}</td>
                  <td className="p-4 align-middle whitespace-nowrap">₹{Number(inv.tax_amount).toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{Number(inv.total_amount).toLocaleString('en-IN')}</td>
                  <td className="p-4 align-middle whitespace-nowrap">
                    <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" style={{ padding: '4px 28px 4px 8px', fontSize: 12, width: 'auto' }}
                      value={inv.status} onChange={e => handleStatusChange(inv.id, e.target.value)}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-4 align-middle whitespace-nowrap">{inv.due_date ? format(new Date(inv.due_date), 'dd MMM yyyy') : <span className="text-muted">—</span>}</td>
                  <td className="p-4 align-middle whitespace-nowrap">
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(inv)}>✏</button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(inv.id)} style={{ color: 'var(--danger)' }}>🗑</button>
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
              <span className="text-lg font-semibold tracking-vercel-card">{editInvoice ? 'Edit Invoice' : 'New Invoice'}</span>
              <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Invoice Number *</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={form.invoice_number || ''} onChange={e => setForm({ ...form, invoice_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Client</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.client_id || ''} onChange={e => setForm({ ...form, client_id: e.target.value || null })}>
                    <option value="">No client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Description</label>
                  <textarea className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} placeholder="Services rendered…" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Amount (₹) *</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="number" required min="0" step="0.01" value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Tax / GST (₹)</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="number" min="0" step="0.01" value={form.tax_amount || '0'} onChange={e => setForm({ ...form, tax_amount: e.target.value })} />
                </div>
                {form.amount && (
                  <div style={{ gridColumn: '1 / -1', padding: '10px 14px', background: 'var(--accent-glow)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, color: 'var(--accent-light)' }}>
                    Total: ₹{(parseFloat(form.amount || '0') + parseFloat(form.tax_amount || '0')).toLocaleString('en-IN')}
                  </div>
                )}
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Status</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.status || 'draft'} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Due Date</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value || null })} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-6 border-t border-border bg-muted/20">
                <button type="button" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">{editInvoice ? 'Update' : 'Create Invoice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
