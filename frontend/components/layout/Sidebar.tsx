'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, ShieldCheck, CheckSquare,
  FolderOpen, Receipt, UserCog, Settings, LogOut, Zap,
  Clock, Calendar, Sparkles, Files, ClipboardList, MessageSquare,
  ShieldAlert, BookOpen, Crown
} from 'lucide-react'
import { clearToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/attendance', label: 'Attendance', icon: Calendar },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/timesheets', label: 'Timesheets', icon: Clock },
  { href: '/leads', label: 'Leads', icon: Sparkles },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/services', label: 'Services', icon: BookOpen },
  { href: '/compliance', label: 'Compliance', icon: ShieldCheck },
  { href: '/notices', label: 'Notices', icon: Files },
  { href: '/dsc', label: 'DSC Register', icon: ShieldAlert },
  { href: '/passwords', label: 'Password Vault', icon: Zap },
  { href: '/registers/licenses', label: 'Licenses', icon: ShieldCheck },
  { href: '/registers/documents', label: 'Documents', icon: ClipboardList },
  { href: '/communications', label: 'Communications', icon: MessageSquare },
  { href: '/registers', label: 'Registers', icon: FolderOpen },
  { href: '/billing', label: 'Billing', icon: Receipt },
  { href: '/team', label: 'Team', icon: UserCog },
  { href: '/logs', label: 'Audit Logs', icon: ClipboardList },
]

export default function Sidebar({ isOpen = false, onClose = () => {} }: { isOpen?: boolean, onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    clearToken()
    router.replace('/login')
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-slate-800 bg-[#0f172a] text-slate-300 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Logo Section */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 px-5 bg-slate-900/50">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-blue-500/20">
          <img src="/branding/logo.png" alt="CAFlow Logo" className="h-full w-full object-cover scale-110" />
        </div>
        <div className="flex flex-col">
            <span className="text-sm font-black tracking-tighter text-white uppercase italic leading-none">CAFlow</span>
            <span className="text-[8px] font-black text-cyan-400/80 uppercase tracking-[0.2em] leading-tight">Compliance</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6 scrollbar-hide">
        <div className="flex flex-col gap-0.5">
          <span className="px-3 pb-1.5 text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] opacity-80">Workspace</span>
          {navItems.slice(0, 11).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all group ${
                  active 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400 transition-colors'}`} />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="px-3 pb-1.5 text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] opacity-80">Tools</span>
          {navItems.slice(11).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all group ${
                  active 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400 transition-colors'}`} />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="flex flex-col gap-0.5 pt-2">
          <span className="px-3 pb-1.5 text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] opacity-80">Settings</span>
          <Link href="/settings" onClick={onClose}
            className={`flex items-center gap-3 rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all ${
              pathname === '/settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-1.5 text-[12px] font-bold text-slate-400 transition-all hover:bg-rose-500/10 hover:text-rose-400 w-full text-left"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white">SA</div>
            <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-100 truncate">Sharma & Assoc.</span>
                <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">Enterprise</span>
            </div>
        </div>
      </div>
    </aside>
  )
}
