'use client'
import { useState, useEffect } from 'react'
import { dashboardApi } from '@/lib/api'
import type { DashboardStats } from '@/types'
import {
  Users, ShieldCheck, AlertCircle, CheckSquare,
  TrendingUp, FileText, Clock, Activity
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [deadlines, setDeadlines] = useState<any[]>([])
  const [compliance, setCompliance] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardApi.stats(),
      dashboardApi.upcomingDeadlines(),
      dashboardApi.complianceSummary(),
      dashboardApi.recentActivity(),
    ]).then(([s, d, c, a]) => {
      setStats(s.data)
      setDeadlines(d.data.deadlines || [])
      setCompliance(c.data)
      setActivity(a.data.items || [])
    }).finally(() => setLoading(false))
  }, [])

  const pieData = compliance ? [
    { name: 'Pending', value: compliance.pending, color: '#f59e0b' },
    { name: 'In Progress', value: compliance.in_progress, color: '#3b82f6' },
    { name: 'Filed', value: compliance.filed, color: '#10b981' },
    { name: 'Overdue', value: compliance.overdue, color: '#ef4444' },
  ] : []

  const barData = deadlines.slice(0, 6).map((d: any) => ({
    name: `${d.type} - ${d.client_name?.split(' ')[0]}`,
    days: d.days_remaining,
  }))

  if (loading) return (
    <div className="loading-screen" style={{ minHeight: 'auto', padding: 80 }}>
      <div className="spinner" /><span className="text-muted">Loading dashboard…</span>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening at your firm.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon={<Users size={20} />} label="Total Clients" value={stats?.total_clients || 0} color="#6366f1" />
        <StatCard icon={<Users size={20} />} label="Total Leads" value={stats?.total_leads || 0} color="#3b82f6" />
        <StatCard icon={<ShieldCheck size={20} />} label="Pending Compliance" value={stats?.pending_compliance || 0} color="#f59e0b" />
        <StatCard icon={<AlertCircle size={20} />} label="Overdue Items" value={stats?.overdue_compliance || 0} color="#ef4444" />
        <StatCard icon={<AlertCircle size={20} />} label="Overdue Notices" value={stats?.overdue_notices || 0} color="#dc2626" />
        <StatCard icon={<CheckSquare size={20} />} label="Open Tasks" value={stats?.open_tasks || 0} color="#3b82f6" />
        <StatCard icon={<CheckSquare size={20} />} label="Active Services" value={stats?.active_services || 0} color="#10b981" />
        <StatCard icon={<TrendingUp size={20} />} label="Revenue Collected" value={`₹${((stats?.total_revenue || 0) / 1000).toFixed(0)}K`} color="#10b981" isText />
        <StatCard icon={<FileText size={20} />} label="Pending Invoices" value={stats?.pending_invoices || 0} color="#8b5cf6" />
        <StatCard icon={<FileText size={20} />} label="Total Registers" value={stats?.total_registers || 0} color="#6366f1" />
      </div>

      {/* Charts Row */}
      <div className="flex gap-6" style={{ marginBottom: 28 }}>
        {/* Compliance Pie */}
        <div className="card" style={{ flex: '0 0 300px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Compliance Status</h3>
          {pieData.reduce((a, b) => a + b.value, 0) > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#101e35', border: '1px solid #1a2d4a', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                    <span>{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 24 }}><p>No compliance data yet</p></div>
          )}
        </div>

        {/* Upcoming deadlines bar chart */}
        <div className="card" style={{ flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Upcoming Deadlines (days)</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: '#101e35', border: '1px solid #1a2d4a', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="days" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 24 }}><p>No upcoming deadlines</p></div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="flex gap-6">
        {/* Upcoming Deadlines Table */}
        <div className="card" style={{ flex: 1 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <Clock size={16} style={{ color: 'var(--warning)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Upcoming Deadlines</h3>
          </div>
          {deadlines.length === 0 ? (
            <div className="empty-state"><p>No upcoming deadlines in next 30 days</p></div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead><tr>
                  <th>Client</th><th>Type</th><th>Period</th><th>Due Date</th><th>Days Left</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {deadlines.map((d: any) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.client_name}</td>
                      <td><span className="badge badge-accent">{d.type}</span></td>
                      <td>{d.period || '—'}</td>
                      <td>{format(new Date(d.due_date), 'dd MMM yyyy')}</td>
                      <td>
                        <span style={{ color: d.days_remaining <= 3 ? 'var(--danger)' : d.days_remaining <= 7 ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>
                          {d.days_remaining}d
                        </span>
                      </td>
                      <td><StatusBadge status={d.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ flex: '0 0 320px' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <Activity size={16} style={{ color: 'var(--accent-light)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Activity</h3>
          </div>
          {activity.length === 0 ? (
            <div className="empty-state"><p>No recent activity</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {activity.map((a: any) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Activity size={13} style={{ color: 'var(--accent-light)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--accent-light)' }}>{a.actor_name}</span> {a.action} {a.entity_type}
                    </div>
                    {a.entity_name && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.entity_name}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {format(new Date(a.created_at), 'dd MMM, h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, isText }: any) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: color + '18' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="stat-card-value">{isText ? value : value.toLocaleString()}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'badge-warning', in_progress: 'badge-info',
    filed: 'badge-success', overdue: 'badge-danger'
  }
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status?.replace('_', ' ')}</span>
}
