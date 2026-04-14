'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getUser, setUser } from '@/lib/auth'
import { authApi } from '@/lib/api'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in transition-opacity"
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      
      <div className="flex-1 flex flex-col min-h-screen md:ml-64 transition-all duration-300 relative z-10 w-full overflow-hidden">
        <Topbar title="" onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
