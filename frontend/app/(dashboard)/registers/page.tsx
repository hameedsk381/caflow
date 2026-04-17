'use client'
import { useState, useEffect, useCallback } from 'react'
import { registersApi, clientsApi } from '@/lib/api'
import { 
  Plus, Search, Pencil, Trash2, Database, 
  ChevronRight, Library, FileCheck, ShieldAlert,
  Archive, FileText, Filter, MoreVertical, Edit3,
  Calendar, Building2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import Link from 'next/link'
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

export default function RegistersPage() {
  const [registers, setRegisters] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editRegister, setEditRegister] = useState<any | null>(null)
  const [form, setForm] = useState<any>({ status: 'maintained' })

  const fetchRegisters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await registersApi.list({ search: search || undefined })
      setRegisters(res.data.items)
      setTotal(res.data.total)
    } catch {
      toast.error('Failed to load archive registry')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { 
    fetchRegisters()
    clientsApi.list({ size: 100 }).then(res => setClients(res.data.items))
  }, [fetchRegisters])

  const openCreate = () => { setEditRegister(null); setForm({ status: 'maintained' }); setShowModal(true) }
  const openEdit = (r: any) => { setEditRegister(r); setForm({ ...r }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!form.client_id) { toast.error('Client selection required'); return }
      
      if (editRegister) {
        await registersApi.update(editRegister.id, form)
        toast.success('Registry updated!')
      } else {
        await registersApi.create(form)
        toast.success('Record added to registry!')
      }
      setShowModal(false)
      fetchRegisters()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error saving registry record')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Formally delete this registry record?')) return
    try {
      await registersApi.delete(id)
      toast.success('Record removed')
      fetchRegisters()
    } catch { toast.error('Failed to update registry') }
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Precision Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Archive Hub</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{total} Statutory Registers Maintained</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={openCreate} className="h-9 px-4 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4 mr-2" />
            New Register
          </Button>
        </div>
      </div>

      {/* Register Navigators - Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Link href="/registers/documents" className="group">
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Archive className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900 tracking-tight">In/Out Register</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Document Logistics</p>
                        </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </CardContent>
            </Card>
         </Link>
         <Link href="/registers/licenses" className="group">
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden hover:border-emerald-400 hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <FileCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900 tracking-tight">Licenses Tracker</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Statutory Certificates</p>
                        </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </CardContent>
            </Card>
         </Link>
         <Link href="/dsc" className="group">
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden hover:border-amber-400 hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900 tracking-tight">DSC Register</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Digital Signatures</p>
                        </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                </CardContent>
            </Card>
         </Link>
      </div>

      {/* Consolidated Master Register */}
      <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                 <Library className="h-3.5 w-3.5" />
                 Master Statutory Directory
              </h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <Input placeholder="Filter registry..." className="h-8 pl-8 w-[200px] text-xs font-bold border-slate-200 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
          </div>

          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardContent className="p-0">
               <Table>
                  <TableHeader className="bg-slate-100/50">
                     <TableRow className="h-10 hover:bg-transparent border-b border-slate-100">
                        <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 w-[35%]">Register Description</TableHead>
                        <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Subject / Client</TableHead>
                        <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Periodicity</TableHead>
                        <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-center">Filing Status</TableHead>
                        <TableHead className="px-4 w-10"></TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {loading ? (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Synchronizing Archives…</TableCell></TableRow>
                     ) : registers.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-xs font-bold text-slate-400 italic">No statutory records identified.</TableCell></TableRow>
                     ) : registers.map(r => (
                        <TableRow key={r.id} className="h-12 border-slate-50 hover:bg-slate-50/50 transition-colors">
                           <TableCell className="px-4 py-2">
                               <div className="flex flex-col">
                                  <span className="font-black text-[13px] text-slate-900 tracking-tight leading-tight">{r.title}</span>
                                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter mt-0.5">{r.register_type}</span>
                               </div>
                           </TableCell>
                           <TableCell className="px-4 py-2">
                               <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                                   <Building2 className="h-3 w-3 opacity-30" />
                                   {clients.find(c => c.id === r.client_id)?.name || '—'}
                               </div>
                           </TableCell>
                           <TableCell className="px-4 py-2">
                               <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 italic">
                                   <Calendar className="h-3 w-3 opacity-30" />
                                   {r.period || 'Not Specified'}
                               </div>
                           </TableCell>
                           <TableCell className="px-4 py-2 text-center">
                               <Badge className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter ${
                                   r.status === 'maintained' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                               }`}>
                                  {r.status}
                               </Badge>
                           </TableCell>
                           <TableCell className="px-4 py-2 text-right">
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-7 w-7 p-0 rounded-lg hover:bg-slate-100"><MoreVertical className="h-3.5 w-3.5" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-32 rounded-xl">
                                        <DropdownMenuItem className="text-xs font-bold" onClick={() => openEdit(r)}><Edit3 className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                                        <DropdownMenuItem className="text-xs font-bold text-rose-600" onClick={() => handleDelete(r.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </CardContent>
          </Card>
      </div>

      {/* Master Registry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <Card className="max-w-xl w-full rounded-2xl border-none shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
             <CardHeader className="bg-slate-50 border-b p-4 px-6">
                <CardTitle className="text-lg font-black tracking-tight">{editRegister ? 'Amend Statutory Record' : 'Index New Statutory Register'}</CardTitle>
             </CardHeader>
             <form onSubmit={handleSubmit}>
                <div className="p-6 grid grid-cols-2 gap-4">
                   <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject / Client</label>
                      <Select value={form.client_id || 'null'} onValueChange={val => setForm({...form, client_id: val === 'null' ? null : val})}>
                        <SelectTrigger className="h-10 font-bold text-xs"><SelectValue placeholder="Select Client" /></SelectTrigger>
                        <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                   </div>
                   <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Register Description</label>
                      <Input required placeholder="e.g. Minutes Book, Fixed Asset Register" className="h-10 font-bold" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Register Class</label>
                      <Input required placeholder="e.g. Statutory, Internal" className="h-10 font-bold" value={form.register_type || ''} onChange={e => setForm({...form, register_type: e.target.value})} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Archive Period</label>
                      <Input placeholder="e.g. FY 2025-26" className="h-10 font-bold tabular-nums" value={form.period || ''} onChange={e => setForm({...form, period: e.target.value})} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Filing Status</label>
                      <Select value={form.status} onValueChange={val => setForm({...form, status: val})}>
                         <SelectTrigger className="h-10 font-bold text-xs"><SelectValue /></SelectTrigger>
                         <SelectContent>
                            <SelectItem value="maintained">MAINTAINED</SelectItem>
                            <SelectItem value="pending">PENDING</SelectItem>
                            <SelectItem value="overdue">OVERDUE</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                </div>
                <div className="bg-slate-50 p-4 px-6 border-t flex justify-end gap-2">
                   <Button variant="ghost" type="button" className="h-9 text-[11px] font-black uppercase" onClick={() => setShowModal(false)}>Cancel</Button>
                   <Button type="submit" className="h-9 px-6 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider">Save Index</Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
