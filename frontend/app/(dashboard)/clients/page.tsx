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
import BulkUploadModal from '@/components/modals/BulkUploadModal'
import PortalSyncModal from '@/components/modals/PortalSyncModal'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [form, setForm] = useState<any>({ status: 'active' })

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await clientsApi.list({ search: search || undefined, status: status || undefined })
      setClients(res.data.items)
      setTotal(res.data.total)
    } catch {
      toast.error('Failed to load clients')
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
        toast.success('Client updated!')
      } else {
        await clientsApi.create(form)
        toast.success('New client added!')
      }
      setShowModal(false)
      fetchClients()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error saving client')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this client?')) return
    try {
      await clientsApi.delete(id)
      toast.success('Client archived')
      fetchClients()
    } catch { toast.error('Failed to update client status') }
  }

  const handleSyncStatus = async (client: Client) => {
    setSelectedClient(client)
    setShowSyncModal(true)
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Clients</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{total} Total Clients</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-2xl border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
            onClick={() => setShowBulkModal(true)}
          >
            Import Data
          </Button>
          <Button onClick={openCreate} className="h-9 px-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-sm hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Metrics ... unchanged ... */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white group hover:border-blue-500 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active</p>
                    <p className="text-2xl font-black tracking-tighter text-blue-600 tabular-nums">{clients.filter(c => c.status === 'active').length}</p>
                </div>
                <div className="h-10 w-10 bg-blue-50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white group hover:border-emerald-500 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Corporate</p>
                    <p className="text-2xl font-black tracking-tighter text-emerald-600 tabular-nums">
                        {clients.filter(c => ['LLP', 'Private Ltd', 'Public Ltd'].includes(c.business_type || '')).length}
                    </p>
                </div>
                <div className="h-10 w-10 bg-emerald-50 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white group hover:border-amber-500 transition-colors">
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
        <Card className="border-[#1e293b] shadow-sm rounded-2xl overflow-hidden bg-[#0f172a] text-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Data Health</p>
                    <p className="text-2xl font-black tracking-tighter tabular-nums">98.4%</p>
                </div>
                <div className="h-10 w-10 bg-blue-500/20 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-blue-400" />
                </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Search name, PAN or GSTIN..." className="h-10 pl-8 w-[320px] text-[10px] font-bold border-slate-200 bg-white rounded-2xl shadow-sm focus:ring-1 focus:ring-slate-900" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
             <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10 w-[130px] text-[10px] font-black uppercase text-slate-600 border-slate-200 bg-white rounded-2xl shadow-sm">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 shadow-sm">
                    <SelectItem value="null" className="text-[10px] font-black uppercase rounded-2xl">All Status</SelectItem>
                    <SelectItem value="active" className="text-[10px] font-black uppercase rounded-2xl">Active</SelectItem>
                    <SelectItem value="inactive" className="text-[10px] font-black uppercase rounded-2xl">Inactive</SelectItem>
                </SelectContent>
             </Select>
             <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-2xl border-slate-200 bg-white shadow-sm"><Filter className="h-3.5 w-3.5" /></Button>
          </div>
          <Button variant="outline" size="sm" className="h-10 text-[9px] font-black uppercase tracking-widest rounded-2xl border-slate-200 bg-white shadow-sm">Export All</Button>
      </div>

      {/* Table */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow className="h-10 hover:bg-transparent border-none">
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Client Name</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">IDs</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Type</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Contact</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-center">Status</TableHead>
                    <TableHead className="px-4 w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading...</TableCell></TableRow>
              ) : clients.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-xs font-bold text-slate-400 italic">No clients found.</TableCell></TableRow>
              ) : clients.map((c) => (
                <TableRow key={c.id} className="h-12 border-slate-50 border-b last:border-0 hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                         <div className="h-8 w-8 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-[9px]">
                            {c.name[0].toUpperCase()}
                         </div>
                         <div className="flex flex-col">
                            <span className="font-black text-[13px] text-[#0f172a] tracking-tight leading-tight uppercase">{c.name}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">{c.email || 'NO EMAIL'}</span>
                         </div>
                      </div>
                   </TableCell>
                   <TableCell className="px-4 py-2">
                       <div className="flex flex-col gap-0.5">
                           <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 font-mono tracking-tighter tabular-nums">
                               <CreditCard className="h-2.5 w-2.5 opacity-30 text-slate-900" />
                               PAN: {c.pan || 'N/A'}
                           </div>
                           <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 font-mono tracking-tighter tabular-nums">
                               <ShieldCheck className="h-2.5 w-2.5 opacity-30" />
                               GST: {c.gstin || 'N/A'}
                           </div>
                       </div>
                   </TableCell>
                   <TableCell className="px-4 py-2">
                       <Badge variant="outline" className="rounded-2xl border-slate-200 text-[#0f172a] text-[8px] font-black uppercase tracking-widest px-1.5 py-0 bg-slate-50 shadow-sm">
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
                             {c.address ? 'Address set' : 'No address'}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                        <Badge className={`rounded-2xl px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter border-none shadow-sm ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                            {c.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 p-0 rounded-2xl hover:bg-slate-900 hover:text-white transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-2xl border-slate-200 shadow-sm">
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-2xl" onClick={() => openEdit(c)}><Edit3 className="mr-2 h-3.5 w-3.5 text-blue-600" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-2xl" onClick={() => handleSyncStatus(c)}><RefreshCw className="mr-2 h-3.5 w-3.5 text-blue-500" /> Sync Portal</DropdownMenuItem>
                                <div className="h-px bg-slate-100 my-1" />
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-2xl text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => handleDelete(c.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Archive</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-none flex items-center justify-center p-4">
           <Card className="max-w-2xl w-full rounded-2xl border border-slate-300 shadow-sm relative overflow-hidden bg-white">
             <CardHeader className="bg-[#0f172a] text-white border-b border-white/10 p-4 px-6">
                <CardTitle className="text-lg font-black tracking-tight flex items-center justify-between uppercase">
                    {editClient ? 'Edit Client' : 'Add Client'}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/10 rounded-2xl" onClick={() => setShowModal(false)}>✕</Button>
                </CardTitle>
             </CardHeader>
             <form onSubmit={handleSubmit}>
                <div className="p-8 grid grid-cols-2 gap-5">
                    <div className="col-span-2 space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Client Name</label>
                        <Input required placeholder="e.g. Acme Solutions Pvt Ltd" className="h-10 font-bold text-sm rounded-2xl border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-blue-600 uppercase" value={form.name || ''} onChange={(e) => setForm({...form, name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">PAN</label>
                        <Input placeholder="AAAAA0000A" maxLength={10} className="h-10 font-bold text-sm uppercase font-mono tracking-widest rounded-2xl border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-blue-600" value={form.pan || ''} onChange={(e) => setForm({...form, pan: e.target.value})} />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">GSTIN</label>
                        <Input placeholder="22AAAAA0000A1Z5" maxLength={15} className="h-10 font-bold text-sm uppercase font-mono tracking-widest rounded-2xl border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-blue-600" value={form.gstin || ''} onChange={(e) => setForm({...form, gstin: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Type</label>
                        <Select value={form.business_type || 'null'} onValueChange={val => setForm({...form, business_type: val === 'null' ? null : val})}>
                           <SelectTrigger className="h-10 font-black text-xs rounded-2xl border-slate-200 uppercase"><SelectValue placeholder="Select Type" /></SelectTrigger>
                           <SelectContent className="rounded-2xl border-slate-200">
                                {['Proprietorship', 'Partnership', 'LLP', 'Private Ltd', 'Public Ltd', 'HUF', 'Trust'].map(t => <SelectItem key={t} value={t} className="rounded-2xl text-[10px] font-black uppercase">{t}</SelectItem>)}
                           </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
                        <Select value={form.status} onValueChange={(val) => setForm({...form, status: val})}>
                           <SelectTrigger className="h-10 font-black text-xs rounded-2xl border-slate-200 uppercase"><SelectValue /></SelectTrigger>
                           <SelectContent className="rounded-2xl border-slate-200">
                               <SelectItem value="active" className="rounded-2xl text-[10px] font-black uppercase">Active</SelectItem>
                               <SelectItem value="inactive" className="rounded-2xl text-[10px] font-black uppercase">Inactive</SelectItem>
                           </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                        <Input type="email" placeholder="client@example.com" className="h-10 font-bold text-sm rounded-2xl border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-blue-600" value={form.email || ''} onChange={(e) => setForm({...form, email: e.target.value})} />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone</label>
                        <Input placeholder="+91 XXXX XXXX" className="h-10 font-bold text-sm rounded-2xl border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-blue-600 tabular-nums" value={form.phone || ''} onChange={(e) => setForm({...form, phone: e.target.value})} />
                    </div>
                    <div className="col-span-2 space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Address</label>
                        <textarea className="flex min-h-[80px] w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-[11px] font-black uppercase shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 placeholder:text-slate-300 transition-colors" value={form.address || ''} onChange={(e) => setForm({...form, address: e.target.value})} placeholder="Full address..." />
                    </div>
                </div>
                <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-2">
                   <Button variant="ghost" type="button" className="h-10 px-6 text-[10px] font-black uppercase tracking-widest rounded-2xl text-slate-500 hover:bg-slate-100" onClick={() => setShowModal(false)}>Cancel</Button>
                   <Button type="submit" className="h-10 px-8 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-sm hover:bg-slate-800 transition-colors">{editClient ? 'Update Client' : 'Add Client'}</Button>
                </div>
             </form>
           </Card>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal 
        isOpen={showBulkModal} 
        onClose={() => setShowBulkModal(false)} 
        onSuccess={fetchClients} 
        type="clients" 
        onUpload={(data) => clientsApi.bulkCreate(data)}
      />

      {/* Portal Sync Modal */}
      {selectedClient && (
        <PortalSyncModal
            isOpen={showSyncModal}
            onClose={() => setShowSyncModal(false)}
            clientId={selectedClient.id}
            clientName={selectedClient.name}
        />
      )}
    </div>
  )
}
