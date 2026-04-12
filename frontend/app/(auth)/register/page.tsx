'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { setToken, setUser } from '@/lib/auth'
import toast from 'react-hot-toast'
import { Zap, Building, User, Mail, Lock } from 'lucide-react'
import styles from '../auth.module.css'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ firm_name: '', name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res = await authApi.register(form)
      setToken(res.data.access_token)
      const me = await authApi.me()
      setUser(me.data)
      toast.success('Welcome to CAFlow! 🎉')
      router.replace('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}><Zap size={20} /></div>
          <span className={styles.logoText}>CAFlow</span>
        </div>
        <h1 className={styles.title}>Create your firm account</h1>
        <p className={styles.subtitle}>Start managing your CA practice in minutes</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Firm Name *</label>
            <div style={{ position: 'relative' }}>
              <Building size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="firm-name-input" className="form-input" required
                style={{ paddingLeft: 36 }}
                value={form.firm_name} onChange={e => setForm({ ...form, firm_name: e.target.value })}
                placeholder="e.g. Sharma & Associates" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Your Name *</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="name-input" className="form-input" required
                style={{ paddingLeft: 36 }}
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Full name" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Work Email *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="email-input" className="form-input" type="email" required
                style={{ paddingLeft: 36 }}
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@yourfirm.com" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="password-input" className="form-input" type="password" required minLength={8}
                style={{ paddingLeft: 36 }}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 8 characters" />
            </div>
          </div>
          <button id="register-btn" type="submit" className="btn btn-primary w-full" style={{ padding: '12px', fontSize: 14 }} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Creating account…</> : 'Create Firm Account'}
          </button>
        </form>

        <div className={styles.footer}>
          Already have an account? <Link href="/login" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
