'use client'
import { useState, useEffect } from 'react'
import { teamApi } from '@/lib/api'
import type { TeamMember } from '@/types'
import { 
  Plus, Shield, User, Mail, Calendar, 
  MoreVertical, Edit3, Trash2, GitPullRequest, 
  Search, Filter, ChevronRight, Crown, Briefcase, UserCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { getUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ROLES = ['firm_admin', 'employee', 'tax_consultant']

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [view, setView] = useState<'directory' | 'tree'>('directory')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<any>({ role: 'employee' })
  const currentUser = getUser()

  const fetchTeam = async () => {
    setLoading(true)
    try { 
      const res = await teamApi.list()
      setMembers(res.data.items) 
    } catch { toast.error('Failed to load firm registry') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTeam() }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await teamApi.invite(form)
      toast.success(`${form.name} added to firm registry!`)
      setShowModal(false)
      setForm({ role: 'employee' })
      fetchTeam()
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed to register member') }
  }

  const handleRoleChange = async (id: string, role: string) => {
    try { await teamApi.updateRole(id, { role }); toast.success('Position updated'); fetchTeam() }
    catch { toast.error('Failed to update position') }
  }

  const handleRemove = async (id: string, name?: string) => {
    if (!confirm(`Remove ${name || 'this member'} from the firm registry?`)) return
    try { await teamApi.remove(id); toast.success('Registry updated'); fetchTeam() }
    catch { toast.error('Failed to update registry') }
  }

  const filteredMembers = members.filter(m => 
    (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  // Grouping for Tree View
  const partners = filteredMembers.filter(m => m.role === 'firm_admin')
  const managers = filteredMembers.filter(m => m.role === 'tax_consultant')
  const associates = filteredMembers.filter(m => m.role === 'employee')

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Firm Hierarchy</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{members.length} Professional Registry</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex">
             <Button variant={view === 'directory' ? 'secondary' : 'ghost'} size="sm" className={`h-7 px-3 text-[10px] font-black uppercase tracking-tight ${view === 'directory' ? 'bg-white shadow-sm' : ''}`} onClick={() => setView('directory')}>Directory</Button>
             <Button variant={view === 'tree' ? 'secondary' : 'ghost'} size="sm" className={`h-7 px-3 text-[10px] font-black uppercase tracking-tight ${view === 'tree' ? 'bg-white shadow-sm' : ''}`} onClick={() => setView('tree')}>Org Tree</Button>
          </div>
          {currentUser?.role === 'firm_admin' && (
            <Button onClick={() => setShowModal(true)} className="h-9 px-4 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20">
              <Plus className="h-4 w-4 mr-2" />
              Register Member
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
             <Input placeholder="Search hierarchy..." className="h-8 pl-8 text-xs font-bold border-slate-200 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" className="h-8 w-8 p-0"><Filter className="h-3.5 w-3.5" /></Button>
          </div>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Retrieving Registry…</div>
      ) : view === 'directory' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map(m => (
            <MemberCard key={m.id} m={m} currentUser={currentUser} onRemove={handleRemove} onRoleChange={handleRoleChange} />
          ))}
        </div>
      ) : (
        /* Org Tree Implementation */
        <div className="flex flex-col items-center gap-12 py-8 animate-in zoom-in-95 duration-500">
           {/* Level 1: Partners */}
           <div className="flex flex-col items-center gap-6">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Partners / Admins</div>
              <div className="flex flex-wrap justify-center gap-8 relative">
                 {partners.map(p => (
                   <div key={p.id} className="relative z-10">
                      <TreeCard m={p} color="blue" />
                   </div>
                 ))}
                 {partners.length > 0 && <div className="absolute top-[100%] left-1/2 h-12 w-px bg-slate-200 -translate-x-1/2" />}
              </div>
           </div>

           {/* Level 2: Managers */}
           <div className="flex flex-col items-center gap-6 relative">
              <div className="h-px w-[80%] max-w-[600px] bg-slate-200 mb-6" />
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Section Managers</div>
              <div className="flex flex-wrap justify-center gap-8 relative">
                 {managers.length === 0 ? (
                    <div className="text-[10px] font-bold text-slate-300 italic uppercase">No appointments</div>
                 ) : managers.map(m => (
                    <div key={m.id} className="relative z-10">
                       <TreeCard m={m} color="indigo" />
                    </div>
                 ))}
                 {managers.length > 0 && <div className="absolute top-[100%] left-1/2 h-12 w-px bg-slate-200 -translate-x-1/2" />}
              </div>
           </div>

           {/* Level 3: Associates */}
           <div className="flex flex-col items-center gap-6 relative">
              <div className="h-px w-[90%] max-w-[800px] bg-slate-200 mb-6" />
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Paid Assistants / Associates</div>
              <div className="flex flex-wrap justify-center gap-4">
                 {associates.length === 0 ? (
                    <div className="text-[10px] font-bold text-slate-300 italic uppercase">No appointments</div>
                 ) : associates.map(a => (
                    <TreeCard key={a.id} m={a} color="slate" />
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Invitation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <Card className="max-w-md w-full rounded-2xl border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <CardHeader className="bg-slate-50 border-b p-6">
                <CardTitle className="text-xl font-black tracking-tight">Register Firm Member</CardTitle>
             </CardHeader>
             <form onSubmit={handleInvite}>
                <div className="p-6 space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Legal Name</label>
                      <Input required placeholder="e.g. Rahul Sharma" className="h-10 font-bold" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Work Email</label>
                         <Input type="email" required placeholder="name@firm.com" className="h-10 font-bold" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Role</label>
                         <select className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-blue-600 outline-none" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                            {ROLES.map(r => <option key={r} value={r}>{r.split('_').join(' ').toUpperCase()}</option>)}
                         </select>
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Credential</label>
                      <Input type="password" required placeholder="Temporary password" minLength={8} className="h-10 font-bold" value={form.password || ''} onChange={e => setForm({...form, password: e.target.value})} />
                   </div>
                </div>
                <div className="bg-slate-50 p-4 px-6 border-t flex justify-end gap-2">
                   <Button variant="ghost" type="button" className="h-9 text-[11px] font-black uppercase" onClick={() => setShowModal(false)}>Cancel</Button>
                   <Button type="submit" className="h-9 px-6 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider">Add to Registry</Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}

function MemberCard({ m, currentUser, onRemove, onRoleChange }: any) {
    return (
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-all group">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {m.name?.[0] || 'U'}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-black text-slate-900 truncate tracking-tight">{m.name} {m.id === currentUser?.id && <span className="text-[10px] text-blue-500 font-bold ml-1">(YOU)</span>}</h3>
                            <p className="text-[10px] font-bold text-slate-500 truncate">{m.email}</p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0 rounded-lg"><MoreVertical className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => onRoleChange(m.id, 'firm_admin')}><Crown className="mr-2 h-3.5 w-3.5" /> Make Partner</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold text-rose-600" onClick={() => onRemove(m.id, m.name)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                   <Badge className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                       m.role === 'firm_admin' ? 'bg-blue-100 text-blue-700' : 
                       m.role === 'tax_consultant' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                   }`}>
                      {m.role === 'firm_admin' ? 'Partner' : m.role?.replace('_', ' ')}
                   </Badge>
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <Calendar className="h-3 w-3" />
                      Joined {format(new Date(m.created_at), 'MMM yyyy')}
                   </div>
                </div>
            </CardContent>
        </Card>
    )
}

function TreeCard({ m, color }: any) {
    const colors: any = {
        blue: 'border-blue-200 bg-blue-50/30 text-blue-900',
        indigo: 'border-indigo-200 bg-indigo-50/30 text-indigo-900',
        slate: 'border-slate-200 bg-white text-slate-900'
    }
    
    const iconColors: any = {
        blue: 'bg-blue-600 text-white',
        indigo: 'bg-indigo-600 text-white',
        slate: 'bg-slate-100 text-slate-500'
    }

    return (
        <div className={`p-4 rounded-2xl border w-44 shadow-sm ${colors[color]} text-center transition-all hover:shadow-md hover:-translate-y-1`}>
            <div className={`h-10 w-10 rounded-xl mx-auto flex items-center justify-center font-black mb-3 ${iconColors[color]}`}>
                {color === 'blue' ? <Crown className="h-5 w-5" /> : color === 'indigo' ? <Briefcase className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
            </div>
            <h4 className="text-[12px] font-black tracking-tight truncate px-1">{m.name}</h4>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">
                {m.role === 'firm_admin' ? 'Partner' : m.role?.replace('_', ' ')}
            </p>
        </div>
    )
}
