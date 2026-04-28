'use client'
import { useState, useEffect, useCallback } from 'react'
import { vaultApi, clientsApi } from '@/lib/api'
import type { EncryptedCredential, Client } from '@/types/index'
import { 
  Plus, Search, Key, Eye, EyeOff, Trash2, 
  Globe, Copy, Check, Lock,
  MoreVertical
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

export default function PasswordVaultPage() {
  const [credentials, setCredentials] = useState<EncryptedCredential[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>({})
  const [revealingId, setRevealingId] = useState<string | null>(null)
  const [revealedPass, setRevealedPass] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([
        vaultApi.listCredentials(),
        clientsApi.list({ size: 100 })
      ])
      setCredentials(pRes.data)
      setClients(cRes.data.items)
    } catch { toast.error('Failed to load credentials') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await vaultApi.createCredential(form)
      toast.success('Credential saved to vault')
      setShowModal(false)
      setForm({})
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save password')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this password?')) return
    try {
      await vaultApi.deleteCredential(id)
      toast.success('Credential deleted')
      fetchData()
    } catch { toast.error('Delete failed') }
  }

  const handleReveal = async (id: string) => {
    if (revealingId === id) {
      setRevealingId(null)
      setRevealedPass(null)
      return
    }
    try {
      const res = await vaultApi.revealCredential(id)
      setRevealingId(id)
      setRevealedPass(res.data.password)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Unauthorized to view password')
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = credentials.filter(c => 
    c.portal_name.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase()) ||
    (c.client_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Password Vault</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Secure storage for portal credentials</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowModal(true)} className="h-9 px-4 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none">
            <Plus className="h-4 w-4 mr-2" />
            Add New Credential
          </Button>
        </div>
      </div>

      {/* Security Banner */}
      <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-none">
          <div className="h-10 w-10 bg-blue-600 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-white" />
          </div>
          <div>
              <p className="text-[11px] font-black text-blue-900 uppercase tracking-tight">Enterprise Grade Encryption</p>
              <p className="text-[10px] font-bold text-blue-700/80 uppercase tracking-widest leading-tight mt-0.5">All passwords are encrypted using AES-256 (Fernet) before storage. Access is logged in the security audit trail.</p>
          </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
         <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input placeholder="Search portal, username or client..." className="h-10 pl-8 w-[320px] text-[10px] font-bold border-slate-200 bg-white rounded-none shadow-none focus:ring-1 focus:ring-slate-900" value={search} onChange={(e) => setSearch(e.target.value)} />
         </div>
      </div>

      {/* Table */}
      <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow className="h-10 hover:bg-transparent border-none">
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Portal / Service</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Client</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Username</TableHead>
                    <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Password</TableHead>
                    <TableHead className="px-4 w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Accessing Vault...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-xs font-bold text-slate-400 italic">No credentials found.</TableCell></TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id} className="h-14 border-slate-50 border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-none bg-slate-100 flex items-center justify-center text-slate-500">
                            <Globe className="h-4 w-4" />
                         </div>
                         <span className="font-black text-[13px] text-[#0f172a] tracking-tight leading-tight uppercase">{c.portal_name}</span>
                      </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{c.client_name || '—'}</span>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-slate-500 font-mono tracking-tighter">{c.username}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-slate-200" onClick={() => copyToClipboard(c.username, c.id + '_u')}>
                            {copiedId === c.id + '_u' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 flex items-center px-3 font-mono text-[11px] font-black tracking-widest ${revealingId === c.id ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-300'}`}>
                            {revealingId === c.id ? revealedPass : '••••••••••••'}
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-200" onClick={() => handleReveal(c.id)}>
                            {revealingId === c.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        {revealingId === c.id && (
                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-200" onClick={() => copyToClipboard(revealedPass || '', c.id + '_p')}>
                                {copiedId === c.id + '_p' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                             </Button>
                        )}
                      </div>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 p-0 rounded-none hover:bg-slate-900 hover:text-white transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-none border-slate-200 shadow-none">
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-none" onClick={() => handleReveal(c.id)}><Key className="mr-2 h-3.5 w-3.5" /> Reveal Password</DropdownMenuItem>
                                <div className="h-px bg-slate-100 my-1" />
                                <DropdownMenuItem className="text-[10px] font-black uppercase rounded-none text-rose-600" onClick={() => handleDelete(c.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
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
           <Card className="max-w-xl w-full rounded-none border border-slate-300 shadow-none relative bg-white overflow-hidden">
             <CardHeader className="bg-[#0f172a] text-white border-b border-white/10 p-4 px-6">
                <CardTitle className="text-lg font-black tracking-tight flex items-center justify-between uppercase">
                    Add New Credential
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
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Portal Name</label>
                        <Input required placeholder="e.g. Income Tax Portal, GST Portal" className="h-10 font-black text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600 uppercase" value={form.portal_name || ''} onChange={e => setForm({...form, portal_name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Username</label>
                        <Input required placeholder="Enter username" className="h-10 font-black text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={form.username || ''} onChange={e => setForm({...form, username: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                        <Input required type="password" placeholder="Enter password" className="h-10 font-black text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={form.password || ''} onChange={e => setForm({...form, password: e.target.value})} />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Notes (Optional)</label>
                        <textarea className="flex min-h-[80px] w-full rounded-none border border-slate-200 bg-transparent px-3 py-2 text-[11px] font-black uppercase shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600" value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any specific login instructions..." />
                    </div>
                </div>
                <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-2">
                    <Button variant="ghost" type="button" className="h-10 px-6 text-[10px] font-black uppercase tracking-widest rounded-none" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button type="submit" className="h-10 px-8 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none hover:bg-slate-800 transition-colors">Store Securely</Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
