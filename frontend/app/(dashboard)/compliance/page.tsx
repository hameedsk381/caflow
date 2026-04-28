'use client'
import { useState, useEffect, useCallback } from 'react'
import { complianceApi, clientsApi } from '@/lib/api'
import type { ComplianceRecord, Client } from '@/types'
import { 
  Plus, ShieldCheck, AlertTriangle, Search, Filter,
  MoreVertical, Edit3, Trash2, Calendar, Building2,
  CheckCircle2, Clock, FileWarning, ArrowUpRight,
  ExternalLink, Info, Bell, Hash, Upload
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format, isPast, isToday, differenceInDays } from 'date-fns'
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
import BulkUploadModal from '@/components/modals/BulkUploadModal'

const TYPES = ['GST', 'ITR', 'TDS', 'ROC', 'PT', 'OTHER']
const STATUS_OPTIONS = ['pending', 'in_progress', 'filed', 'overdue']

const statusMap: Record<string, { label: string, color: string }> = {
  filed: { label: 'Filed', color: 'bg-emerald-100 text-emerald-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-500' },
  overdue: { label: 'Overdue', color: 'bg-rose-100 text-rose-700' }
}

export default function CompliancePage() {
  const [records, setRecords] = useState<ComplianceRecord[]>([])
  const [total, setTotal] = useState(0)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [editRecord, setEditRecord] = useState<ComplianceRecord | null>(null)
  const [form, setForm] = useState<any>({})
  const [search, setSearch] = useState('')

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
        toast.success('Filing updated!')
      } else {
        await complianceApi.create(form)
        toast.success('New filing added!')
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
    if (!confirm('Are you sure you want to delete this record?')) return
    try {
      await complianceApi.delete(id)
      toast.success('Record deleted')
      fetchData()
    } catch { toast.error('Failed to delete record') }
  }

  const filteredRecords = records.filter(r => 
    (r.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.filing_reference || '').toLowerCase().includes(search.toLowerCase())
  )

  const overdueCount = records.filter(r => r.status === 'overdue' || (r.status !== 'filed' && isPast(new Date(r.due_date)))).length
  const criticalSoon = records.filter(r => r.status !== 'filed' && !isPast(new Date(r.due_date)) && differenceInDays(new Date(r.due_date), new Date()) <= 7).length

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Compliance Calendar</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{total} Active Filings</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 px-4 text-[10px] font-black uppercase tracking-tight rounded-none shadow-none border-slate-200" onClick={() => setShowBulkModal(true)}>
             <Upload className="h-3.5 w-3.5 mr-2" />
             Bulk Import
          </Button>
          <Button onClick={openCreate} className="h-9 px-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider rounded-none shadow-none">
            <Plus className="h-4 w-4 mr-2" />
            New Filing
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(overdueCount > 0 || criticalSoon > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {overdueCount > 0 && (
              <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-none text-rose-700 animate-pulse">
                 <FileWarning className="h-5 w-5 shrink-0" />
                 <div className="text-[10px] font-black uppercase tracking-tight">
                    {overdueCount} Overdue Filing{overdueCount > 1 ? 's' : ''} detected.
                 </div>
              </div>
           )}
           {criticalSoon > 0 && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-none text-amber-700">
                 <Bell className="h-5 w-5 shrink-0" />
                 <div className="text-[10px] font-black uppercase tracking-tight">
                    {criticalSoon} Filing{criticalSoon > 1 ? 's' : ''} due within 7 days.
                 </div>
              </div>
           )}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filed</p>
                    <p className="text-2xl font-black tracking-tighter text-emerald-600 tabular-nums">{records.filter(r => r.status === 'filed').length}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-emerald-100" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">In Progress</p>
                    <p className="text-2xl font-black tracking-tighter text-blue-600 tabular-nums">{records.filter(r => r.status === 'in_progress').length}</p>
                </div>
                <Clock className="h-6 w-6 text-blue-100" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                    <p className="text-2xl font-black tracking-tighter text-slate-400 tabular-nums">{records.filter(r => r.status === 'pending').length}</p>
                </div>
                <Info className="h-6 w-6 text-slate-100" />
          </CardContent>
        </Card>
        <Card className="border-[#1e293b] shadow-none rounded-none overflow-hidden bg-[#0f172a] text-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Clients</p>
                    <p className="text-2xl font-black tracking-tighter tabular-nums">{Array.from(new Set(records.map(r => r.client_id))).length}</p>
                </div>
                <Building2 className="h-6 w-6 text-blue-500/20" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Search client or ACK..." className="h-8 pl-8 w-[240px] text-[10px] font-bold border-slate-200 bg-white rounded-none shadow-none focus:ring-1 focus:ring-slate-900" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
             <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 w-[100px] text-[10px] font-black uppercase text-slate-600 border-slate-200 bg-white rounded-none shadow-none">
                    <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                    <SelectItem value="null" className="text-[10px] font-black uppercase rounded-none">All Types</SelectItem>
                    {TYPES.map(t => <SelectItem key={t} value={t} className="text-[10px] font-black uppercase rounded-none">{t}</SelectItem>)}
                </SelectContent>
             </Select>
             <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 w-[130px] text-[10px] font-black uppercase text-slate-600 border-slate-200 bg-white rounded-none shadow-none">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                    <SelectItem value="null" className="text-[10px] font-black uppercase rounded-none">All Status</SelectItem>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="text-[10px] font-black uppercase rounded-none">{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
             </Select>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest rounded-none border-slate-200 bg-white shadow-none">Export</Button>
          </div>
      </div>

      {/* Table */}
      <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow className="h-10 hover:bg-transparent border-none">
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Client</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Type</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Period</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Due Date</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-center">Status</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">ACK Number</TableHead>
                    <TableHead className="px-4 w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading...</TableCell></TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-xs font-bold text-slate-400 italic">No records found.</TableCell></TableRow>
              ) : filteredRecords.map((r) => {
                const isLate = r.status !== 'filed' && isPast(new Date(r.due_date))
                return (
                  <TableRow key={r.id} className={`h-12 border-slate-50 border-b last:border-0 transition-colors ${isLate ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50/50'}`}>
                    <TableCell className="px-4 py-2 font-black text-[13px] text-[#0f172a] tracking-tight uppercase">{r.client_name || '—'}</TableCell>
                    <TableCell className="px-4 py-2">
                        <Badge variant="outline" className="rounded-none bg-blue-50/50 text-blue-700 border-blue-100 text-[9px] font-black uppercase tracking-tighter">
                            {r.type}
                        </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-tight">{r.period || '—'}</TableCell>
                    <TableCell className="px-4 py-2">
                        <div className={`flex items-center gap-1.5 text-[11px] font-black tabular-nums ${isLate ? 'text-rose-600' : 'text-slate-600'}`}>
                           <Calendar className="h-3 w-3 opacity-30" />
                           {format(new Date(r.due_date), 'dd/MM/yyyy')}
                        </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                        <Badge className={`rounded-none px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter shadow-none border-none ${statusMap[r.status]?.color}`}>
                            {statusMap[r.status]?.label}
                        </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 font-mono tracking-tighter tabular-nums">
                            <Hash className="h-2.5 w-2.5 opacity-30" />
                            {r.filing_reference || 'PENDING'}
                        </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 p-0 rounded-none hover:bg-slate-900 hover:text-white transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-none border-slate-200 shadow-none">
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-none" onClick={() => openEdit(r)}><Edit3 className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-none" onClick={() => handleQuickStatus(r.id, 'filed')}><CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Mark Filed</DropdownMenuItem>
                                <div className="h-px bg-slate-100 my-1" />
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-none text-rose-600" onClick={() => handleDelete(r.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-none flex items-center justify-center p-4">
           <Card className="max-w-xl w-full rounded-none border border-slate-300 shadow-none relative bg-white overflow-hidden">
             <CardHeader className="bg-[#0f172a] text-white border-b border-white/10 p-4 px-6">
                <CardTitle className="text-lg font-black tracking-tight flex items-center justify-between uppercase">
                    {editRecord ? 'Edit Filing' : 'New Filing'}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/10 rounded-none" onClick={() => setShowModal(false)}>✕</Button>
                </CardTitle>
             </CardHeader>
             <form onSubmit={handleSubmit}>
                <div className="p-8 grid grid-cols-2 gap-5">
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Client</label>
                        <Select value={form.client_id || 'null'} onValueChange={val => setForm({...form, client_id: val === 'null' ? null : val})}>
                            <SelectTrigger className="h-10 font-bold text-xs rounded-none border-slate-200 uppercase"><SelectValue placeholder="Select Client" /></SelectTrigger>
                            <SelectContent className="rounded-none">{clients.map(c => <SelectItem key={c.id} value={c.id} className="rounded-none uppercase">{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Type</label>
                        <Select value={form.type || 'null'} onValueChange={val => setForm({...form, type: val === 'null' ? null : val})}>
                           <SelectTrigger className="h-10 font-black text-xs rounded-none border-slate-200 uppercase"><SelectValue /></SelectTrigger>
                           <SelectContent className="rounded-none">{TYPES.map(t => <SelectItem key={t} value={t} className="rounded-none uppercase">{t}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Period</label>
                        <Input placeholder="e.g. Q1 FY 2025-26" className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={form.period || ''} onChange={e => setForm({...form, period: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Due Date</label>
                        <Input type="date" className="h-10 font-bold text-xs rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={form.due_date || ''} onChange={e => setForm({...form, due_date: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
                        <Select value={form.status} onValueChange={val => setForm({...form, status: val})}>
                            <SelectTrigger className="h-10 font-black text-xs rounded-none border-slate-200 uppercase">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="rounded-none uppercase">{statusMap[s]?.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ACK Number</label>
                        <Input placeholder="Enter acknowledgement number" className="h-10 font-black text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={form.filing_reference || ''} onChange={e => setForm({...form, filing_reference: e.target.value})} />
                    </div>
                </div>
                <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-2">
                    <Button variant="ghost" type="button" className="h-10 px-6 text-[10px] font-black uppercase rounded-none" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button type="submit" className="h-10 px-8 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none hover:bg-slate-800 transition-colors">{editRecord ? 'Update' : 'Save'}</Button>
                </div>
             </form>
           </Card>
        </div>
      )}

      <BulkUploadModal 
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={fetchData}
        type="compliance"
        onUpload={(data) => complianceApi.bulkCreate(data)}
      />
    </div>
  )
}
