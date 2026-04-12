'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '@/lib/auth'

export default function HomePage() {
  const router = useRouter()
  useEffect(() => {
    const token = getToken()
    if (token) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [router])

  return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 32, height: 32 }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading CAFlow…</span>
    </div>
  )
}
