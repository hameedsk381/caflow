'use client'
import { useState, useEffect } from 'react'
import { teamApi } from '@/lib/api'
import type { TeamMember } from '@/types'
import { Plus, UserCog, Shield, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { getUser } from '@/lib/auth'

const ROLES = ['firm_admin', 'employee', 'tax_consultant']
const roleColor: Record<string, string> = {
  firm_admin: 'badge-accent', employee: 'badge-info', tax_consultant: 'badge-neutral', client: 'badge-neutral'
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>({ role: 'employee' })
  const currentUser = getUser()

  const fetchTeam = async () => {
    setLoading(true)
    try { const res = await teamApi.list(); setMembers(res.data.items) }
    catch { toast.error('Failed to load team') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTeam() }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await teamApi.invite(form)
      toast.success(`${form.name} added to team!`)
      setShowModal(false)
      setForm({ role: 'employee' })
      fetchTeam()
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed to add member') }
  }

  const handleRoleChange = async (id: string, role: string) => {
    try { await teamApi.updateRole(id, { role }); toast.success('Role updated'); fetchTeam() }
    catch { toast.error('Failed to update role') }
  }

  const handleRemove = async (id: string, name?: string) => {
    if (!confirm(`Remove ${name || 'this member'} from the team?`)) return
    try { await teamApi.remove(id); toast.success('Member removed'); fetchTeam() }
    catch { toast.error('Failed to remove member') }
  }

  const getInitials = (m: TeamMember) => (m.name || m.email).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[28px] md:text-[40px] font-semibold tracking-vercel-display leading-[1.20]">Team</h1>
          <p className="text-muted-foreground mt-2">{members.length} member{members.length !== 1 ? 's' : ''} in your firm</p>
        </div>
        {currentUser?.role === 'firm_admin' && (
          <button id="invite-member-btn" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Member
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8 gap-3">
          <div className="spinner" /><span className="text-muted">Loading…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <div key={m.id} className="bg-card text-card-foreground shadow-vercel-card transition-all duration-200 rounded-lg p-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="avatar avatar-lg">
                  {getInitials(m)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15px] text-foreground truncate">
                    {m.name || 'Unknown'}
                    {m.id === currentUser?.id && <span className="text-[11px] text-accent ml-1.5">(you)</span>}
                  </div>
                  <div className="text-[13px] text-muted-foreground truncate">{m.email}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`badge ${roleColor[m.role] || 'badge-neutral'}`}>
                  {m.role === 'firm_admin' ? <><Shield size={10} /> Admin</> : m.role?.replace('_', ' ')}
                </span>
                <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{m.status}</span>
              </div>

              {currentUser?.role === 'firm_admin' && m.id !== currentUser?.id && (
                <div className="flex gap-2">
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)}>
                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemove(m.id, m.name)}>Remove</button>
                </div>
              )}

              <div className="text-[11px] text-muted-foreground">
                Joined {format(new Date(m.created_at), 'dd MMM yyyy')}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-background rounded-lg shadow-vercel-popover max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <span className="text-lg font-semibold tracking-vercel-card">Add Team Member</span>
              <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="p-6 flex flex-col gap-4">
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Full Name *</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Priya Mehta" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Email *</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="email" required value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Role</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Temporary Password *</label>
                  <input className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="password" required minLength={8} value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-6 border-t border-border bg-muted/20">
                <button type="button" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
