'use client'
import { useState, useEffect } from 'react'
import { dashboardApi } from '@/lib/api'
import type { DashboardStats } from '@/types'
import {
  Users, ShieldCheck, AlertCircle, CheckSquare,
  TrendingUp, FileText, Clock, Activity
} from 'lucide-react'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <span className="text-muted-foreground text-sm">Loading dashboard…</span>
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] md:text-[40px] font-semibold tracking-vercel-display text-foreground leading-[1.20]">Dashboard</h1>
        <p className="text-muted-foreground text-[14px] md:text-[16px]">Welcome back! Here's what's happening at your firm.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard icon={<Users className="text-indigo-500" />} label="Total Clients" value={stats?.total_clients || 0} />
        <StatCard icon={<Users className="text-blue-500" />} label="Total Leads" value={stats?.total_leads || 0} />
        <StatCard icon={<ShieldCheck className="text-amber-500" />} label="Pending Compliance" value={stats?.pending_compliance || 0} />
        <StatCard icon={<AlertCircle className="text-red-500" />} label="Overdue Items" value={stats?.overdue_compliance || 0} />
        <StatCard icon={<CheckSquare className="text-blue-500" />} label="Open Tasks" value={stats?.open_tasks || 0} />
        <StatCard icon={<CheckSquare className="text-emerald-500" />} label="Active Services" value={stats?.active_services || 0} />
        <StatCard icon={<TrendingUp className="text-emerald-500" />} label="Revenue Collected" value={`₹${((stats?.total_revenue || 0) / 1000).toFixed(0)}K`} isText />
        <StatCard icon={<FileText className="text-purple-500" />} label="Pending Invoices" value={stats?.pending_invoices || 0} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Compliance Pie */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
          {pieData.reduce((a, b) => a + b.value, 0) > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-4">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <div style={{ background: d.color }} className="w-2 h-2 rounded-sm" />
                    <span>{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">No compliance data</div>
          )}
          </CardContent>
        </Card>

        {/* Upcoming deadlines bar chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Upcoming Deadlines (days)</CardTitle>
          </CardHeader>
          <CardContent>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 0, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="days" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">No upcoming deadlines</div>
          )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines Table */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-base font-semibold">Upcoming Deadlines</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
          {deadlines.length === 0 ? (
            <div className="text-sm text-muted-foreground p-8 text-center rounded-md shadow-vercel border-dashed border-border border">No upcoming deadlines in next 30 days</div>
          ) : (
            <div className="rounded-lg shadow-vercel overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deadlines.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.client_name}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-medium text-xs">{d.type}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{d.period || '—'}</TableCell>
                      <TableCell>{format(new Date(d.due_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${d.days_remaining <= 3 ? 'text-red-500' : d.days_remaining <= 7 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {d.days_remaining}d
                        </span>
                      </TableCell>
                      <TableCell><StatusBadge status={d.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
          {activity.length === 0 ? (
            <div className="text-sm text-muted-foreground">No recent activity</div>
          ) : (
            <div className="space-y-4">
              {activity.map((a: any) => (
                <div key={a.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      <span className="text-primary">{a.actor_name}</span> {a.action} {a.entity_type}
                    </p>
                    {a.entity_name && (
                      <p className="text-xs text-muted-foreground">{a.entity_name}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(a.created_at), 'dd MMM, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, isText }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            {icon}
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-[28px] md:text-[32px] tracking-vercel-section leading-none">{isText ? value : value.toLocaleString()}</h3>
            <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: 'secondary',
    in_progress: 'default',
    filed: 'outline',
    overdue: 'destructive'
  }
  
  return <Badge variant={map[status] || 'secondary'} className="capitalize">{status?.replace('_', ' ')}</Badge>
}
