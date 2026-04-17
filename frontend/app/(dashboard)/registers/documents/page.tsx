'use client'
import { useState, useEffect } from 'react'
import { physicalRegistersApi, clientsApi, teamApi } from '@/lib/api'
import { format } from 'date-fns'
import { 
  Plus, ArrowDownLeft, ArrowUpRight, History, 
  Search, User, MapPin, ClipboardList, Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function DocumentMovementPage() {
  const [movements, setMovements] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  // Form State
  const [newMovement, setNewMovement] = useState({
    client_id: '',
    document_name: '',
    movement_type: 'receipt',
    date: format(new Date(), 'yyyy-MM-dd'),
    person_name: '',
    staff_id: '',
    physical_location: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [mRes, cRes, sRes] = await Promise.all([
        physicalRegistersApi.listDocuments(),
        clientsApi.list(),
        teamApi.list()
      ])
      setMovements(mRes.data)
      setClients(cRes.data.items || [])
      setStaff(sRes.data.items || [])
    } catch (err) {
      console.error("Failed to fetch movements:", err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = movements.filter(m =>
    m.document_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.person_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    try {
      await physicalRegistersApi.createDocument(newMovement)
      setIsAddOpen(false)
      fetchData()
      setNewMovement({
        client_id: '',
        document_name: '',
        movement_type: 'receipt',
        date: format(new Date(), 'yyyy-MM-dd'),
        person_name: '',
        staff_id: '',
        physical_location: '',
        notes: ''
      })
    } catch (err) {
      console.error("Failed to create movement:", err)
    }
  }

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">In/Out Register</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Document Inward/Outward Log</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-black text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20">
              <Plus className="h-3.5 w-3.5 mr-2" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl border-slate-200 shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 bg-slate-50/80 border-b">
              <DialogTitle className="text-xl font-black tracking-tight">Log Movement</DialogTitle>
              <DialogDescription className="text-xs font-medium">Record receipt or delivery of a physical asset.</DialogDescription>
            </DialogHeader>
            <div className="p-6 grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Type</Label>
                    <Select value={newMovement.movement_type} onValueChange={(val) => setNewMovement({...newMovement, movement_type: val})}>
                        <SelectTrigger className="h-9 border-slate-200 bg-slate-50/50 text-xs font-bold">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="receipt">Receipt (Incoming)</SelectItem>
                            <SelectItem value="delivery">Delivery (Outgoing)</SelectItem>
                            <SelectItem value="internal">Internal Transfer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</Label>
                    <Input type="date" id="date" className="h-9 border-slate-200 bg-slate-50/50 text-xs font-bold" value={newMovement.date} onChange={(e) => setNewMovement({...newMovement, date: e.target.value})} />
                </div>
              </div>
              
              <div className="grid gap-1.5">
                <Label htmlFor="client" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Client Entity</Label>
                <Select onValueChange={(val) => setNewMovement({...newMovement, client_id: val})}>
                  <SelectTrigger className="h-9 border-slate-200 text-xs font-bold">
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="doc" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Document Details</Label>
                <Input 
                  id="doc" 
                  className="h-9 border-slate-200 text-xs font-bold"
                  placeholder="e.g. Original Partnership Deed" 
                  value={newMovement.document_name}
                  onChange={(e) => setNewMovement({...newMovement, document_name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="person" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Client Representative</Label>
                    <Input id="person" className="h-9 border-slate-200 text-xs font-bold" placeholder="Full Name" value={newMovement.person_name} onChange={(e) => setNewMovement({...newMovement, person_name: e.target.value})} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="staff" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Handled By (Staff)</Label>
                    <Select onValueChange={(val) => setNewMovement({...newMovement, staff_id: val})}>
                        <SelectTrigger className="h-9 border-slate-200 text-xs font-bold">
                            <SelectValue placeholder="Staff Member" />
                        </SelectTrigger>
                        <SelectContent>
                            {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name || s.email}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Locker/Safe Location</Label>
                <Input 
                  id="location" 
                  className="h-9 border-slate-200 text-xs font-bold"
                  placeholder="e.g. Shelf B1, Box 4" 
                  value={newMovement.physical_location}
                  onChange={(e) => setNewMovement({...newMovement, physical_location: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter className="bg-slate-50 p-4 border-t gap-2">
              <Button variant="ghost" className="h-9 text-[11px] font-black uppercase tracking-tight" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} className="h-9 px-6 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider">Log Entry</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Incoming</p>
                    <p className="text-3xl font-black tracking-tighter text-blue-600">{movements.filter(m => m.movement_type === 'receipt').length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <ArrowDownLeft className="h-5 w-5" />
                </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Outgoing</p>
                    <p className="text-3xl font-black tracking-tighter text-rose-600">{movements.filter(m => m.movement_type === 'delivery').length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                    <ArrowUpRight className="h-5 w-5" />
                </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardHeader className="flex flex-row items-center justify-between p-4 bg-slate-50/50 border-b">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <History className="h-3.5 w-3.5" />
            Archive History
          </CardTitle>
          <div className="flex gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <Input placeholder="Filter..." className="pl-8 h-8 w-[200px] text-xs font-medium border-slate-200 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
             <Button variant="outline" className="h-8 w-8 p-0"><Filter className="h-3 w-3" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/50">
                <TableRow className="hover:bg-transparent h-10">
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 px-4">Date</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 px-4">Document Details</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 px-4 text-center">Movement Type</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 px-4">Client</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 px-4">Person</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 px-4">Vault</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 px-4 text-right">Handled By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 animate-pulse text-[10px] font-black text-slate-400 uppercase">Indexing…</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs font-bold italic">No records found.</TableCell></TableRow>
                ) : filtered.map((m) => (
                  <TableRow key={m.id} className="hover:bg-blue-50/30 transition-colors h-12 border-slate-50">
                    <TableCell className="font-bold text-xs px-4 text-slate-600">{format(new Date(m.date), 'dd/MM/yy')}</TableCell>
                    <TableCell className="px-4 font-black text-[13px] text-slate-900 tracking-tight">{m.document_name}</TableCell>
                    <TableCell className="px-4 text-center">
                       <Badge className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter ${
                           m.movement_type === 'receipt' ? 'bg-emerald-100 text-emerald-700' : 
                           m.movement_type === 'delivery' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                       }`}>
                          {m.movement_type}
                       </Badge>
                    </TableCell>
                    <TableCell className="px-4 text-[12px] font-bold text-slate-700">{m.client_name}</TableCell>
                    <TableCell className="px-4 text-[11px] font-medium text-slate-500 italic truncate max-w-[120px]">{m.person_name || '—'}</TableCell>
                    <TableCell className="px-4">
                       <div className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <MapPin className="h-2.5 w-2.5" />
                          {m.physical_location || '—'}
                       </div>
                    </TableCell>
                    <TableCell className="px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-[11px] font-black text-slate-700 uppercase">
                            {m.staff_name?.split(' ')[0] || 'Staff'}
                            <User className="h-3 w-3 opacity-30 text-blue-600" />
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
