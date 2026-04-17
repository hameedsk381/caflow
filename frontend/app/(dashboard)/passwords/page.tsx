'use client'
import { useState, useEffect } from 'react'
import { vaultApi, clientsApi } from '@/lib/api'
import { 
  Plus, Key, Globe, Search, User as UserIcon,
  Eye, EyeOff, Trash2, Clipboard, Lock, Shield,
  MoreVertical, Edit3, Building2, Server, CheckCircle2,
  Terminal, ShieldCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export default function PasswordsPage() {
  const [creds, setCreds] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [revealedPass, setRevealedPass] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  
  // Form State
  const [newCred, setNewCred] = useState({
    client_id: '',
    portal_name: '',
    username: '',
    password: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [crRes, cRes] = await Promise.all([
        vaultApi.listCredentials(),
        clientsApi.list()
      ])
      setCreds(crRes.data)
      setClients(cRes.data.items || [])
    } catch (err) {
      console.error("Failed to fetch credentials:", err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = creds.filter(c =>
    c.portal_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    try {
      await vaultApi.createCredential(newCred)
      setIsAddOpen(false)
      fetchData()
      setNewCred({
        client_id: '',
        portal_name: '',
        username: '',
        password: '',
        notes: ''
      })
      toast.success('Credentials Vaulted')
    } catch (err) {
      console.error("Failed to create credential:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Formally delete these credentials? This cannot be undone.")) return
    try {
      await vaultApi.deleteCredential(id)
      fetchData()
      toast.success('Credentials Removed')
    } catch (err) {
      console.error("Failed to delete credential:", err)
    }
  }

  const handleReveal = async (id: string) => {
    if (revealedPass[id]) {
        const next = {...revealedPass}
        delete next[id]
        setRevealedPass(next)
        return
    }
    try {
      const res = await vaultApi.revealCredential(id)
      setRevealedPass({...revealedPass, [id]: res.data.password})
    } catch (err) {
      console.error("Failed to reveal password:", err)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Credential Vault</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Secure Multi-Portal Identity Management</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="h-9 px-4 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20">
          <Plus className="h-4 w-4 mr-2" />
          Vault Credential
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Portal Accesses</p>
                    <p className="text-3xl font-black tracking-tighter text-blue-600">{creds.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Globe className="h-5 w-5" />
                </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Encryption Standard</p>
                    <p className="text-3xl font-black tracking-tighter text-emerald-600">AES-256</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-[#0f172a] text-white">
          <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Vault Security</p>
                    <p className="text-3xl font-black tracking-tighter">LOCKED</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <Lock className="h-5 w-5" />
                </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Search portal or client..." className="h-8 pl-8 w-[240px] text-xs font-bold border-slate-200 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-tight">Access Logs</Button>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/50">
                <TableRow className="h-10 hover:bg-transparent border-b border-slate-100">
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Service / Portal</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Subject / Client</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Identity / User</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Access Key</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Notes</TableHead>
                    <TableHead className="px-4 w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Decrypting Vault Access…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-xs font-bold text-slate-400 italic">No credentials found in current vault segment.</TableCell></TableRow>
              ) : filtered.map((cred) => (
                <TableRow key={cred.id} className="h-12 border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                         <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                            <Globe className="h-4 w-4" />
                         </div>
                         <span className="font-black text-[13px] text-slate-900 tracking-tight">{cred.portal_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                       <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                           <Building2 className="h-3 w-3 opacity-30" />
                           {cred.client_name || 'Generic'}
                       </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                       <div className="flex items-center gap-2">
                         <span className="text-[12px] font-bold text-slate-700 tracking-tight">{cred.username}</span>
                         <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600" onClick={() => copyToClipboard(cred.username, 'Username')}>
                            <Clipboard className="h-3 w-3" />
                         </Button>
                       </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                       <div className="flex items-center gap-2">
                          <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-black tracking-widest text-slate-400">
                             {revealedPass[cred.id] || '••••••••'}
                          </code>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => handleReveal(cred.id)}>
                             {revealedPass[cred.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          {revealedPass[cred.id] && (
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-emerald-600" onClick={() => copyToClipboard(revealedPass[cred.id], 'Password')}>
                               <Clipboard className="h-3 w-3" />
                            </Button>
                          )}
                       </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                        <span className="text-[10px] font-bold text-slate-400 italic truncate max-w-[120px] block">
                           {cred.notes || 'No annotation'}
                        </span>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 p-0 rounded-lg hover:bg-slate-100"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                <DropdownMenuItem className="text-xs font-bold"><Edit3 className="mr-2 h-3.5 w-3.5" /> Edit Access</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold text-rose-600" onClick={() => handleDelete(cred.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Purge Credential</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Credential Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <Card className="max-w-md w-full rounded-2xl border-none shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
             <CardHeader className="bg-slate-50 border-b p-4 px-6">
                <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Vault Portal Access
                </CardTitle>
             </CardHeader>
             <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assessee / Client</label>
                        <Select onValueChange={(val) => setNewCred({...newCred, client_id: val})}>
                            <SelectTrigger className="h-9 font-bold text-xs"><SelectValue placeholder="Identify Client" /></SelectTrigger>
                            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Portal / Service Name</label>
                        <Input placeholder="e.g. GST Portal, TRACES, MCA" className="h-9 font-bold text-xs" value={newCred.portal_name} onChange={(e) => setNewCred({...newCred, portal_name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Portal Username</label>
                            <Input placeholder="User ID" className="h-9 font-bold text-xs" value={newCred.username} onChange={(e) => setNewCred({...newCred, username: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secure Password</label>
                            <Input type="password" placeholder="Passphrase" className="h-9 font-bold text-xs" value={newCred.password} onChange={(e) => setNewCred({...newCred, password: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Security Annotation</label>
                        <Textarea placeholder="Recovery codes, hint..." className="min-h-[60px] text-xs font-medium" value={newCred.notes} onChange={(e) => setNewCred({...newCred, notes: e.target.value})} />
                    </div>
                </div>
                <div className="bg-slate-50 p-4 px-6 border-t flex justify-end gap-2">
                   <Button variant="ghost" type="button" className="h-9 text-[11px] font-black uppercase" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                   <Button type="submit" className="h-9 px-6 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider">Vault Identity</Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
