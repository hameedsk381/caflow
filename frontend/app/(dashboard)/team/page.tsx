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
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{members.length} member{members.length !== 1 ? 's' : ''} in your firm</p>
        </div>
        {currentUser?.role === 'firm_admin' && (
          <button id="invite-member-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Member
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: 64, gap: 12 }}>
          <div className="spinner" /><span className="text-muted">Loading…</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {members.map(m => (
            <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="flex items-center gap-3">
                <div className="avatar avatar-lg" style={{ background: m.role === 'firm_admin' ? 'var(--accent)' : 'var(--bg-secondary)', fontSize: 16 }}>
                  {getInitials(m)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.name || 'Unknown'}
                    {m.id === currentUser?.id && <span style={{ fontSize: 11, color: 'var(--accent-light)', marginLeft: 6 }}>(you)</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</div>
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
                  <select className="form-input" style={{ flex: 1, fontSize: 12, padding: '6px 28px 6px 10px' }}
                    value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)}>
                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemove(m.id, m.name)}>Remove</button>
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Joined {format(new Date(m.created_at), 'dd MMM yyyy')}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Team Member</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Priya Mehta" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" required value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Temporary Password *</label>
                  <input className="form-input" type="password" required minLength={8} value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
