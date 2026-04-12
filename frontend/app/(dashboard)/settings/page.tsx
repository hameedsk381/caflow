'use client'
import { useState } from 'react'
import { authApi } from '@/lib/api'
import { setUser } from '@/lib/auth'
import { User, Lock, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { getUser } from '@/lib/auth'

export default function SettingsPage() {
  const currentUser = getUser()
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.profile?.name || '',
    phone: currentUser?.profile?.phone || '',
  })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authApi.updateProfile(profileForm)
      setUser(res.data)
      toast.success('Profile updated!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally { setSaving(false) }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    if (pwForm.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSavingPw(true)
    try {
      await authApi.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      toast.success('Password changed!')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to change password')
    } finally { setSavingPw(false) }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your profile and account settings</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
          <div style={{ width: 20, height: 20, color: 'var(--accent-light)' }}><User size={20} /></div>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Profile Information</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div className="avatar avatar-lg" style={{ fontSize: 20 }}>
            {(profileForm.name || currentUser?.email || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{profileForm.name || 'Your Name'}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{currentUser?.email}</div>
            <div style={{ marginTop: 4 }}>
              <span className="badge badge-accent" style={{ fontSize: 11 }}>{currentUser?.role?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Your name" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+91 99999 99999" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Email (cannot change)</label>
            <input className="form-input" value={currentUser?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Card */}
      <div className="card">
        <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
          <Lock size={20} style={{ color: 'var(--accent-light)' }} />
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Change Password</h2>
        </div>
        <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-input" type="password" required value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" required minLength={8} value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" required value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={savingPw}>
              {savingPw ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
