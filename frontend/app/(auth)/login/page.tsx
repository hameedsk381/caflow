'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { setToken, setUser } from '@/lib/auth'
import toast from 'react-hot-toast'
import { Zap, Mail, Lock, ArrowRight, ShieldCheck, Crown } from 'lucide-react'

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
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-[460px] z-10 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="h-16 w-16 rounded-[22px] bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 transform rotate-3 hover:rotate-0 transition-transform cursor-default">
            <Crown className="h-8 w-8 fill-current" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">CAFlow</h1>
            <div className="flex items-center gap-2 justify-center">
                <span className="h-[1px] w-4 bg-slate-700" />
                <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">Enterprise Practice Management</p>
                <span className="h-[1px] w-4 bg-slate-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-10 space-y-8 shadow-2xl shadow-black/50 border border-white/10">
          <div className="space-y-2">
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">Login to Terminal</h2>
             <p className="text-sm text-slate-500 font-medium">Access your firm's compliance data and clients.</p>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100/50">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                System Simulation Credentials
            </p>
            <div className="space-y-1.5 text-xs font-bold text-slate-700">
                <p>U: <span className="text-blue-700">admin@caflow.demo</span></p>
                <p>P: <span className="text-blue-700">demo1234</span></p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Terminal ID</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="email" 
                  required
                  placeholder="name@firm.com"
                  className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 text-[15px] font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Secure Access Token</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 text-[15px] font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-[15px] flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Authorize Access'}
              {!loading && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>

          <div className="text-center pt-2">
             <Link href="/register" className="text-xs font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-tight">
                New practice? <span className="underline decoration-2 underline-offset-4 decoration-blue-200 hover:decoration-blue-600">Register Firm</span>
             </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[10px] font-black text-slate-500 uppercase tracking-widest pt-4">
            <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-blue-500" />
                <span>End-to-End Encryption</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                <span>Practice Secure</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-amber-500" />
                <span>Audit Compliant</span>
            </div>
        </div>
      </div>
    </div>
  )
}
