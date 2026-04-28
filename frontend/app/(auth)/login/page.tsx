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
      {/* Background Decor - Brutalist Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="w-full max-w-[440px] z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/20 border border-white/10 p-2 bg-slate-900/50 backdrop-blur-sm">
            <img src="/branding/logo.png" alt="CAFlow" className="h-full w-full object-contain" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">CAFlow</h1>
            <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] ml-1">Self-Healing Compliance Terminal</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-10 space-y-8 shadow-2xl shadow-black/50 border-t-4 border-cyan-400 overflow-hidden">
          <div className="space-y-2">
             <h2 className="text-2xl font-black text-[#0f172a] tracking-tight uppercase">Terminal Access</h2>
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Authorized Practitioner Authentication Required</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-[9px] font-black text-[#0f172a] uppercase tracking-widest mb-3 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-600" />
                Auth Simulation (Demo)
            </p>
            <div className="space-y-1.5 text-[11px] font-black text-slate-700 uppercase tracking-tight">
                <p>Identity: <span className="text-cyan-600">admin@caflow.demo</span></p>
                <p>Passphrase: <span className="text-cyan-600">demo1234</span></p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Practitioner ID (Email)</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-cyan-600 transition-colors" />
                <input 
                  type="email" 
                  required
                  placeholder="name@firm.com"
                  className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-12 pr-4 text-sm font-black focus:outline-none focus:border-cyan-600 transition-all text-[#0f172a] placeholder:text-slate-300 uppercase"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Secure Passphrase</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-cyan-600 transition-colors" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-12 pr-4 text-sm font-black focus:outline-none focus:border-cyan-600 transition-all text-[#0f172a] placeholder:text-slate-300"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-[#0f172a] text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 shadow-xl shadow-cyan-500/10 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Authorize Terminal Access'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="text-center pt-2">
             <Link href="/register" className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                New Practice Integration? <span className="underline underline-offset-4 text-blue-600">Register Firm</span>
             </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 pt-4">
            <div className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white/5 border border-white/5 text-center">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">AES-256</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white/5 border border-white/5 text-center">
                <Zap className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fast-Sync</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white/5 border border-white/5 text-center">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Enterprise</span>
            </div>
        </div>
      </div>
    </div>
  )
}
