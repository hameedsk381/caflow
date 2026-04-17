'use client'
import { useState, useEffect } from 'react'
import { vaultApi, clientsApi } from '@/lib/api'
import { format, differenceInDays, isPast } from 'date-fns'
import { 
  Plus, ShieldCheck, Key, MapPin, 
  Trash2, Eye, EyeOff, AlertTriangle, Search,
  Fingerprint, Briefcase, Calendar, MoreVertical,
  Building2, Edit3, UserCheck, ShieldAlert
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function DSCRegisterPage() {
  const [tokens, setTokens] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [revealedPins, setRevealedPins] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  
  // Form State
  const [newToken, setNewToken] = useState({
    client_id: '',
    holder_name: '',
    expiry_date: '',
    physical_location: '',
    pin: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tRes, cRes] = await Promise.all([
        vaultApi.listDsc(),
        clientsApi.list()
      ])
      setTokens(tRes.data)
      setClients(cRes.data.items || [])
    } catch (err) {
      console.error("Failed to fetch DSC tokens:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await vaultApi.createDsc(newToken)
      setIsAddOpen(false)
      fetchData()
      setNewToken({
        client_id: '',
        holder_name: '',
        expiry_date: '',
        physical_location: '',
        pin: ''
      })
    } catch (err) {
      console.error("Failed to create DSC:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Formally strike off this DSC token? This cannot be undone.")) return
    try {
      await vaultApi.deleteDsc(id)
      fetchData()
    } catch (err) {
      console.error("Failed to delete DSC:", err)
    }
  }

  const handleReveal = async (id: string) => {
    if (revealedPins[id]) {
        const next = {...revealedPins}
        delete next[id]
        setRevealedPins(next)
        return
    }
    try {
      const res = await vaultApi.revealDsc(id)
      setRevealedPins({...revealedPins, [id]: res.data.pin})
    } catch (err) {
      console.error("Failed to reveal PIN:", err)
    }
  }

  const filtered = tokens.filter(t =>
    t.holder_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.client_name?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date())
    if (isPast(new Date(expiryDate))) return <Badge className="bg-rose-100 text-rose-700 rounded px-1.5 py-0 text-[8px] font-black uppercase">Expired</Badge>
    if (days <= 30) return <Badge className="bg-amber-100 text-amber-700 rounded px-1.5 py-0 text-[8px] font-black uppercase">Renewal Due ({days}d)</Badge>
    if (days <= 90) return <Badge className="bg-blue-100 text-blue-700 rounded px-1.5 py-0 text-[8px] font-black uppercase">Expiring Soon</Badge>
    return <Badge className="bg-emerald-100 text-emerald-700 rounded px-1.5 py-0 text-[8px] font-black uppercase">Authorized</Badge>
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">DSC Master Register</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Digital Signature Custody & Renewal Control</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="h-9 px-4 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20">
          <Plus className="h-4 w-4 mr-2" />
          Register Token
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Tokens</p>
                    <p className="text-3xl font-black tracking-tighter text-blue-600">{tokens.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Fingerprint className="h-5 w-5" />
                </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expiring 90D</p>
                    <p className="text-3xl font-black tracking-tighter text-amber-600">
                        {tokens.filter(t => differenceInDays(new Date(t.expiry_date), new Date()) <= 90 && !isPast(new Date(t.expiry_date))).length}
                    </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <ShieldAlert className="h-5 w-5" />
                </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-[#0f172a] text-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Vault Status</p>
                    <p className="text-3xl font-black tracking-tighter">SECURED</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <ShieldCheck className="h-5 w-5" />
                </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Search holder or client..." className="h-8 pl-8 w-[240px] text-xs font-bold border-slate-200 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-tight">Audit Log</Button>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/50">
                <TableRow className="h-10 hover:bg-transparent border-b border-slate-100">
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Holder Name</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Subject / Client</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Expiry View</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-center">Status</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Custodian Location</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Token PIN</TableHead>
                    <TableHead className="px-4 w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Accessing Vault Registry…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-xs font-bold text-slate-400 italic">No DSC tokens detected in current registry.</TableCell></TableRow>
              ) : filtered.map((token) => (
                <TableRow key={token.id} className="h-12 border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                         <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                            <UserCheck className="h-4 w-4" />
                         </div>
                         <span className="font-black text-[13px] text-slate-900 tracking-tight">{token.holder_name}</span>
                      </div>
                   </TableCell>
                   <TableCell className="px-4 py-2">
                       <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                           <Building2 className="h-3 w-3 opacity-30" />
                           {token.client_name || 'Individual'}
                       </div>
                   </TableCell>
                   <TableCell className="px-4 py-2">
                       <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 tabular-nums">
                           <Calendar className="h-3 w-3 opacity-30" />
                           {format(new Date(token.expiry_date), 'dd/MM/yyyy')}
                       </div>
                   </TableCell>
                   <TableCell className="px-4 py-2 text-center">
                      {getStatusBadge(token.expiry_date)}
                   </TableCell>
                   <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                        <MapPin className="h-3 w-3 opacity-30" />
                        {token.physical_location || 'Not Tracked'}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                       <div className="flex items-center gap-2">
                          <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-black tracking-widest text-slate-600">
                             {revealedPins[token.id] || '••••••'}
                          </code>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => handleReveal(token.id)}>
                             {revealedPins[token.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                       </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 p-0 rounded-lg hover:bg-slate-100"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                <DropdownMenuItem className="text-xs font-bold"><Edit3 className="mr-2 h-3.5 w-3.5" /> Edit Details</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold text-rose-600" onClick={() => handleDelete(token.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Strike Off</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DSC Modal - Condensed */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <Card className="max-w-md w-full rounded-2xl border-none shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
             <CardHeader className="bg-slate-50 border-b p-4 px-6">
                <CardTitle className="text-lg font-black tracking-tight">Index DSC Token</CardTitle>
             </CardHeader>
             <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assessee / Client</label>
                        <Select onValueChange={(val) => setNewToken({...newToken, client_id: val})}>
                            <SelectTrigger className="h-9 font-bold text-xs"><SelectValue placeholder="Identify Client" /></SelectTrigger>
                            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Certificate Holder Name</label>
                        <Input placeholder="e.g. Rahul Sharma" className="h-9 font-bold text-xs" value={newToken.holder_name} onChange={(e) => setNewToken({...newToken, holder_name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Expiry Date</label>
                            <Input type="date" className="h-9 font-bold text-xs" value={newToken.expiry_date} onChange={(e) => setNewToken({...newToken, expiry_date: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Encrypted PIN</label>
                            <Input type="password" placeholder="Token PIN" className="h-9 font-bold text-xs" value={newToken.pin} onChange={(e) => setNewToken({...newToken, pin: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Custodian Location</label>
                        <Input placeholder="e.g. Drawer 3, Safe Box 1" className="h-9 font-bold text-xs" value={newToken.physical_location} onChange={(e) => setNewToken({...newToken, physical_location: e.target.value})} />
                    </div>
                </div>
                <div className="bg-slate-50 p-4 px-6 border-t flex justify-end gap-2">
                   <Button variant="ghost" type="button" className="h-9 text-[11px] font-black uppercase" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                   <Button type="submit" className="h-9 px-6 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider">Authorize Token</Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
