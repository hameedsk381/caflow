'use client'
import { useState, useEffect, useCallback } from 'react'
import { vaultApi, clientsApi } from '@/lib/api'
import type { DSCToken, Client } from '@/types/index'
import { 
  ShieldAlert, Plus, Search, Calendar, MapPin, 
  Trash2, Key, Eye, EyeOff, MoreVertical, 
  AlertCircle, User, Building2,
  Clock, ShieldCheck, HardDrive
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

export default function DSCRegisterPage() {
  const [tokens, setTokens] = useState<DSCToken[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>({ is_active: true })
  const [revealingId, setRevealingId] = useState<string | null>(null)
  const [revealedPin, setRevealedPin] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, cRes] = await Promise.all([
        vaultApi.listDsc(),
        clientsApi.list({ size: 100 })
      ])
      setTokens(tRes.data)
      setClients(cRes.data.items)
    } catch { toast.error('Failed to load DSC data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await vaultApi.createDsc(form)
      toast.success('DSC added to register')
      setShowModal(false)
      setForm({ is_active: true })
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save DSC')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this DSC record?')) return
    try {
      await vaultApi.deleteDsc(id)
      toast.success('Record removed')
      fetchData()
    } catch { toast.error('Delete failed') }
  }

  const handleReveal = async (id: string) => {
    if (revealingId === id) {
      setRevealingId(null)
      setRevealedPin(null)
      return
    }
    try {
      const res = await vaultApi.revealDsc(id)
      setRevealingId(id)
      setRevealedPin(res.data.pin || 'NO PIN SET')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Unauthorized to reveal PIN')
    }
  }

  const filteredTokens = tokens.filter(t => 
    t.holder_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.client_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const expiringSoon = tokens.filter(t => {
      const days = differenceInDays(new Date(t.expiry_date), new Date())
      return days > 0 && days <= 30
  }).length

  const expiredCount = tokens.filter(t => isPast(new Date(t.expiry_date))).length

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">DSC Register</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Management of Digital Signature Certificates</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-none border-slate-200 shadow-none">Export Register</Button>
          <Button onClick={() => setShowModal(true)} className="h-9 px-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none">
            <Plus className="h-4 w-4 mr-2" />
            Add New DSC
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(expiringSoon > 0 || expiredCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expiredCount > 0 && (
                <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-none text-rose-700 animate-pulse">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <div className="text-[10px] font-black uppercase tracking-tight">
                        {expiredCount} Expired DSC token{expiredCount > 1 ? 's' : ''} detected. Renewal required immediately.
                    </div>
                </div>
            )}
            {expiringSoon > 0 && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-none text-amber-700">
                    <Clock className="h-5 w-5 shrink-0" />
                    <div className="text-[10px] font-black uppercase tracking-tight">
                        {expiringSoon} DSC token{expiringSoon > 1 ? 's' : ''} expiring within 30 days.
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
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Tokens</p>
                    <p className="text-2xl font-black tracking-tighter text-slate-900 tabular-nums">{tokens.length}</p>
                </div>
                <HardDrive className="h-6 w-6 text-slate-200" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valid</p>
                    <p className="text-2xl font-black tracking-tighter text-emerald-600 tabular-nums">{tokens.length - expiredCount}</p>
                </div>
                <ShieldCheck className="h-6 w-6 text-emerald-100" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expired</p>
                    <p className="text-2xl font-black tracking-tighter text-rose-600 tabular-nums">{expiredCount}</p>
                </div>
                <AlertCircle className="h-6 w-6 text-rose-100" />
          </CardContent>
        </Card>
        <Card className="border-[#1e293b] shadow-none rounded-none overflow-hidden bg-[#0f172a] text-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Clients Covered</p>
                    <p className="text-2xl font-black tracking-tighter tabular-nums">{Array.from(new Set(tokens.map(t => t.client_id))).length}</p>
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
                <Input placeholder="Search holder or client..." className="h-9 pl-8 w-[280px] text-[10px] font-bold border-slate-200 bg-white rounded-none shadow-none focus:ring-1 focus:ring-slate-900" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
          </div>
      </div>

      {/* Table */}
      <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow className="h-10 hover:bg-transparent border-none">
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Holder Name</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Client Association</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Expiry Date</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Physical Location</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Token PIN</TableHead>
                    <TableHead className="px-4 w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Register...</TableCell></TableRow>
              ) : filteredTokens.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-xs font-bold text-slate-400 italic">No DSC tokens found.</TableCell></TableRow>
              ) : filteredTokens.map((t) => {
                const isExpired = isPast(new Date(t.expiry_date))
                const daysLeft = differenceInDays(new Date(t.expiry_date), new Date())
                const isExpiringSoon = daysLeft > 0 && daysLeft <= 30

                return (
                  <TableRow key={t.id} className={`h-14 border-slate-50 border-b last:border-0 transition-colors ${isExpired ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50/50'}`}>
                    <TableCell className="px-4 py-2">
                        <div className="flex items-center gap-2.5">
                           <div className={`h-8 w-8 rounded-none flex items-center justify-center text-white font-black text-[9px] ${isExpired ? 'bg-rose-600' : 'bg-slate-900'}`}>
                              <User className="h-3.5 w-3.5" />
                           </div>
                           <span className="font-black text-[13px] text-[#0f172a] tracking-tight leading-tight uppercase">{t.holder_name}</span>
                        </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{t.client_name || '—'}</span>
                        </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                        <div className="flex flex-col gap-0.5">
                            <div className={`flex items-center gap-1.5 text-[11px] font-black tabular-nums ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-600'}`}>
                               <Calendar className="h-3 w-3 opacity-30" />
                               {format(new Date(t.expiry_date), 'dd MMM yyyy')}
                            </div>
                            {isExpiringSoon && <span className="text-[8px] font-black uppercase text-amber-600 leading-none">Expires in {daysLeft} days</span>}
                            {isExpired && <span className="text-[8px] font-black uppercase text-rose-600 leading-none">Expired</span>}
                        </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase italic">
                            <MapPin className="h-3 w-3 opacity-30 text-slate-900" />
                            {t.physical_location || 'Not Specified'}
                        </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-7 px-2 rounded-none font-black text-[10px] uppercase gap-2 transition-all ${revealingId === t.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
                            onClick={() => handleReveal(t.id)}
                        >
                            {revealingId === t.id ? (
                                <><EyeOff className="h-3.5 w-3.5" /> {revealedPin}</>
                            ) : (
                                <><Eye className="h-3.5 w-3.5" /> Show PIN</>
                            )}
                        </Button>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 p-0 rounded-none hover:bg-slate-900 hover:text-white transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-none border-slate-200 shadow-none">
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-none" onClick={() => handleReveal(t.id)}><Key className="mr-2 h-3.5 w-3.5" /> Reveal PIN</DropdownMenuItem>
                                <div className="h-px bg-slate-100 my-1" />
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-none text-rose-600" onClick={() => handleDelete(t.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
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
                    Register New DSC
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/10 rounded-none" onClick={() => setShowModal(false)}>✕</Button>
                </CardTitle>
             </CardHeader>
             <form onSubmit={handleSubmit}>
                <div className="p-8 grid grid-cols-2 gap-5">
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Client Association</label>
                        <Select value={form.client_id || 'null'} onValueChange={val => setForm({...form, client_id: val === 'null' ? null : val})}>
                            <SelectTrigger className="h-10 font-bold text-xs rounded-none border-slate-200 uppercase"><SelectValue placeholder="Select Client" /></SelectTrigger>
                            <SelectContent className="rounded-none">{clients.map(c => <SelectItem key={c.id} value={c.id} className="rounded-none uppercase">{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Holder Name</label>
                        <Input required placeholder="e.g. Rajesh Kumar" className="h-10 font-black text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600 uppercase" value={form.holder_name || ''} onChange={e => setForm({...form, holder_name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Expiry Date</label>
                        <Input required type="date" className="h-10 font-black text-xs rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={form.expiry_date || ''} onChange={e => setForm({...form, expiry_date: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Token PIN (Optional)</label>
                        <Input placeholder="Enter PIN" className="h-10 font-black text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={form.pin || ''} onChange={e => setForm({...form, pin: e.target.value})} />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Physical Location</label>
                        <Input placeholder="e.g. Drawer 3, Safe Box A" className="h-10 font-black text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600 uppercase" value={form.physical_location || ''} onChange={e => setForm({...form, physical_location: e.target.value})} />
                    </div>
                </div>
                <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-2">
                    <Button variant="ghost" type="button" className="h-10 px-6 text-[10px] font-black uppercase rounded-none" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button type="submit" className="h-10 px-8 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none hover:bg-slate-800 transition-colors">Register DSC</Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
