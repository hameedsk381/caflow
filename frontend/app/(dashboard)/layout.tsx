'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getUser, setUser } from '@/lib/auth'
import { authApi } from '@/lib/api'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import styles from './layout.module.css'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }
    // Refresh user info
    authApi.me().then((res) => {
      setUser(res.data)
    }).catch(() => {
      router.replace('/login')
    })
  }, [router])

  if (!isAuthenticated()) return null

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  )
}
