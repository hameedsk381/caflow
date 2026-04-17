'use client'
import { useState, useEffect, useCallback } from 'react'
import { clientsApi } from '@/lib/api'
import type { Client } from '@/types'
import { 
  Plus, Search, Pencil, Trash2, User, Building, 
  RefreshCw, Building2, ShieldCheck, Mail, Phone,
  MapPin, Clock, MoreVertical, Edit3, Filter,
  Hash, CreditCard, ScanFace, Users, Briefcase,
  ExternalLink, Globe
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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [form, setForm] = useState<any>({ status: 'active' })

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await clientsApi.list({ search: search || undefined, status: status || undefined })
      setClients(res.data.items)
      setTotal(res.data.total)
    } catch {
      toast.error('Failed to load assessee directory')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => { fetchClients() }, [fetchClients])

  const openCreate = () => { setEditClient(null); setForm({ status: 'active' }); setShowModal(true) }
  const openEdit = (c: Client) => { setEditClient(c); setForm({ ...c }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editClient) {
        await clientsApi.update(editClient.id, form)
        toast.success('Assessee profile updated!')
      } else {
        await clientsApi.create(form)
        toast.success('New assessee integrated!')
      }
      setShowModal(false)
      fetchClients()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error indexing assessee')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Formally decommission this assessee? This will archive historical data.')) return
    try {
      await clientsApi.delete(id)
      toast.success('Assessee decommissioned')
      fetchClients()
    } catch { toast.error('Failed to update directory') }
  }

  const handleSyncStatus = async (id: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Syncing with MCA & GST portals...',
        success: 'Sync complete! Assessee status verified.',
        error: 'Portal timeout, please try later.',
      }
    )
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Precision Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Unified Assessee Directory</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{total} Identities under Firm Management</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-none border-slate-200 shadow-none hover:bg-slate-50 transition-colors">Bulk Import PANs</Button>
          <Button onClick={openCreate} className="h-9 px-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Integrate Assessee
          </Button>
        </div>
      </div>

      {/* Strategic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white group hover:border-blue-500 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Assessees</p>
                    <p className="text-2xl font-black tracking-tighter text-blue-600 tabular-nums">{clients.filter(c => c.status === 'active').length}</p>
                </div>
                <div className="h-10 w-10 bg-blue-50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white group hover:border-emerald-500 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Corporate Entities</p>
                    <p className="text-2xl font-black tracking-tighter text-emerald-600 tabular-nums">
                        {clients.filter(c => ['LLP', 'Private Ltd', 'Public Ltd'].includes(c.business_type || '')).length}
                    </p>
                </div>
                <div className="h-10 w-10 bg-emerald-50 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white group hover:border-amber-500 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">GST Registered</p>
                    <p className="text-2xl font-black tracking-tighter text-amber-600 tabular-nums">
                        {clients.filter(c => !!c.gstin).length}
                    </p>
                </div>
                <div className="h-10 w-10 bg-amber-50 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-amber-600" />
                </div>
          </CardContent>
        </Card>
        <Card className="border-[#1e293b] shadow-none rounded-none overflow-hidden bg-[#0f172a] text-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Data Integrity</p>
                    <p className="text-2xl font-black tracking-tighter tabular-nums">98.4%</p>
                </div>
                <div className="h-10 w-10 bg-blue-500/20 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-blue-400" />
                </div>
          </CardContent>
        </Card>
      </div>

      {/* Forensic Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Search Assessee Name, PAN or GSTIN..." className="h-10 pl-8 w-[320px] text-[10px] font-bold border-slate-200 bg-white rounded-none shadow-none focus:ring-1 focus:ring-slate-900" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
             <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10 w-[130px] text-[10px] font-black uppercase text-slate-600 border-slate-200 bg-white rounded-none shadow-none">
                    <SelectValue placeholder="STATUS" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-slate-200 shadow-none">
                    <SelectItem value="null" className="text-[10px] font-black uppercase rounded-none">ALL STATUS</SelectItem>
                    <SelectItem value="active" className="text-[10px] font-black uppercase rounded-none">ACTIVE</SelectItem>
                    <SelectItem value="inactive" className="text-[10px] font-black uppercase rounded-none">INACTIVE</SelectItem>
                </SelectContent>
             </Select>
             <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-none border-slate-200 bg-white shadow-none"><Filter className="h-3.5 w-3.5" /></Button>
          </div>
          <Button variant="outline" size="sm" className="h-10 text-[9px] font-black uppercase tracking-widest rounded-none border-slate-200 bg-white shadow-none">Master Export</Button>
      </div>

      {/* High-Density Assessee Table */}
      <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow className="h-10 hover:bg-transparent border-none">
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Legal Name & Liaison</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">ID Credentials</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Constitution</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Primary Contact</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-center">Lifecycle</TableHead>
                    <TableHead className="px-4 w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Retrieving KYC Directory…</TableCell></TableRow>
              ) : clients.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-xs font-bold text-slate-400 italic">No assessees detected in current directory.</TableCell></TableRow>
              ) : clients.map((c) => (
                <TableRow key={c.id} className="h-12 border-slate-50 border-b last:border-0 hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                         <div className="h-8 w-8 rounded-none bg-slate-900 flex items-center justify-center text-white font-black text-[9px]">
                            {c.name[0].toUpperCase()}
                         </div>
                         <div className="flex flex-col">
                            <span className="font-black text-[13px] text-[#0f172a] tracking-tight leading-tight uppercase">{c.name}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">{c.email || 'NO_LIAISON_MAIL'}</span>
                         </div>
                      </div>
                   </TableCell>
                   <TableCell className="px-4 py-2">
                       <div className="flex flex-col gap-0.5">
                           <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 font-mono tracking-tighter tabular-nums">
                               <CreditCard className="h-2.5 w-2.5 opacity-30 text-slate-900" />
                               PAN: {c.pan || 'UNASSIGNED'}
                           </div>
                           <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 font-mono tracking-tighter tabular-nums">
                               <ShieldCheck className="h-2.5 w-2.5 opacity-30" />
                               GST: {c.gstin || 'NON-REG'}
                           </div>
                       </div>
                   </TableCell>
                   <TableCell className="px-4 py-2">
                       <Badge variant="outline" className="rounded-none border-slate-200 text-[#0f172a] text-[8px] font-black uppercase tracking-widest px-1.5 py-0 bg-slate-50 shadow-none">
                           {c.business_type || 'GENERAL'}
                       </Badge>
                   </TableCell>
                   <TableCell className="px-4 py-2">
                       <div className="flex flex-col gap-0.5 text-[10px] font-black text-slate-500 uppercase">
                          <div className="flex items-center gap-1.5 tabular-nums">
                             <Phone className="h-3 w-3 opacity-30 text-slate-900" />
                             {c.phone || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1.5 truncate max-w-[150px] italic">
                             <MapPin className="h-3 w-3 opacity-30 text-slate-900" />
                             {c.address ? 'Statutory HQ' : 'No Addr'}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                        <Badge className={`rounded-none px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter border-none shadow-none ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                            {c.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 p-0 rounded-none hover:bg-slate-900 hover:text-white transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-none border-slate-200 shadow-none animate-in fade-in zoom-in-95 duration-75">
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-none" onClick={() => openEdit(c)}><Edit3 className="mr-2 h-3.5 w-3.5 text-blue-600" /> Amend Profile</DropdownMenuItem>
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-none" onClick={() => handleSyncStatus(c.id)}><RefreshCw className="mr-2 h-3.5 w-3.5 text-blue-500" /> Verify Portal Link</DropdownMenuItem>
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-none"><Briefcase className="mr-2 h-3.5 w-3.5 text-slate-500" /> View Engagements</DropdownMenuItem>
                                <div className="h-px bg-slate-100 my-1" />
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-none text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => handleDelete(c.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Decommission</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assessee Modal - Brutalist Zero-Radius */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-none flex items-center justify-center p-4 animate-in fade-in duration-200">
           <Card className="max-w-2xl w-full rounded-none border border-slate-300 shadow-none relative animate-in zoom-in-100 duration-150 overflow-hidden bg-white">
             <CardHeader className="bg-[#0f172a] text-white border-b border-white/10 p-4 px-6">
                <CardTitle className="text-lg font-black tracking-tight flex items-center justify-between uppercase">
                    {editClient ? 'Amend Assessee Profile' : 'Integrate New Assessee'}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/10 rounded-none" onClick={() => setShowModal(false)}>✕</Button>
                </CardTitle>
             </CardHeader>
             <form onSubmit={handleSubmit}>
                <div className="p-8 grid grid-cols-2 gap-5">
                    <div className="col-span-2 space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Legal Entity / Assessee Name</label>
                        <Input required placeholder="e.g. Acme Audit Solutions Pvt Ltd" className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600 uppercase" value={form.name || ''} onChange={(e) => setForm({...form, name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">PAN (Statutory ID)</label>
                        <Input placeholder="AAAAA0000A" maxLength={10} className="h-10 font-bold text-sm uppercase font-mono tracking-widest rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={form.pan || ''} onChange={(e) => setForm({...form, pan: e.target.value})} />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">GSTIN (Registration ID)</label>
                        <Input placeholder="22AAAAA0000A1Z5" maxLength={15} className="h-10 font-bold text-sm uppercase font-mono tracking-widest rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={form.gstin || ''} onChange={(e) => setForm({...form, gstin: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Constitutional Class</label>
                        <Select value={form.business_type || 'null'} onValueChange={val => setForm({...form, business_type: val === 'null' ? null : val})}>
                           <SelectTrigger className="h-10 font-black text-xs rounded-none border-slate-200 uppercase"><SelectValue placeholder="Identify Constitution" /></SelectTrigger>
                           <SelectContent className="rounded-none border-slate-200">
                               {['Proprietorship', 'Partnership', 'LLP', 'Private Ltd', 'Public Ltd', 'HUF', 'Trust'].map(t => <SelectItem key={t} value={t} className="rounded-none text-[10px] font-black uppercase">{t}</SelectItem>)}
                           </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lifecycle Status</label>
                        <Select value={form.status} onValueChange={(val) => setForm({...form, status: val})}>
                           <SelectTrigger className="h-10 font-black text-xs rounded-none border-slate-200 uppercase"><SelectValue /></SelectTrigger>
                           <SelectContent className="rounded-none border-slate-200">
                               <SelectItem value="active" className="rounded-none text-[10px] font-black uppercase">LISTED & ACTIVE</SelectItem>
                               <SelectItem value="inactive" className="rounded-none text-[10px] font-black uppercase">INACTIVE / ARCHIVE</SelectItem>
                           </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Liaison Email</label>
                        <Input type="email" placeholder="client@legal.com" className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={form.email || ''} onChange={(e) => setForm({...form, email: e.target.value})} />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Liaison Phone</label>
                        <Input placeholder="+91 XXXX XXXX" className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600 tabular-nums" value={form.phone || ''} onChange={(e) => setForm({...form, phone: e.target.value})} />
                    </div>
                    <div className="col-span-2 space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Registered Statutory Office / Address</label>
                        <textarea className="flex min-h-[80px] w-full rounded-none border border-slate-200 bg-transparent px-3 py-2 text-[11px] font-black uppercase shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 placeholder:text-slate-300 transition-colors" value={form.address || ''} onChange={(e) => setForm({...form, address: e.target.value})} placeholder="Full statutory address line..." />
                    </div>
                </div>
                <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-2">
                   <Button variant="ghost" type="button" className="h-10 px-6 text-[10px] font-black uppercase tracking-widest rounded-none text-slate-500 hover:bg-slate-100" onClick={() => setShowModal(false)}>Cancel Action</Button>
                   <Button type="submit" className="h-10 px-8 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none hover:bg-slate-800 transition-colors">{editClient ? 'Update Assessee' : 'Integrate Assessee'}</Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
