'use client'
import { useState, useEffect, useCallback } from 'react'
import { tasksApi, clientsApi } from '@/lib/api'
import type { Task, Client } from '@/types'
import { 
  Plus, CheckSquare, Search, Filter, MoreHorizontal, 
  Calendar, User, MoreVertical, Trash2, Edit3,
  Briefcase, ClipboardCheck, Clock, AlertCircle,
  FileText, ShieldCheck, ArrowRight, LayoutGrid,
  List as ListIcon, UserPlus, HardDrive, Zap,
  Timer, ChevronRight, Bookmark
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format, isPast, isToday } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled']

const statusMap: Record<string, { label: string, color: string, icon: any }> = {
  pending: { label: 'PLANNED', color: 'bg-slate-100 text-slate-600', icon: Calendar },
  in_progress: { label: 'DRAFTING', color: 'bg-blue-100 text-blue-700', icon: Edit3 },
  completed: { label: 'CERTIFIED', color: 'bg-emerald-100 text-emerald-700', icon: ShieldCheck },
  review: { label: 'REVIEW', color: 'bg-indigo-100 text-indigo-700', icon: ClipboardCheck }, // Custom virtual status
  cancelled: { label: 'ABANDONED', color: 'bg-rose-100 text-rose-600', icon: Trash2 }
}

