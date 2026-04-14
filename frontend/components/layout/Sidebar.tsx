'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, ShieldCheck, CheckSquare,
  FolderOpen, Receipt, UserCog, Settings, LogOut, Zap
} from 'lucide-react'
import { clearToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: FolderOpen },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/services', label: 'Services', icon: FolderOpen },
  { href: '/compliance', label: 'Compliance', icon: ShieldCheck },
  { href: '/notices', label: 'Notices', icon: ShieldCheck },
  { href: '/registers', label: 'Registers', icon: FolderOpen },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
  { href: '/billing', label: 'Billing', icon: Receipt },
  { href: '/team', label: 'Team', icon: UserCog },
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
      className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
          <Zap className="h-4 w-4" />
        </div>
        <span className="text-base font-semibold tracking-tight">CAFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        <div className="flex flex-col gap-1">
          <span className="px-3 pb-2 text-xs font-medium uppercase text-muted-foreground tracking-wider">Main</span>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} onClick={onClose}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-secondary text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary/50 hover:text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="flex flex-col gap-1">
          <span className="px-3 pb-2 text-xs font-medium uppercase text-muted-foreground tracking-wider">Account</span>
          <Link href="/settings" onClick={onClose}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname === '/settings' ? 'bg-secondary text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary/50 hover:text-primary'
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive w-full text-left"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </nav>

      {/* Bottom Badge */}
      <div className="border-t p-4">
        <div className="flex items-center justify-center gap-2 rounded-md border bg-card px-3 py-2 shadow-sm">
          <Zap className="h-3 w-3 text-primary" />
          <span className="text-xs font-medium text-primary">Pro Plan</span>
        </div>
      </div>
    </aside>
  )
}
