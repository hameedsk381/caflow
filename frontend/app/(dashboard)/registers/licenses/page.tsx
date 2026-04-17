'use client'
import { useState, useEffect } from 'react'
import { physicalRegistersApi, clientsApi } from '@/lib/api'
import { format, isPast, differenceInDays } from 'date-fns'
import { 
  Plus, FileText, Search, ShieldAlert, 
  Calendar, Info, AlertCircle, CheckCircle2,
  Trash2, Edit3, Filter, MoreVertical, Building2,
  Clock, Hash
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

export default function LicenseTrackerPage() {
  const [licenses, setLicenses] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  // Form State
  const [newLicense, setNewLicense] = useState({
    client_id: '',
    license_type: '',
    license_number: '',
    expiry_date: '',
    remind_days: 30,
    status: 'Active',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [lRes, cRes] = await Promise.all([
        physicalRegistersApi.listLicenses(),
        clientsApi.list()
      ])
      setLicenses(lRes.data)
      setClients(cRes.data.items || [])
    } catch (err) {
      console.error("Failed to fetch licenses:", err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = licenses.filter(l =>
    l.license_type?.toLowerCase().includes(search.toLowerCase()) ||
    l.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.license_number?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (!confirm("Formally strike off this license record?")) return
    try {
      await physicalRegistersApi.deleteLicense(id)
      fetchData()
    } catch (err) {
      console.error("Failed to delete license:", err)
    }
  }

  const handleCreate = async () => {
    try {
      await physicalRegistersApi.createLicense(newLicense)
      setIsAddOpen(false)
      fetchData()
      setNewLicense({
        client_id: '',
        license_type: '',
        license_number: '',
        expiry_date: '',
        remind_days: 30,
        status: 'Active',
        notes: ''
      })
    } catch (err) {
      console.error("Failed to create license:", err)
    }
  }

  const getStatusBadge = (expiryDate: string | null) => {
    if (!expiryDate) return <Badge className="bg-slate-100 text-slate-500 rounded px-1.5 py-0 text-[8px] font-black uppercase">Statutory</Badge>
    
    const days = differenceInDays(new Date(expiryDate), new Date())
    if (isPast(new Date(expiryDate))) return <Badge className="bg-rose-100 text-rose-700 rounded px-1.5 py-0 text-[8px] font-black uppercase">Expired</Badge>
    if (days <= 30) return <Badge className="bg-amber-100 text-amber-700 rounded px-1.5 py-0 text-[8px] font-black uppercase">Renewal Due ({days}d)</Badge>
    return <Badge className="bg-emerald-100 text-emerald-700 rounded px-1.5 py-0 text-[8px] font-black uppercase">Active</Badge>
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">License Tracker</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Statutory Certificate Management & Renewals</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="h-9 px-4 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20">
          <Plus className="h-4 w-4 mr-2" />
          Track Certificate
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Licenses</p>
                    <p className="text-3xl font-black tracking-tighter text-blue-600">{licenses.filter(l => l.status === 'Active').length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText className="h-5 w-5" />
                </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Renewal Critical</p>
                    <p className="text-3xl font-black tracking-tighter text-rose-600">
                        {licenses.filter(l => l.expiry_date && differenceInDays(new Date(l.expiry_date), new Date()) <= 60).length}
                    </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                    <ShieldAlert className="h-5 w-5" />
                </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-[#0f172a] text-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Sync Health</p>
                    <p className="text-3xl font-black tracking-tighter">OPTIMAL</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <CheckCircle2 className="h-5 w-5" />
                </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Search certificate..." className="h-8 pl-8 w-[240px] text-xs font-bold border-slate-200 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-tight">Sync Portal</Button>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/50">
                <TableRow className="h-10 hover:bg-transparent border-b border-slate-100">
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Statutory Certificate</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Subject / Client</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">License #</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Expiry View</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-center">Renewal Status</TableHead>
                    <TableHead className="px-4 w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Retrieving Compliance Registry…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-xs font-bold text-slate-400 italic">No certificates detected in current scope.</TableCell></TableRow>
              ) : filtered.map((lic) => (
                <TableRow key={lic.id} className="h-12 border-slate-50 hover:bg-slate-50/50 transition-colors">
                   <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                         <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[10px]">{lic.license_type.charAt(0).toUpperCase()}</div>
                         <span className="font-black text-[13px] text-slate-900 tracking-tight">{lic.license_type}</span>
                      </div>
                   </TableCell>
                   <TableCell className="px-4 py-2">
                       <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                           <Building2 className="h-3 w-3 opacity-30" />
                           {lic.client_name}
                       </div>
                   </TableCell>
                   <TableCell className="px-4 py-2">
                       <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 font-mono tracking-tighter">
                           <Hash className="h-2.5 w-2.5 opacity-30" />
                           {lic.license_number || 'ST/PENDING'}
                       </div>
                   </TableCell>
                   <TableCell className="px-4 py-2">
                       <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 tabular-nums">
                           <Calendar className="h-3 w-3 opacity-30" />
                           {lic.expiry_date ? format(new Date(lic.expiry_date), 'dd/MM/yyyy') : 'PERMANENT'}
                       </div>
                   </TableCell>
                   <TableCell className="px-4 py-2 text-center">
                      {getStatusBadge(lic.expiry_date)}
                   </TableCell>
                   <TableCell className="px-4 py-2 text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 p-0 rounded-lg hover:bg-slate-100"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                <DropdownMenuItem className="text-xs font-bold"><Edit3 className="mr-2 h-3.5 w-3.5" /> Edit Details</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold text-rose-600" onClick={() => handleDelete(lic.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Strike Off</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* License Modal - Condensed */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <Card className="max-w-md w-full rounded-2xl border-none shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
             <CardHeader className="bg-slate-50 border-b p-4 px-6">
                <CardTitle className="text-lg font-black tracking-tight">Index Statutory Certificate</CardTitle>
             </CardHeader>
             <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assessee / Client</label>
                        <Select onValueChange={(val) => setNewLicense({...newLicense, client_id: val})}>
                            <SelectTrigger className="h-9 font-bold text-xs"><SelectValue placeholder="Identify Client" /></SelectTrigger>
                            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Certificate Type</label>
                            <Input placeholder="e.g. GST, FSSAI" className="h-9 font-bold text-xs" value={newLicense.license_type} onChange={(e) => setNewLicense({...newLicense, license_type: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Registration #</label>
                            <Input placeholder="ST/2026/001" className="h-9 font-bold text-xs" value={newLicense.license_number} onChange={(e) => setNewLicense({...newLicense, license_number: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Expiry Date</label>
                            <Input type="date" className="h-9 font-bold text-xs" value={newLicense.expiry_date} onChange={(e) => setNewLicense({...newLicense, expiry_date: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Alert Horizon</label>
                            <Input type="number" className="h-9 font-bold text-xs" value={newLicense.remind_days} onChange={(e) => setNewLicense({...newLicense, remind_days: parseInt(e.target.value)})} />
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 px-6 border-t flex justify-end gap-2">
                   <Button variant="ghost" type="button" className="h-9 text-[11px] font-black uppercase" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                   <Button type="submit" className="h-9 px-6 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider">Start Tracking</Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
