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
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor - Brutalist Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="w-full max-w-[480px] z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 rounded-none bg-blue-600 flex items-center justify-center text-white shadow-none border border-white/10 group cursor-default">
            <Building className="h-8 w-8 group-hover:scale-110 transition-transform" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">CAFlow</h1>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] ml-1">New Practice Initialization</p>
          </div>
        </div>

        <div className="bg-white rounded-none p-10 space-y-8 shadow-none border-t-4 border-blue-600">
          <div className="space-y-2 text-center border-b border-slate-100 pb-6">
             <h2 className="text-2xl font-black text-[#0f172a] tracking-tight uppercase">Firm Registration</h2>
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Establish your statutory identity in minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Statutory Firm Name *</label>
              <div className="relative group">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  required
                  placeholder="e.g. Sharma & Associates"
                  className="w-full h-12 bg-white border border-slate-200 rounded-none pl-12 pr-4 text-sm font-black focus:outline-none focus:border-blue-600 transition-all text-[#0f172a] placeholder:text-slate-200 uppercase"
                  value={form.firm_name}
                  onChange={e => setForm({ ...form, firm_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Practitioner Name *</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                        <input 
                        required
                        placeholder="Your Name"
                        className="w-full h-12 bg-white border border-slate-200 rounded-none pl-12 pr-4 text-sm font-black focus:outline-none focus:border-blue-600 transition-all text-[#0f172a] placeholder:text-slate-200 uppercase"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Work Email *</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                        <input 
                        type="email"
                        required
                        placeholder="you@firm.com"
                        className="w-full h-12 bg-white border border-slate-200 rounded-none pl-12 pr-4 text-sm font-black focus:outline-none focus:border-blue-600 transition-all text-[#0f172a] placeholder:text-slate-200 uppercase"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Terminal Passphrase *</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="password" 
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full h-12 bg-white border border-slate-200 rounded-none pl-12 pr-4 text-sm font-black focus:outline-none focus:border-blue-600 transition-all text-[#0f172a] placeholder:text-slate-200"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-[#0f172a] text-white rounded-none font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 shadow-none transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {loading ? 'Initializing Practice...' : 'Authorize Firm Creation'}
              {!loading && <Zap className="h-3.5 w-3.5 fill-current" />}
            </button>
          </form>

          <div className="text-center pt-2">
             <Link href="/login" className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                Already registered? <span className="underline underline-offset-4 text-blue-600">Enter Terminal</span>
             </Link>
          </div>
        </div>

        <div className="text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-50">By initializing, you agree to CAFlow's Statutory Master Service Protocols</p>
        </div>
      </div>
    </div>
  )
}
