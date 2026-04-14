'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { setToken, setUser } from '@/lib/auth'
import toast from 'react-hot-toast'
import { Zap, Mail, Lock } from 'lucide-react'
import styles from '../auth.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login(form)
      setToken(res.data.access_token)
      const me = await authApi.me()
      setUser(me.data)
      toast.success('Welcome back!')
      router.replace('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}><Zap size={20} /></div>
          <span className={styles.logoText}>CAFlow</span>
        </div>
        <h1 className={styles.title}>Sign in to your account</h1>
        <p className={styles.subtitle}>Practice management for Chartered Accountants</p>

        {/* Demo credentials box */}
        <div style={{ background: 'var(--accent-glow)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 24, fontSize: 13 }}>
          <div style={{ fontWeight: 600, color: 'var(--accent-light)', marginBottom: 6 }}>🎯 Demo Credentials</div>
          <div style={{ color: 'var(--text-secondary)' }}>Email: <code style={{ color: 'var(--text-primary)' }}>admin@caflow.demo</code></div>
          <div style={{ color: 'var(--text-secondary)' }}>Password: <code style={{ color: 'var(--text-primary)' }}>demo1234</code></div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="text-sm font-medium leading-none mb-2 block text-foreground">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="email-input" className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="email" required
                style={{ paddingLeft: 36 }}
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="admin@caflow.demo" />
            </div>
          </div>
          <div className="form-group">
            <label className="text-sm font-medium leading-none mb-2 block text-foreground">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="password-input" className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="password" required
                style={{ paddingLeft: 36 }}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" />
            </div>
          </div>
          <button id="login-btn" type="submit" className="btn btn-primary w-full" style={{ padding: '12px', fontSize: 14, marginTop: 4 }} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          Don't have an account? <Link href="/register" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>Create firm account</Link>
        </div>
      </div>
    </div>
  )
}