const priorityMap: Record<string, { label: string, color: string, pulse: boolean }> = {
  urgent: { label: 'CRITICAL', color: 'bg-rose-600 text-white', pulse: true },
  high: { label: 'HIGH', color: 'bg-amber-500 text-white', pulse: false },
  medium: { label: 'STANDARD', color: 'bg-indigo-500 text-white', pulse: false },
  low: { label: 'DORMANT', color: 'bg-slate-400 text-white', pulse: false }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [form, setForm] = useState<any>({ priority: 'medium', status: 'pending' })
  const [view, setView] = useState<'list' | 'lifecycle'>('list')
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, cRes] = await Promise.all([
        tasksApi.list({ status: filterStatus || undefined, priority: filterPriority || undefined }),
        clientsApi.list({ size: 100 }),
      ])
      setTasks(tRes.data.items)
      setTotal(tRes.data.total)
      setClients(cRes.data.items)
    } catch { toast.error('Failed to load professional queue') }
    finally { setLoading(false) }
  }, [filterStatus, filterPriority])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => { setEditTask(null); setForm({ priority: 'medium', status: 'pending' }); setShowModal(true) }
  const openEdit = (t: Task) => { setEditTask(t); setForm({ ...t }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editTask) {
        await tasksApi.update(editTask.id, form)
        toast.success('Engagement parameters updated!')
      } else {
        await tasksApi.create(form)
        toast.success('New professional mandate initialized!')
      }
      setShowModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error finalizing mandate')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await tasksApi.update(id, { status })
      toast.success(`Pipeline advanced to ${status.replace('_', ' ').toUpperCase()}`)
      fetchData()
    } catch { toast.error('Failed to update engagement stage') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Formally archive this professional engagement?')) return
    try { await tasksApi.delete(id); toast.success('Mandate records archived'); fetchData() }
    catch { toast.error('Failed to archive record') }
  }

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.client_name?.toLowerCase().includes(search.toLowerCase())
  )

  const lifecycleCols = ['pending', 'in_progress', 'review', 'completed']

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Precision Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Professional Engagement Console</h1>
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-200 text-slate-500">{total} Active Mandates</Badge>
             <div className="h-1 w-1 rounded-full bg-slate-300" />
             <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">{tasks.filter(t => t.priority === 'urgent').length} Critical Deadlines</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={(v: any) => setView(v)} className="w-[180px]">
             <TabsList className="h-9 grid grid-cols-2 bg-slate-100/80 border border-slate-200 p-1">
                <TabsTrigger value="list" className="text-[9px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                   <ListIcon className="h-3 w-3 mr-1.5" /> List
                </TabsTrigger>
                <TabsTrigger value="lifecycle" className="text-[9px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                   <LayoutGrid className="h-3 w-3 mr-1.5" /> Lifecycle
                </TabsTrigger>
             </TabsList>
          </Tabs>

          <Button onClick={openCreate} className="h-9 px-4 bg-[#0f172a] text-white font-black text-[11px] uppercase tracking-wider shadow-lg shadow-slate-900/20">
            <Plus className="h-4 w-4 mr-2" />
            Initialize Mandate
          </Button>
        </div>
      </div>

      {/* Forensic Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
           <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                 <Timer className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WIP Cycle Time</p>
                 <p className="text-xl font-black tracking-tighter text-slate-900">4.2 Days</p>
              </div>
           </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
           <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                 <Zap className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Utilization Rate</p>
                 <p className="text-xl font-black tracking-tighter text-slate-900">88%</p>
              </div>
           </CardContent>
        </Card>
        <Card className="border-[#0f172a] bg-[#0f172a] shadow-sm overflow-hidden">
           <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                 <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                 <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest">Certified Assets</p>
                 <p className="text-xl font-black tracking-tighter text-white">{tasks.filter(t => t.status === 'completed').length}</p>
              </div>
           </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm overflow-hidden">
           <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center pulse">
                 <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                 <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">Quality Assurance</p>
                 <p className="text-xl font-black tracking-tighter text-emerald-700">ISO 9001</p>
              </div>
           </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Filter by Client or Mandate Title..." className="h-8 pl-8 w-[280px] text-xs font-bold border-slate-200 bg-white shadow-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
             <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 w-[140px] text-xs font-bold border-slate-200 bg-white shadow-sm">
                    <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="null">ALL STAGES</SelectItem>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</SelectItem>)}
                </SelectContent>
             </Select>
             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-slate-200 bg-white"><Filter className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" className="h-8 px-3 text-[10px] font-black uppercase tracking-tight border-slate-200"><HardDrive className="h-3 w-3 mr-1.5" /> Working Papers</Button>
             <Button variant="outline" size="sm" className="h-8 px-3 text-[10px] font-black uppercase tracking-tight border-slate-200">Export Manifest</Button>
          </div>
      </div>

      {view === 'list' ? (
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-0">
             <Table>
                <TableHeader className="bg-slate-50">
                   <TableRow className="h-10 hover:bg-transparent border-b border-slate-100">
                      <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 w-[35%]">Engagement Title & scope</TableHead>
                      <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Associated Client</TableHead>
                      <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-center">Criticality</TableHead>
                      <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Lifecycle Stage</TableHead>
                      <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Statutory Deadline</TableHead>
                      <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Allocated Lead</TableHead>
                      <TableHead className="px-4 w-10"></TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {loading ? (
                      <TableRow><TableCell colSpan={7} className="h-32 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Syncing Engagement Manifest…</TableCell></TableRow>
                   ) : filteredTasks.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="h-32 text-center text-xs font-bold text-slate-400 italic">No mandates identified for this scope.</TableCell></TableRow>
                   ) : filteredTasks.map(t => {
                      const Prio = priorityMap[t.priority] || priorityMap.medium
                      const Status = statusMap[t.status] || statusMap.pending
                      const isOverdue = t.due_date && isPast(new Date(t.due_date)) && !['completed', 'cancelled'].includes(t.status)
                      
                      return (
                      <TableRow key={t.id} className="h-12 border-slate-50 hover:bg-slate-50/50 transition-colors group">
                         <TableCell className="px-4 py-2">
                             <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                   <span className="font-black text-[13px] text-slate-900 tracking-tight leading-tight">{t.title}</span>
                                   {isOverdue && <Badge className="bg-rose-500 text-[8px] h-4 font-black px-1 animate-pulse">OVERDUE</Badge>}
                                </div>
                                {t.description && <span className="text-[10px] font-medium text-slate-400 truncate max-w-[320px] mt-0.5 uppercase tracking-tighter">{t.description}</span>}
                             </div>
                         </TableCell>
                         <TableCell className="px-4 py-2">
                             <div className="flex items-center gap-2 text-[11px] font-black text-slate-600 uppercase tracking-tighter">
                                <div className="h-5 w-5 rounded bg-slate-100 flex items-center justify-center"><Briefcase className="h-3 w-3 text-slate-400" /></div>
                                <span className="truncate max-w-[140px]">{t.client_name || 'INTERNAL OPERATIONS'}</span>
                             </div>
                         </TableCell>
                         <TableCell className="px-4 py-2 text-center">
                             <Badge className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter ${Prio.color} ${Prio.pulse ? 'animate-pulse' : ''}`}>
                                {Prio.label}
                             </Badge>
                         </TableCell>
                         <TableCell className="px-4 py-2">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                   <button className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase tracking-tight transition-all hover:ring-1 hover:ring-slate-300 ${Status.color}`}>
                                      <Status.icon className="h-3 w-3" />
                                      {Status.label}
                                      <ChevronRight className="h-2.5 w-2.5 opacity-50" />
                                   </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-40 rounded-xl">
                                   {STATUSES.map(s => (
                                      <DropdownMenuItem key={s} className="text-[10px] font-black uppercase tracking-tight" onClick={() => handleStatusChange(t.id, s)}>
                                         {s.replace('_', ' ')}
                                      </DropdownMenuItem>
                                   ))}
                                </DropdownMenuContent>
                             </DropdownMenu>
                         </TableCell>
                         <TableCell className="px-4 py-2">
                             <div className={`flex items-center gap-1.5 text-[11px] font-black tabular-nums transition-colors ${isOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
                                <Clock className={`h-3 w-3 ${isOverdue ? 'opacity-100' : 'opacity-40'}`} />
                                {t.due_date ? format(new Date(t.due_date), 'dd/MM/yyyy') : 'UNSET'}
                             </div>
                         </TableCell>
                         <TableCell className="px-4 py-2">
                             <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-black text-white shrink-0 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                   {t.assignee_name?.charAt(0) || '?'}
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[11px] font-black text-slate-700 leading-none">{t.assignee_name?.split(' ')[0] || 'Unassigned'}</span>
                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Practitioner</span>
                                </div>
                             </div>
                         </TableCell>
                         <TableCell className="px-4 py-2 text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                    <DropdownMenuItem className="text-xs font-bold" onClick={() => openEdit(t)}><Edit3 className="mr-2 h-3.5 w-3.5" /> Amend Mandate</DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs font-bold"><Bookmark className="mr-2 h-3.5 w-3.5" /> Attach Papers</DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs font-bold text-rose-600" onClick={() => handleDelete(t.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Archive Records</DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                         </TableCell>
                      </TableRow>
                    )})}
                </TableBody>
             </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {lifecycleCols.map(col => {
          const colTasks = tasks.filter(t => t.status === col || (col === 'review' && t.status === 'in_progress' && t.priority === 'high')) // Mocking review stage
          const Status = statusMap[col] || statusMap.pending
          return (
            <div key={col} className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-3 h-8 bg-slate-100 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                   <Status.icon className="h-3 w-3 text-slate-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{Status.label}</span>
                </div>
                <span className="text-[10px] font-black text-slate-400">{colTasks.length}</span>
              </div>
              <div className="flex flex-col gap-3 min-h-[500px] rounded-2xl bg-slate-50/50 p-2 border border-dashed border-slate-200">
                {colTasks.length === 0 && (
                   <div className="h-32 flex flex-col items-center justify-center text-slate-300 gap-2">
                      <HardDrive className="h-8 w-8 opacity-20" />
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-40 italic">Queue Clear</span>
                   </div>
                )}
                {colTasks.map(t => {
                   const Prio = priorityMap[t.priority] || priorityMap.medium
                   const isOverdue = t.due_date && isPast(new Date(t.due_date)) && !['completed', 'cancelled'].includes(t.status)
                   return (
                  <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-blue-500 group relative overflow-hidden" onClick={() => openEdit(t)}>
                    {isOverdue && <div className="absolute top-0 right-0 h-10 w-10 bg-rose-500/10 rounded-bl-full flex items-start justify-end p-1.5"><AlertCircle className="h-3 w-3 text-rose-500 animate-pulse" /></div>}
                    <div className="flex items-center gap-2 mb-2">
                       <Badge className={`rounded px-1 py-0 text-[7px] font-black tracking-tighter ${Prio.color}`}>
                          {Prio.label}
                       </Badge>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate">{t.client_name || 'INTERNAL'}</span>
                    </div>
                    <div className="text-[13px] font-black text-slate-900 leading-tight mb-3 group-hover:text-blue-700 transition-colors uppercase tracking-tight">{t.title}</div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div className="flex -space-x-2">
                           <div className="h-6 w-6 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-[8px] font-black text-white">
                              {t.assignee_name?.charAt(0) || 'U'}
                           </div>
                           {t.priority === 'urgent' && (
                              <div className="h-6 w-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center">
                                 <Zap className="h-3 w-3 text-white" />
                              </div>
                           )}
                        </div>
                        {t.due_date && (
                           <div className={`flex items-center gap-1 text-[10px] font-black tabular-nums ${isOverdue ? 'text-rose-600' : 'text-slate-400'}`}>
                              <Timer className="h-3 w-3" />
                              {format(new Date(t.due_date), 'dd MMM')}
                           </div>
                        )}
                    </div>
                  </div>
                )})}
                <Button variant="ghost" className="w-full h-10 border border-dashed border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-white hover:text-blue-600">
                   <Plus className="h-3 w-3 mr-2" /> Quick Initialize
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {/* Professional Mandate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <Card className="max-w-xl w-full rounded-3xl border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative animate-in zoom-in-95 duration-200 overflow-hidden">
             <CardHeader className="bg-[#0f172a] text-white p-6 pb-12">
                <div className="flex items-center justify-between mb-2">
                   <Badge className="bg-blue-500/20 text-blue-400 border-none text-[8px] font-black uppercase tracking-[0.2em]">{editTask ? 'AMEND MANDATE' : 'INITIALIZE ENGAGEMENT'}</Badge>
                   <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10" onClick={() => setShowModal(false)}>✕</Button>
                </div>
                <CardTitle className="text-2xl font-black tracking-tight leading-none">
                    {editTask ? 'Update Engagement Scope' : 'Professional Service Mandate'}
                </CardTitle>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-2">Firm Governance & Staff Allocation Console</p>
             </CardHeader>
             <form onSubmit={handleSubmit} className="-mt-8">
                <div className="p-8 pt-0 space-y-4">
                   <Card className="border-slate-200 shadow-xl overflow-hidden rounded-2xl">
                    <div className="p-6 grid grid-cols-2 gap-5 bg-white">
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                               <ArrowRight className="h-2.5 w-2.5 text-blue-500" /> Mandate Objective / Title
                            </label>
                            <Input required placeholder="e.g. Statutory Audit FY 2024-25" className="h-11 font-black text-sm border-slate-200 focus:ring-2 focus:ring-blue-600" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                               <FileText className="h-2.5 w-2.5 text-blue-500" /> Engagement Scope Description
                            </label>
                            <textarea className="w-full rounded-xl border border-slate-200 text-sm font-bold p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[100px] bg-slate-50/50" placeholder="Detail the professional scope, regulatory sections, and specific deliverables..." value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                               <Briefcase className="h-2.5 w-2.5 text-blue-500" /> Associated Assessee
                            </label>
                            <Select value={form.client_id || 'null'} onValueChange={val => setForm({...form, client_id: val === 'null' ? null : val})}>
                                <SelectTrigger className="h-10 font-black text-xs border-slate-200"><SelectValue placeholder="Internal Firm Ops" /></SelectTrigger>
                                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id} className="text-[11px] font-bold uppercase">{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                               <UserPlus className="h-2.5 w-2.5 text-blue-500" /> Allocated Practitioner
                            </label>
                            <Select value={form.assigned_to || 'null'} onValueChange={val => setForm({...form, assigned_to: val === 'null' ? null : val})}>
                                <SelectTrigger className="h-10 font-black text-xs border-slate-200"><SelectValue placeholder="Assign Staff" /></SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="null">UNASSIGNED</SelectItem>
                                   {/* Staff list would go here from engagement data */}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                               <AlertCircle className="h-2.5 w-2.5 text-blue-500" /> Professional Criticality
                            </label>
                            <Select value={form.priority} onValueChange={val => setForm({...form, priority: val})}>
                                <SelectTrigger className="h-10 font-black text-xs border-slate-200"><SelectValue /></SelectTrigger>
                                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p} className="text-[11px] font-bold">{p.toUpperCase()}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                               <Timer className="h-2.5 w-2.5 text-blue-500" /> Statutory Deadline
                            </label>
                            <Input type="date" className="h-10 font-black text-xs border-slate-200" value={form.due_date || ''} onChange={e => setForm({...form, due_date: e.target.value})} />
                        </div>
                    </div>
                   </Card>
                </div>
                <div className="bg-slate-50 p-6 px-8 border-t flex justify-end gap-3 mt-4">
                    <Button variant="ghost" type="button" className="h-11 px-6 text-[11px] font-black uppercase tracking-widest text-slate-500" onClick={() => setShowModal(false)}>Cancel Mandate</Button>
                    <Button type="submit" className="h-11 px-8 bg-[#0f172a] text-white font-black text-[12px] uppercase tracking-[0.1em] rounded-xl shadow-2xl hover:scale-105 transition-transform active:scale-95">
                       {editTask ? 'Finalize Changes' : 'Execute Mandate'}
                    </Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
