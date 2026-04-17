'use client'
import { useState, useEffect, useCallback } from 'react'
import { leadsApi } from '@/lib/api'
import { 
  Plus, Search, Pencil, Trash2, Users, 
  Target, Rocket, TrendingUp, Handshake, 
  Mail, Phone, Building2, Calendar, 
  MoreVertical, Edit3, Filter, Hash,
  AlertTriangle, CheckSquare, Zap,
  BarChart3, UserCheck, Flame
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

const statusMap: Record<string, { label: string, color: string }> = {
  new: { label: 'Initial Enquiry', color: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'Discovery Phase', color: 'bg-sky-100 text-sky-700' },
  qualified: { label: 'Qualified Prospect', color: 'bg-indigo-100 text-indigo-700' },
  proposal_sent: { label: 'Proposal Drafted', color: 'bg-amber-100 text-amber-700' },
  won: { label: 'Mandate Secured', color: 'bg-emerald-100 text-emerald-700' },
  lost: { label: 'Case Closed', color: 'bg-slate-100 text-slate-500' }
}

const priorityMap: Record<string, { label: string, color: string, icon: any }> = {
  high: { label: 'CRITICAL', color: 'text-rose-600', icon: Flame },
  medium: { label: 'MODERATE', color: 'text-amber-600', icon: TrendingUp },
  low: { label: 'STANDARD', color: 'text-slate-400', icon: Target }
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editLead, setEditLead] = useState<any | null>(null)
  const [form, setForm] = useState<any>({ status: 'new', priority: 'medium' })

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await leadsApi.list({ search: search || undefined, status: status || undefined })
      setLeads(res.data.items)
      setTotal(res.data.total)
    } catch {
      toast.error('Failed to load growth pipeline')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const openCreate = () => { setEditLead(null); setForm({ status: 'new', priority: 'medium' }); setShowModal(true) }
  const openEdit = (l: any) => { setEditLead(l); setForm({ ...l }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editLead) {
        await leadsApi.update(editLead.id, form)
        toast.success('Prospect profile updated!')
      } else {
        await leadsApi.create(form)
        toast.success('New professional enquiry indexed!')
      }
      setShowModal(false)
      fetchLeads()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error indexing enquiry')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Formally archive this professional enquiry?')) return
    try {
      await leadsApi.delete(id)
      toast.success('Enquiry records archived')
      fetchLeads()
    } catch { toast.error('Failed to update pipeline') }
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Precision Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Strategic Growth Pipeline</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{total} Prospective Engagements in Progress</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={openCreate} className="h-9 px-4 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider rounded-none shadow-none hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Index Enquiry
          </Button>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qualified Prospects</p>
                    <p className="text-2xl font-black tracking-tighter text-blue-600 tabular-nums">{leads.filter(l => l.status === 'qualified').length}</p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-100" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mandates Secured</p>
                    <p className="text-2xl font-black tracking-tighter text-emerald-600 tabular-nums">{leads.filter(l => l.status === 'won').length}</p>
                </div>
                <Handshake className="h-8 w-8 text-emerald-100" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Quotations</p>
                    <p className="text-2xl font-black tracking-tighter text-amber-600 tabular-nums">{leads.filter(l => l.status === 'proposal_sent').length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-amber-100" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-[#0f172a] text-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Conversion Catalyst</p>
                    <p className="text-2xl font-black tracking-tighter tabular-nums">
                      {Math.round((leads.filter(l => l.status === 'won').length / (leads.length || 1)) * 100)}%
                    </p>
                </div>
                <Zap className="h-8 w-8 text-blue-500/20" />
          </CardContent>
        </Card>
      </div>

      {/* Forensic Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Search Prospect Name or Entity..." className="h-8 pl-8 w-[280px] text-xs font-bold border-slate-200 bg-white rounded-none" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
             <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 w-[140px] text-xs font-bold border-slate-200 bg-white rounded-none">
                    <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                    <SelectItem value="null">ALL STAGES</SelectItem>
                    {Object.keys(statusMap).map(s => <SelectItem key={s} value={s}>{statusMap[s]?.label.toUpperCase()}</SelectItem>)}
                </SelectContent>
             </Select>
             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none"><Filter className="h-3.5 w-3.5" /></Button>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-tight rounded-none border-slate-200 shadow-none">Export Growth Report</Button>
      </div>

      {/* High-Density Growth Table */}
      <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow className="h-10 hover:bg-transparent border-none">
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Prospect & Entity</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-center">Pipeline Stage</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Contact Points</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-center">Engagement Urgency</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Integration Date</TableHead>
                    <TableHead className="px-4 w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Syncing Growth Data…</TableCell></TableRow>
              ) : leads.length === 0 ? (
                <TableRow border-none><TableCell colSpan={6} className="h-24 text-center text-xs font-bold text-slate-400 italic">No professional enquiries detected in current pipeline.</TableCell></TableRow>
              ) : leads.map((l) => {
                const Prio = priorityMap[l.priority] || priorityMap.medium
                const Status = statusMap[l.status] || statusMap.new
                return (
                  <TableRow key={l.id} className="h-12 border-slate-50 hover:bg-slate-50/80 transition-colors border-b last:border-0">
                    <TableCell className="px-4 py-2">
                        <div className="flex flex-col">
                           <span className="font-black text-[13px] text-slate-900 tracking-tight leading-tight">{l.name.toUpperCase()}</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 flex items-center gap-1">
                                <div className="h-1.5 w-1.5 rounded-none bg-slate-200" /> {l.company_name || 'Individual Assessee'}
                           </span>
                        </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                        <Badge className={`rounded-none px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter shadow-none border-none ${Status.color}`}>
                            {Status.label}
                        </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                       <div className="flex flex-col gap-0.5 text-[10px] font-bold text-slate-500">
                          <div className="flex items-center gap-1.5">
                             <Mail className="h-2.5 w-2.5 opacity-30" />
                             {l.email || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1.5">
                             <Phone className="h-2.5 w-2.5 opacity-30" />
                             {l.phone || 'N/A'}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                        <div className={`flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest ${Prio.color}`}>
                           <Prio.icon className="h-3 w-3" />
                           {Prio.label}
                        </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 tabular-nums">
                           {format(new Date(l.created_at), 'dd/MM/yyyy')}
                        </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 p-0 rounded-none hover:bg-slate-100"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-none border-slate-200 shadow-none">
                                <DropdownMenuItem className="text-xs font-bold rounded-none" onClick={() => openEdit(l)}><Pencil className="mr-2 h-3.5 w-3.5" /> Amend Prospect</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold rounded-none"><Handshake className="mr-2 h-3.5 w-3.5" /> Convert to Client</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold text-rose-600 rounded-none" onClick={() => handleDelete(l.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Archive Enquiry</DropdownMenuItem>
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

      {/* Prospect Modal - Brutalist Condensed */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-none flex items-center justify-center p-4 animate-in fade-in duration-200">
           <Card className="max-w-xl w-full rounded-none border border-slate-300 shadow-none relative animate-in zoom-in-100 duration-150 overflow-hidden bg-white">
             <CardHeader className="bg-slate-50 border-b p-4 px-6 rounded-none">
                <CardTitle className="text-sm font-black tracking-widest uppercase flex items-center justify-between text-[#0f172a]">
                    {editLead ? 'Amend Prospect / entity' : 'Index Growth Enquiry'}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-200 rounded-none" onClick={() => setShowModal(false)}>✕</Button>
                </CardTitle>
             </CardHeader>
             <form onSubmit={handleSubmit}>
                <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Prospect / Contact Name</label>
                        <Input required placeholder="Authorized Signatory Name" className="h-9 font-bold text-sm rounded-none border-slate-200" value={form.name || ''} onChange={(e) => setForm({...form, name: e.target.value})} />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Engaging Entity / Company Name</label>
                        <Input placeholder="Legal name of business" className="h-9 font-bold text-sm rounded-none border-slate-200" value={form.company_name || ''} onChange={(e) => setForm({...form, company_name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Correspondence Email</label>
                        <Input type="email" placeholder="prospect@business.com" className="h-9 font-bold text-sm rounded-none border-slate-200" value={form.email || ''} onChange={(e) => setForm({...form, email: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Liaison Phone</label>
                        <Input placeholder="+91 XXXX" className="h-9 font-bold text-sm rounded-none border-slate-200" value={form.phone || ''} onChange={(e) => setForm({...form, phone: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pipeline Stage</label>
                        <Select value={form.status} onValueChange={(val) => setForm({...form, status: val})}>
                            <SelectTrigger className="h-9 font-bold text-xs rounded-none border-slate-200"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-none">
                                {Object.keys(statusMap).map(s => <SelectItem key={s} value={s} className="rounded-none">{statusMap[s]?.label.toUpperCase()}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Engagement Urgency</label>
                        <Select value={form.priority} onValueChange={(val) => setForm({...form, priority: val})}>
                            <SelectTrigger className="h-9 font-bold text-xs rounded-none border-slate-200"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-none">
                                <SelectItem value="high" className="rounded-none">HIGH (URGENT)</SelectItem>
                                <SelectItem value="medium" className="rounded-none">MODERATE</SelectItem>
                                <SelectItem value="low" className="rounded-none">STANDARD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex justify-end gap-2">
                   <Button variant="ghost" type="button" className="h-9 text-[11px] font-black uppercase rounded-none" onClick={() => setShowModal(false)}>Cancel</Button>
                   <Button type="submit" className="h-9 px-6 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider rounded-none shadow-none hover:bg-blue-700">
                      {editLead ? 'Update Profile' : 'Index Enquiry'}
                   </Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
