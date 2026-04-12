'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'
import {
  LayoutDashboard, Users, ShieldCheck, CheckSquare,
  FolderOpen, Receipt, UserCog, Settings, LogOut, Zap
} from 'lucide-react'
import { clearToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'

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

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    clearToken()
    router.replace('/login')
  }

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Zap size={18} />
        </div>
        <span className={styles.logoText}>CAFlow</span>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navSection}>
          <span className={styles.navSectionLabel}>Main</span>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} className={`${styles.navItem} ${active ? styles.active : ''}`}>
                <div className={styles.navIcon}>
                  <Icon size={17} />
                </div>
                <span className={styles.navLabel}>{label}</span>
                {active && <div className={styles.activeIndicator} />}
              </Link>
            )
          })}
        </div>

        <div className={styles.navSection}>
          <span className={styles.navSectionLabel}>Account</span>
          <Link href="/settings" className={`${styles.navItem} ${pathname === '/settings' ? styles.active : ''}`}>
            <div className={styles.navIcon}><Settings size={17} /></div>
            <span className={styles.navLabel}>Settings</span>
          </Link>
          <button className={styles.navItem} onClick={handleLogout}>
            <div className={styles.navIcon}><LogOut size={17} /></div>
            <span className={styles.navLabel}>Logout</span>
          </button>
        </div>
      </nav>

      {/* Bottom badge */}
      <div className={styles.bottomBadge}>
        <div className={styles.planBadge}>
          <Zap size={12} />
          <span>Pro Plan</span>
        </div>
      </div>
    </aside>
  )
}
