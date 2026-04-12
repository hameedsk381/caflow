'use client'
import { useState, useEffect, useRef } from 'react'
import styles from './Topbar.module.css'
import { Bell, Search, ChevronDown, User, LogOut } from 'lucide-react'
import { getUser, clearToken } from '@/lib/auth'
import { notificationsApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import type { Notification } from '@/types'

export default function Topbar({ title }: { title?: string }) {
  const router = useRouter()
  const user = getUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    notificationsApi.list({ size: 8 }).then((res) => {
      setNotifications(res.data.items || [])
      setUnreadCount(res.data.unread_count || 0)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { clearToken(); router.replace('/login') }

  const initials = user?.profile?.name
    ? user.profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {title && <h1 className={styles.title}>{title}</h1>}
      </div>

      <div className={styles.right}>
        {/* Notifications */}
        <div className={styles.iconWrapper} ref={notifsRef}>
          <button
            className={styles.iconBtn}
            onClick={() => setShowNotifs(!showNotifs)}
            id="notifications-btn"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>

          {showNotifs && (
            <div className={styles.dropdown} style={{ width: 340 }}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownTitle}>Notifications</span>
                {unreadCount > 0 && (
                  <button className={styles.markAll} onClick={() => {
                    notificationsApi.markAllRead()
                    setNotifications(n => n.map(x => ({ ...x, is_read: true })))
                    setUnreadCount(0)
                  }}>Mark all read</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className={styles.empty}>No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`${styles.notifItem} ${!n.is_read ? styles.unread : ''}`}>
                    <div className={styles.notifDot} style={{ background: n.type === 'warning' ? 'var(--warning)' : n.type === 'reminder' ? 'var(--accent)' : 'var(--info)' }} />
                    <div>
                      <div className={styles.notifTitle}>{n.title}</div>
                      {n.message && <div className={styles.notifMsg}>{n.message}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className={styles.iconWrapper} ref={userMenuRef}>
          <button
            className={styles.userBtn}
            onClick={() => setShowUserMenu(!showUserMenu)}
            id="user-menu-btn"
          >
            <div className="avatar">{initials}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.profile?.name || user?.email}</span>
              <span className={styles.userRole}>{user?.role?.replace('_', ' ')}</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {showUserMenu && (
            <div className={styles.dropdown} style={{ right: 0, width: 200 }}>
              <button className={styles.menuItem} onClick={() => { router.push('/settings'); setShowUserMenu(false) }}>
                <User size={14} /> Profile & Settings
              </button>
              <div className={styles.divider} />
              <button className={styles.menuItem} style={{ color: 'var(--danger)' }} onClick={handleLogout}>
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
