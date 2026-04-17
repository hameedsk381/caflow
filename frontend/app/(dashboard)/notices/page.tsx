'use client'
import { useState, useEffect, useCallback } from 'react'
import { noticesApi, clientsApi } from '@/lib/api'
import { 
  Plus, Search, Pencil, Trash2, Bell, FileText, 
  AlertCircle, Scale, Building2, Calendar, 
  CheckCircle2, Clock, ShieldAlert, ArrowUpRight,
  MoreVertical, Edit3, Filter, Hash, Gavel
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format, isPast, differenceInDays } from 'date-fns'
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

const statusMap: Record<string, { label: string, color: string }> = {
  open: { label: 'Notice Served', color: 'bg-rose-100 text-rose-700' },
  in_progress: { label: 'Drafting Response', color: 'bg-blue-100 text-blue-700' },
  responded: { label: 'Response Filed', color: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'Case Closed', color: 'bg-slate-100 text-slate-500' }
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editNotice, setEditNotice] = useState<any | null>(null)
  const [form, setForm] = useState<any>({ status: 'open' })

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await noticesApi.list({ search: search || undefined })
      setNotices(res.data.items)
      setTotal(res.data.total)
    } catch {
      toast.error('Failed to load legal notices')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { 
    fetchNotices()
    clientsApi.list({ size: 100 }).then(res => setClients(res.data.items))
  }, [fetchNotices])

  const openCreate = () => { setEditNotice(null); setForm({ status: 'open' }); setShowModal(true) }
  const openEdit = (n: any) => { setEditNotice(n); setForm({ ...n }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!form.client_id) { toast.error('Assessee selection required'); return }
      
      if (editNotice) {
        await noticesApi.update(editNotice.id, form)
        toast.success('Notice registry updated!')
      } else {
        await noticesApi.create(form)
        toast.success('New notice served & indexed!')
      }
      setShowModal(false)
      fetchNotices()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error indexing notice')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Formally purge this legal notice from registry?')) return
    try {
      await noticesApi.delete(id)
      toast.success('Notice record purged')
      fetchNotices()
    } catch { toast.error('Failed to update legal registry') }
  }

  const filteredNotices = notices.filter(n => 
    (n.notice_type || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.reference_no || '').toLowerCase().includes(search.toLowerCase())
  )

  const overdueCount = notices.filter(n => n.status !== 'closed' && n.due_date && isPast(new Date(n.due_date))).length
  const criticalSoon = notices.filter(n => n.status !== 'closed' && n.due_date && !isPast(new Date(n.due_date)) && differenceInDays(new Date(n.due_date), new Date()) <= 5).length

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Precision Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Legal Response Center</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{total} Active Departmental Notices</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-none border-slate-200 shadow-none hover:bg-slate-50">Sync Portal Notices</Button>
          <Button onClick={openCreate} className="h-9 px-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Index Notice
          </Button>
        </div>
      </div>

      {/* Statutory Deadline Alerts */}
      {(overdueCount > 0 || criticalSoon > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {overdueCount > 0 && (
             <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-none text-rose-700 animate-pulse">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div className="text-[10px] font-black uppercase tracking-tight">
                   {overdueCount} Critical Overdue Response{overdueCount > 1 ? 's' : ''}. High Statutory Risk.
                </div>
             </div>
           )}
           {criticalSoon > 0 && (
             <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-none text-amber-700">
                <Clock className="h-5 w-5 shrink-0" />
                <div className="text-[10px] font-black uppercase tracking-tight">
                   {criticalSoon} Response Deadline{criticalSoon > 1 ? 's' : ''} within 5 days.
                </div>
             </div>
           )}
        </div>
      )}

      {/* Forensic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Responses Filed</p>
                    <p className="text-2xl font-black tracking-tighter text-emerald-600 tabular-nums">{notices.filter(n => n.status === 'responded').length}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-emerald-100" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Under Scrutiny</p>
                    <p className="text-2xl font-black tracking-tighter text-blue-600 tabular-nums">{notices.filter(n => n.status === 'in_progress' || n.status === 'open').length}</p>
                </div>
                <Gavel className="h-6 w-6 text-blue-100" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cases Closed</p>
                    <p className="text-2xl font-black tracking-tighter text-slate-400 tabular-nums">{notices.filter(n => n.status === 'closed').length}</p>
                </div>
                <div className="h-6 w-6 text-slate-100" />
          </CardContent>
        </Card>
        <Card className="border-[#1e293b] shadow-none rounded-none overflow-hidden bg-[#0f172a] text-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Legal Coverage</p>
                    <p className="text-2xl font-black tracking-tighter tabular-nums">{Array.from(new Set(notices.map(n => n.client_id))).length}</p>
                </div>
                <Scale className="h-6 w-6 text-blue-500/20" />
          </CardContent>
        </Card>
      </div>

      {/* Forensic Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Search Ref# or Type..." className="h-10 pl-8 w-[240px] text-[10px] font-bold border-slate-200 bg-white rounded-none shadow-none focus:ring-1 focus:ring-slate-900" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
             <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-none border-slate-200 bg-white shadow-none"><Filter className="h-3.5 w-3.5" /></Button>
          </div>
          <Button variant="outline" size="sm" className="h-10 text-[9px] font-black uppercase tracking-widest rounded-none border-slate-200 bg-white shadow-none">Export Case List</Button>
      </div>

      {/* High-Density Legal Notice Table */}
      <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow className="h-10 hover:bg-transparent border-none">
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Notice Type & Section</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Assessee / Client</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-center">Lifecycle Status</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Statutory Deadline</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Identification Ref.</TableHead>
                    <TableHead className="px-4 w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Synchronizing Legal Archives…</TableCell></TableRow>
              ) : filteredNotices.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-xs font-bold text-slate-400 italic">No legal notices identified in current scope.</TableCell></TableRow>
              ) : filteredNotices.map((n) => {
                const isLate = n.status !== 'closed' && n.due_date && isPast(new Date(n.due_date))
                return (
                  <TableRow key={n.id} className={`h-12 border-slate-50 border-b last:border-0 transition-colors ${isLate ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50/50'}`}>
                    <TableCell className="px-4 py-2">
                        <div className="flex flex-col">
                           <span className="font-black text-[13px] text-[#0f172a] tracking-tight leading-tight uppercase">{n.notice_type}</span>
                           <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter mt-0.5 flex items-center gap-1">
                               <ShieldAlert className="h-2.5 w-2.5" /> Dept. Notice
                           </span>
                        </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                       <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-600 uppercase">
                           <Building2 className="h-3 w-3 opacity-30 text-slate-900" />
                           {clients.find(c => c.id === n.client_id)?.name || 'Unknown Assessee'}
                       </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                        <Badge className={`rounded-none px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter border-none shadow-none ${statusMap[n.status]?.color}`}>
                            {statusMap[n.status]?.label}
                        </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                        <div className={`flex items-center gap-1.5 text-[11px] font-black tabular-nums ${isLate ? 'text-rose-600' : 'text-slate-600'}`}>
                           <Calendar className="h-3 w-3 opacity-30 text-slate-900" />
                           {n.due_date ? format(new Date(n.due_date), 'dd/MM/yyyy') : 'NO LIMIT'}
                        </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 font-mono tracking-tighter tabular-nums">
                            <Hash className="h-2.5 w-2.5 opacity-30" />
                            {n.reference_no || 'REF_PENDING'}
                        </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 p-0 rounded-none hover:bg-slate-900 hover:text-white transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-none border-slate-200 shadow-none">
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-none" onClick={() => openEdit(n)}><Edit3 className="mr-2 h-3.5 w-3.5 text-blue-600" /> Amend</DropdownMenuItem>
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-none"><FileText className="mr-2 h-3.5 w-3.5 text-slate-500" /> Response</DropdownMenuItem>
                                <div className="h-px bg-slate-100 my-1" />
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-none text-rose-600" onClick={() => handleDelete(n.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Purge</DropdownMenuItem>
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

      {/* Notice Modal - Brutalist Zero-Radius */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-none flex items-center justify-center p-4">
           <Card className="max-w-2xl w-full rounded-none border border-slate-300 shadow-none relative bg-white overflow-hidden">
             <CardHeader className="bg-[#0f172a] text-white border-b border-white/10 p-4 px-6">
                <CardTitle className="text-lg font-black tracking-tight flex items-center justify-between uppercase">
                    {editNotice ? 'Amend Legal Notice' : 'Index Departmental Notice'}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/10 rounded-none" onClick={() => setShowModal(false)}>✕</Button>
                </CardTitle>
             </CardHeader>
             <form onSubmit={handleSubmit}>
                <div className="p-8 grid grid-cols-2 gap-5">
                    <div className="col-span-2 space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assessee / Client</label>
                        <Select value={form.client_id || 'null'} onValueChange={val => setForm({...form, client_id: val === 'null' ? null : val})}>
                            <SelectTrigger className="h-10 font-black text-xs rounded-none border-slate-200 uppercase"><SelectValue placeholder="Identify Assessee" /></SelectTrigger>
                            <SelectContent className="rounded-none border-slate-200">{clients.map(c => <SelectItem key={c.id} value={c.id} className="rounded-none text-[10px] font-black uppercase">{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-2 space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Notice Type / Section Number</label>
                        <Input required placeholder="e.g. Scrutiny Notice u/s 143(3), Show Cause Notice" className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600 uppercase" value={form.notice_type || ''} onChange={e => setForm({...form, notice_type: e.target.value})} />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reference Number / DIN</label>
                        <Input placeholder="Ref #" className="h-10 font-bold text-sm uppercase font-mono tracking-widest rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={form.reference_no || ''} onChange={e => setForm({...form, reference_no: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lifecycle Status</label>
                        <Select value={form.status} onValueChange={val => setForm({...form, status: val})}>
                            <SelectTrigger className="h-10 font-black text-xs rounded-none border-slate-200 uppercase">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-none border-slate-200">
                                {Object.keys(statusMap).map(s => <SelectItem key={s} value={s} className="rounded-none text-[10px] font-black uppercase">{statusMap[s]?.label.toUpperCase()}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Issuance Date</label>
                        <Input type="date" className="h-10 font-bold text-xs rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={form.issue_date?.split('T')[0] || ''} onChange={e => setForm({ ...form, issue_date: e.target.value })} />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Response Deadline</label>
                        <Input type="date" className="h-10 font-bold text-xs rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={form.due_date?.split('T')[0] || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                    </div>
                </div>
                <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-2">
                    <Button variant="ghost" type="button" className="h-10 px-6 text-[10px] font-black uppercase tracking-widest rounded-none text-slate-500" onClick={() => setShowModal(false)}>Cancel Action</Button>
                    <Button type="submit" className="h-10 px-8 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none hover:bg-slate-800 transition-colors">{editNotice ? 'Update Registry' : 'Index Notice'}</Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
