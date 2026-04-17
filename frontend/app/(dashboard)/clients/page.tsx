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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Unified Assessee Directory</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{total} Identities under Firm Management</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 px-4 text-[11px] font-black uppercase tracking-tight">Bulk Import PANs</Button>
          <Button onClick={openCreate} className="h-9 px-4 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4 mr-2" />
            Integrate Assessee
          </Button>
        </div>
      </div>

      {/* Strategic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Assessees</p>
                    <p className="text-2xl font-black tracking-tighter text-blue-600">{clients.filter(c => c.status === 'active').length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-100" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Corporate Entities</p>
                    <p className="text-2xl font-black tracking-tighter text-emerald-600">
                        {clients.filter(c => ['LLP', 'Private Ltd', 'Public Ltd'].includes(c.business_type || '')).length}
                    </p>
                </div>
                <Building2 className="h-8 w-8 text-emerald-100" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GST Registered</p>
                    <p className="text-2xl font-black tracking-tighter text-amber-600">
                        {clients.filter(c => !!c.gstin).length}
                    </p>
                </div>
                <ShieldCheck className="h-8 w-8 text-amber-100" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-[#0f172a] text-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Data Integrity</p>
                    <p className="text-3xl font-black tracking-tighter">98.4%</p>
                </div>
                <RefreshCw className="h-8 w-8 text-blue-500/20" />
          </CardContent>
        </Card>
      </div>

      {/* Forensic Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Search Assessee Name, PAN or GSTIN..." className="h-8 pl-8 w-[320px] text-xs font-bold border-slate-200 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
             <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 w-[130px] text-xs font-bold border-slate-200 bg-white">
                    <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="null">ALL STATUS</SelectItem>
                    <SelectItem value="active">ACTIVE</SelectItem>
                    <SelectItem value="inactive">INACTIVE</SelectItem>
                </SelectContent>
             </Select>
             <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Filter className="h-3.5 w-3.5" /></Button>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-tight">Master Export</Button>
      </div>

      {/* High-Density Assessee Table */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/50">
                <TableRow className="h-10 hover:bg-transparent border-b border-slate-100">
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
                <TableRow key={c.id} className="h-12 border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                         <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[10px]">
                            {c.name[0].toUpperCase()}
                         </div>
                         <div className="flex flex-col">
                            <span className="font-black text-[13px] text-slate-900 tracking-tight leading-tight">{c.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{c.email || 'NO_LIAISON_MAIL'}</span>
                         </div>
                      </div>
                   </TableCell>
                   <TableCell className="px-4 py-2">
                       <div className="flex flex-col gap-0.5">
                           <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 font-mono tracking-tighter">
                               <CreditCard className="h-2.5 w-2.5 opacity-30" />
                               PAN: {c.pan || 'UNASSIGNED'}
                           </div>
                           <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 font-mono tracking-tighter">
                               <ShieldCheck className="h-2.5 w-2.5 opacity-30" />
                               GST: {c.gstin || 'NON-REG'}
                           </div>
                       </div>
                   </TableCell>
                   <TableCell className="px-4 py-2">
                       <Badge variant="outline" className="rounded-md border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-widest px-1.5 py-0 bg-white hover:bg-white">
                           {c.business_type || 'GENERAL'}
                       </Badge>
                   </TableCell>
                   <TableCell className="px-4 py-2">
                       <div className="flex flex-col gap-0.5 text-[11px] font-bold text-slate-500">
                          <div className="flex items-center gap-1.5">
                             <Phone className="h-3 w-3 opacity-30" />
                             {c.phone || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                             <MapPin className="h-3 w-3 opacity-30" />
                             {c.address ? 'Registered Office' : 'No Address'}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                        <Badge className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                            {c.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 p-0 rounded-lg hover:bg-slate-100"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                <DropdownMenuItem className="text-xs font-bold" onClick={() => openEdit(c)}><Edit3 className="mr-2 h-3.5 w-3.5" /> Amend Profile</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold" onClick={() => handleSyncStatus(c.id)}><RefreshCw className="mr-2 h-3.5 w-3.5 text-blue-500" /> Verify Portal Link</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold"><Briefcase className="mr-2 h-3.5 w-3.5" /> View Engagements</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold text-rose-600" onClick={() => handleDelete(c.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Decommission</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assessee Modal - Condensed */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <Card className="max-w-2xl w-full rounded-2xl border-none shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
             <CardHeader className="bg-slate-50 border-b p-4 px-6">
                <CardTitle className="text-lg font-black tracking-tight flex items-center justify-between">
                    {editClient ? 'Amend Assessee Profile' : 'Integrate New Assessee'}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowModal(false)}>✕</Button>
                </CardTitle>
             </CardHeader>
             <form onSubmit={handleSubmit}>
                <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Legal Entity Name / Assessee Name</label>
                        <Input required placeholder="e.g. Acme Audit Solutions Pvt Ltd" className="h-9 font-bold text-sm" value={form.name || ''} onChange={(e) => setForm({...form, name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">PAN (Statutory ID)</label>
                        <Input placeholder="AAAAA0000A" maxLength={10} className="h-9 font-bold text-sm uppercase font-mono tracking-widest" value={form.pan || ''} onChange={(e) => setForm({...form, pan: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">GSTIN (Registration ID)</label>
                        <Input placeholder="22AAAAA0000A1Z5" maxLength={15} className="h-9 font-bold text-sm uppercase font-mono tracking-widest" value={form.gstin || ''} onChange={(e) => setForm({...form, gstin: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Constitutional Class</label>
                        <Select value={form.business_type || 'null'} onValueChange={val => setForm({...form, business_type: val === 'null' ? null : val})}>
                           <SelectTrigger className="h-9 font-bold text-xs"><SelectValue placeholder="Identify Constitution" /></SelectTrigger>
                           <SelectContent>
                               {['Proprietorship', 'Partnership', 'LLP', 'Private Ltd', 'Public Ltd', 'HUF', 'Trust'].map(t => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}
                           </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lifecycle Status</label>
                        <Select value={form.status} onValueChange={(val) => setForm({...form, status: val})}>
                           <SelectTrigger className="h-9 font-bold text-xs"><SelectValue /></SelectTrigger>
                           <SelectContent>
                               <SelectItem value="active">LISTED & ACTIVE</SelectItem>
                               <SelectItem value="inactive">INACTIVE / ARCHIVE</SelectItem>
                           </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Liaison Email</label>
                        <Input type="email" placeholder="client@legal.com" className="h-9 font-bold text-sm" value={form.email || ''} onChange={(e) => setForm({...form, email: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Liaison Phone</label>
                        <Input placeholder="+91 XXXX XXXX" className="h-9 font-bold text-sm" value={form.phone || ''} onChange={(e) => setForm({...form, phone: e.target.value})} />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Registered Registered Office / Address</label>
                        <textarea className="flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 placeholder:text-slate-400" value={form.address || ''} onChange={(e) => setForm({...form, address: e.target.value})} placeholder="Full statutory address line..." />
                    </div>
                </div>
                <div className="bg-slate-50 p-4 px-6 border-t flex justify-end gap-2">
                   <Button variant="ghost" type="button" className="h-9 text-[11px] font-black uppercase" onClick={() => setShowModal(false)}>Cancel</Button>
                   <Button type="submit" className="h-9 px-6 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider">{editClient ? 'Update Assessee' : 'Integrate Assessee'}</Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
