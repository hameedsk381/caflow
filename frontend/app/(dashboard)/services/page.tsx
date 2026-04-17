'use client'
import { useState, useEffect, useCallback } from 'react'
import { servicesApi } from '@/lib/api'
import { 
  Plus, Search, Pencil, Trash2, Briefcase, 
  ShieldCheck, Zap, Repeat, Calculator, Banknote,
  MoreVertical, Edit3, Filter, Hash, CheckCircle2,
  PieChart, Tag, LayoutGrid, FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
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

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editService, setEditService] = useState<any | null>(null)
  const [form, setForm] = useState<any>({ is_active: true, billing_type: 'fixed' })

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await servicesApi.list({ search: search || undefined })
      setServices(res.data.items)
      setTotal(res.data.total)
    } catch {
      toast.error('Failed to load service catalog')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchServices() }, [fetchServices])

  const openCreate = () => { setEditService(null); setForm({ is_active: true, billing_type: 'fixed' }); setShowModal(true) }
  const openEdit = (s: any) => { setEditService(s); setForm({ ...s }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editService) {
        await servicesApi.update(editService.id, form)
        toast.success('Engagement profile updated!')
      } else {
        await servicesApi.create(form)
        toast.success('New service offering indexed!')
      }
      setShowModal(false)
      fetchServices()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error saving service offering')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Decommission this service offering?')) return
    try {
      await servicesApi.delete(id)
      toast.success('Service decommissioned')
      fetchServices()
    } catch { toast.error('Failed to update catalog') }
  }

  const getBillingBadge = (type: string) => {
    switch(type) {
        case 'fixed': return <Badge className="bg-blue-100 text-blue-700 rounded px-1.5 py-0 text-[8px] font-black uppercase">Fixed / One-time</Badge>
        case 'recurring': return <Badge className="bg-emerald-100 text-emerald-700 rounded px-1.5 py-0 text-[8px] font-black uppercase">Retainership</Badge>
        case 'hourly': return <Badge className="bg-amber-100 text-amber-700 rounded px-1.5 py-0 text-[8px] font-black uppercase">Variable / Hourly</Badge>
        default: return <Badge className="bg-slate-100 text-slate-700 rounded px-1.5 py-0 text-[8px] font-black uppercase">{type}</Badge>
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Precision Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Professional Service Catalog</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{total} Engagement Types Configured</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={openCreate} className="h-9 px-4 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4 mr-2" />
            Define Offering
          </Button>
        </div>
      </div>

      {/* Product Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Services</p>
                    <p className="text-2xl font-black tracking-tighter text-blue-600">{services.filter(s => s.is_active).length}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-100" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg Professional Fee</p>
                    <p className="text-2xl font-black tracking-tighter text-emerald-600">
                       ₹{(services.reduce((acc,curr) => acc + (curr.base_price || 0), 0) / (services.length || 1)).toLocaleString()}
                    </p>
                </div>
                <Banknote className="h-8 w-8 text-emerald-100" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Retainership Ratio</p>
                    <p className="text-2xl font-black tracking-tighter text-amber-600">
                       {Math.round((services.filter(s => s.billing_type === 'recurring').length / (services.length || 1)) * 100)}%
                    </p>
                </div>
                <Repeat className="h-8 w-8 text-amber-100" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-[#0f172a] text-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Service Coverage</p>
                    <p className="text-3xl font-black tracking-tighter uppercase">Global</p>
                </div>
                <PieChart className="h-8 w-8 text-blue-500/20" />
          </CardContent>
        </Card>
      </div>

      {/* Forensic Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Search Engagement Name or Code..." className="h-8 pl-8 w-[280px] text-xs font-bold border-slate-200 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
             <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Filter className="h-3.5 w-3.5" /></Button>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-tight">Generate Fee Schedule</Button>
      </div>

      {/* High-Density Service Table */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/50">
                <TableRow className="h-10 hover:bg-transparent border-b border-slate-100">
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Engagement Offering</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Service Code</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-center">Billing Model</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-right">Professional Fee (Base)</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-center">Status</TableHead>
                    <TableHead className="px-4 w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Accessing Firm Catalog…</TableCell></TableRow>
              ) : services.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-xs font-bold text-slate-400 italic">No offerings detected in current catalog segment.</TableCell></TableRow>
              ) : services.map((s) => (
                <TableRow key={s.id} className="h-12 border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                         <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                            <Tag className="h-4 w-4" />
                         </div>
                         <span className="font-black text-[13px] text-slate-900 tracking-tight">{s.name}</span>
                      </div>
                   </TableCell>
                   <TableCell className="px-4 py-2">
                       <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 font-mono tracking-tighter">
                           <Hash className="h-2.5 w-2.5 opacity-30" />
                           {s.code || 'SYS_PENDING'}
                       </div>
                   </TableCell>
                   <TableCell className="px-4 py-2 text-center">
                      {getBillingBadge(s.billing_type)}
                   </TableCell>
                   <TableCell className="px-4 py-2 text-right">
                       <span className="font-black text-[13px] text-slate-900 tracking-tight tabular-nums">₹{s.base_price?.toLocaleString() || '0'}</span>
                   </TableCell>
                   <TableCell className="px-4 py-2 text-center">
                       {s.is_active ? (
                           <Badge className="bg-emerald-100 text-emerald-700 rounded px-1.5 py-0 text-[8px] font-black uppercase">Active</Badge>
                       ) : (
                           <Badge className="bg-slate-100 text-slate-400 rounded px-1.5 py-0 text-[8px] font-black uppercase">Inactive</Badge>
                       )}
                   </TableCell>
                   <TableCell className="px-4 py-2 text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 p-0 rounded-lg hover:bg-slate-100"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                <DropdownMenuItem className="text-xs font-bold" onClick={() => openEdit(s)}><Edit3 className="mr-2 h-3.5 w-3.5" /> Amend Offering</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold"><Zap className="mr-2 h-3.5 w-3.5" /> View Engagements</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold text-rose-600" onClick={() => handleDelete(s.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Decommission</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Service Modal - Condensed */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <Card className="max-w-md w-full rounded-2xl border-none shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
             <CardHeader className="bg-slate-50 border-b p-4 px-6">
                <CardTitle className="text-lg font-black tracking-tight">Define Offering Profile</CardTitle>
             </CardHeader>
             <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Service Offering Name</label>
                        <Input required placeholder="e.g. Statutory Audit, Tax Advisory" className="h-9 font-bold text-sm" value={form.name || ''} onChange={(e) => setForm({...form, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Internal Code</label>
                            <Input placeholder="e.g. SA_01" className="h-9 font-bold text-sm uppercase" value={form.code || ''} onChange={(e) => setForm({...form, code: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Professional Fee</label>
                            <Input type="number" placeholder="0.00" className="h-9 font-bold text-sm" value={form.base_price || 0} onChange={(e) => setForm({...form, base_price: parseFloat(e.target.value)})} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Billing Policy</label>
                        <Select value={form.billing_type} onValueChange={(val) => setForm({...form, billing_type: val})}>
                           <SelectTrigger className="h-9 font-bold text-xs"><SelectValue /></SelectTrigger>
                           <SelectContent>
                               <SelectItem value="fixed">FIXED / ONE-TIME</SelectItem>
                               <SelectItem value="hourly">VARIABLE / HOURLY</SelectItem>
                               <SelectItem value="recurring">RETAINERSHIP</SelectItem>
                           </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Activation Status</label>
                        <Select value={form.is_active ? 'active' : 'inactive'} onValueChange={(val) => setForm({...form, is_active: val === 'active'})}>
                           <SelectTrigger className="h-9 font-bold text-xs"><SelectValue /></SelectTrigger>
                           <SelectContent>
                               <SelectItem value="active">LISTED & ACTIVE</SelectItem>
                               <SelectItem value="inactive">DECOMMISSIONED</SelectItem>
                           </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 px-6 border-t flex justify-end gap-2">
                   <Button variant="ghost" type="button" className="h-9 text-[11px] font-black uppercase" onClick={() => setShowModal(false)}>Cancel</Button>
                   <Button type="submit" className="h-9 px-6 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider">{editService ? 'Update Offering' : 'Index Service'}</Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
