'use client'
import { useState, useEffect, useCallback } from 'react'
import { invoicesApi, clientsApi } from '@/lib/api'
import type { Invoice, Client } from '@/types'
import { 
  Plus, Receipt, Download, Search, Filter, 
  MoreVertical, Edit3, Trash2, Printer, Mail,
  ArrowUpRight, ArrowDownLeft, Wallet, FileText,
  CreditCard, TrendingUp, CheckCircle2, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled']

const statusMap: Record<string, { label: string, color: string }> = {
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700' },
  sent: { label: 'Issued', color: 'bg-blue-100 text-blue-700' },
  overdue: { label: 'Overdue', color: 'bg-rose-100 text-rose-700' },
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Void', color: 'bg-slate-200 text-slate-400' }
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
  const [search, setSearch] = useState('')

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
    } catch { toast.error('Failed to load financial records') }
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
    catch { toast.error('Failed to update status') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Formally void this invoice?')) return
    try { await invoicesApi.delete(id); toast.success('Invoice voided'); fetchData() }
    catch { toast.error('Failed to void invoice') }
  }

  const handleTallyExport = async () => {
    try {
      const response = await invoicesApi.exportTally()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoices_tally_${format(new Date(), 'yyyy-MM-dd')}.xml`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Tally ERP 9 XML Synchronized!')
    } catch { toast.error('Financial export failed') }
  }

  const filteredInvoices = invoices.filter(i => 
    i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    i.client_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Precision Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Billing & Receivables</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{total} Total Invoices</p>
        </div>
        
        <div className="flex items-center gap-2">
            <Button 
                variant="outline"
                size="sm"
                className="h-9 px-4 text-[11px] font-black uppercase tracking-tight border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100" 
                onClick={handleTallyExport}
            >
                <Download className="h-4 w-4 mr-2" /> Sync Tally XML
            </Button>
            <Button onClick={openCreate} className="h-9 px-4 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Realized Revenue</p>
                    <p className="text-3xl font-black tracking-tighter text-emerald-600">₹{totalRevenue.toLocaleString('en-IN')}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Outstanding Claims</p>
                    <p className="text-3xl font-black tracking-tighter text-amber-600">₹{pendingAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <Clock className="h-5 w-5" />
                </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-[#0f172a] text-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Growth Index</p>
                    <p className="text-3xl font-black tracking-tighter">+{Math.ceil(total * 1.2)}%</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <TrendingUp className="h-5 w-5" />
                </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Tools */}
      <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Invoice # or Client..." className="h-8 pl-8 w-[240px] text-xs font-bold border-slate-200 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
             <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 w-[140px] text-xs font-bold border-slate-200 bg-white">
                    <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="null">All Status</SelectItem>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
                </SelectContent>
             </Select>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-tight">Print Batch</Button>
          </div>
      </div>

      {/* High-Density Invoice Table */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/50">
                <TableRow className="h-10 hover:bg-transparent border-b border-slate-100">
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Invoice #</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Assessee / Client</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-right">Net Amount</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-right">Tax (GST)</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-right">Total Payable</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-center">Status</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Due Date</TableHead>
                    <TableHead className="px-4 w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Retrieving Ledgers…</TableCell></TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-xs font-bold text-slate-400 italic">No financial records detected.</TableCell></TableRow>
              ) : filteredInvoices.map((inv) => (
                <TableRow key={inv.id} className="h-11 border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="px-4 font-black text-[12px] text-blue-600 font-mono tracking-tighter">{inv.invoice_number}</TableCell>
                  <TableCell className="px-4 font-bold text-[13px] text-slate-900 tracking-tight">{inv.client_name || '—'}</TableCell>
                  <TableCell className="px-4 text-right text-[12px] font-bold text-slate-600">₹{Number(inv.amount).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="px-4 text-right text-[12px] font-bold text-slate-600">₹{Number(inv.tax_amount).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="px-4 text-right text-[13px] font-black text-slate-900">₹{Number(inv.total_amount).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="px-4 text-center">
                    <Badge className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter ${statusMap[inv.status]?.color}`}>
                        {statusMap[inv.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 text-[11px] font-bold text-slate-500 tabular-nums">{inv.due_date ? format(new Date(inv.due_date), 'dd/MM/yyyy') : '—'}</TableCell>
                  <TableCell className="px-4 text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0 rounded-lg hover:bg-slate-100"><MoreVertical className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => openEdit(inv)}><Edit3 className="mr-2 h-3.5 w-3.5" /> Edit Invoice</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold"><Mail className="mr-2 h-3.5 w-3.5" /> Email Client</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold"><Printer className="mr-2 h-3.5 w-3.5" /> Print PDF</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold text-rose-600" onClick={() => handleDelete(inv.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Void Invoice</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <Card className="max-w-2xl w-full rounded-2xl border-none shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
             <CardHeader className="bg-slate-50 border-b p-4 px-6">
                <CardTitle className="text-lg font-black tracking-tight flex items-center justify-between">
                    {editInvoice ? 'Amend Statutory Invoice' : 'Issue New Statutory Invoice'}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowModal(false)}>✕</Button>
                </CardTitle>
             </CardHeader>
             <form onSubmit={handleSubmit}>
                <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Invoice Number</label>
                        <Input required placeholder="INV/2026/001" className="h-9 font-bold text-sm" value={form.invoice_number || ''} onChange={e => setForm({...form, invoice_number: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assessee / Client</label>
                        <Select value={form.client_id || 'null'} onValueChange={val => setForm({...form, client_id: val === 'null' ? null : val})}>
                            <SelectTrigger className="h-9 font-bold text-xs"><SelectValue placeholder="Select Client" /></SelectTrigger>
                            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Billable Description</label>
                        <textarea className="w-full rounded-lg border border-slate-200 text-sm font-medium p-3 focus:outline-none focus:ring-1 focus:ring-blue-600 min-h-[80px]" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} placeholder="e.g. GST Audit for FY 2025-26" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Base Amount (₹)</label>
                        <Input type="number" required placeholder="0.00" className="h-9 font-bold" value={form.amount || ''} onChange={e => setForm({...form, amount: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tax / GST (₹)</label>
                        <Input type="number" placeholder="0.00" className="h-9 font-bold" value={form.tax_amount || '0'} onChange={e => setForm({...form, tax_amount: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Filing Status</label>
                        <Select value={form.status} onValueChange={val => setForm({...form, status: val})}>
                            <SelectTrigger className="h-9 font-bold text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUSES.map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Due Date</label>
                        <Input type="date" className="h-9 font-bold text-xs" value={form.due_date || ''} onChange={e => setForm({...form, due_date: e.target.value})} />
                    </div>
                    {form.amount && (
                       <div className="col-span-2 bg-[#0f172a] text-blue-400 p-3 rounded-lg flex items-center justify-between border border-blue-500/20">
                          <span className="text-[10px] font-black uppercase tracking-widest">Total Payable</span>
                          <span className="text-xl font-black tabular-nums">₹{(parseFloat(form.amount || '0') + parseFloat(form.tax_amount || '0')).toLocaleString('en-IN')}</span>
                       </div>
                    )}
                </div>
                <div className="bg-slate-50 p-4 px-6 border-t flex justify-end gap-2">
                    <Button variant="ghost" type="button" className="h-9 text-[11px] font-black uppercase" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button type="submit" className="h-9 px-6 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider">{editInvoice ? 'Update Records' : 'Post Invoice'}</Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
