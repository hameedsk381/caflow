'use client'
import { useState, useEffect, cloneElement, ReactElement } from 'react'
import { dashboardApi } from '@/lib/api'
import type { DashboardStats } from '@/types'
import {
  Users, ShieldCheck, AlertCircle, CheckSquare,
  TrendingUp, FileText, Clock, Activity, Calendar,
  ArrowRight, Sparkles, TrendingDown, ChevronRight,
  Briefcase, Landmark, Zap, Scale, Layers, Gavel,
  BarChart3, PieChart as PieChartIcon, Target,
  DollarSign, Percent, ArrowUpRight, ArrowDownRight,
  Terminal, Plus
} from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area, Legend
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [deadlines, setDeadlines] = useState<any[]>([])
  const [compliance, setCompliance] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [salesData, setSalesData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardApi.stats(),
      dashboardApi.upcomingDeadlines(),
      dashboardApi.complianceSummary(),
      dashboardApi.recentActivity(),
      dashboardApi.salesData(),
    ]).then(([s, d, c, a, sd]) => {
      setStats(s.data)
      setDeadlines(d.data.deadlines || [])
      setCompliance(c.data)
      setActivity(a.data.items || [])
      setSalesData(sd.data)
    }).finally(() => setLoading(false))
  }, [])

  const pieData = compliance ? [
    { name: 'ACTIVE', value: compliance.in_progress || 5, color: '#3b82f6' },
    { name: 'CERTIFIED', value: compliance.filed || 12, color: '#10b981' },
    { name: 'PLANNING', value: compliance.pending || 8, color: '#6366f1' },
    { name: 'OVERDUE', value: compliance.overdue || 2, color: '#ef4444' },
  ] : []

  // Forensic Financial Trend (Mocking based on stats)
  const trendData = [
    { name: 'Jan', revenue: 45, projected: 40 },
    { name: 'Feb', revenue: 52, projected: 45 },
    { name: 'Mar', revenue: 85, projected: 80 },
    { name: 'Apr', revenue: 62, projected: 70 },
    { name: 'May', revenue: (stats?.total_revenue || 0) / 1000, projected: 90 },
  ]

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
         <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-slate-100 border-t-blue-600" />
         <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 animate-pulse" />
      </div>
      <div className="text-center">
         <span className="text-slate-900 text-sm font-black uppercase tracking-[0.2em] block">Initializing Command Center</span>
         <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Synchronizing Practice-Wide Metrics…</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Precision Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
              <Badge className="bg-[#0f172a] text-blue-400 border-none text-[8px] font-black uppercase tracking-[0.2em] px-2 h-5 rounded-none">FIRM COMMAND CENTER v2.0</Badge>
              <div className="h-1 w-1 rounded-none bg-slate-300" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight tabular-nums">{format(new Date(), 'EEEE, dd MMMM yyyy').toUpperCase()}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
             Executive Summary
             <div className="h-1.5 w-1.5 rounded-none bg-emerald-500 animate-pulse" />
          </h1>
        </div>

        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-10 px-4 border-slate-200 text-[11px] font-black uppercase tracking-wider group rounded-none shadow-none">
              <Clock className="h-3.5 w-3.5 mr-2 text-slate-400 group-hover:text-blue-600" />
              Realization Matrix
           </Button>
           <Button className="h-10 px-5 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider rounded-none shadow-none hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Initialize Mandate
           </Button>
        </div>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-2">
           <TabsList className="h-11 bg-slate-100/50 border border-slate-200 p-1 rounded-none">
             <TabsTrigger value="insights" className="text-[10px] font-black uppercase tracking-[0.1em] px-8 data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none shadow-none">
                <Activity className="h-3.5 w-3.5 mr-2" /> Forensic Insights
             </TabsTrigger>
             <TabsTrigger value="financials" className="text-[10px] font-black uppercase tracking-[0.1em] px-8 data-[state=active]:bg-white data-[state=active]:text-emerald-600 rounded-none shadow-none">
                <Landmark className="h-3.5 w-3.5 mr-2" /> Practice Financials
             </TabsTrigger>
           </TabsList>

           <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                 {[1,2,3].map(i => (
                    <div key={i} className="h-7 w-7 rounded-none bg-slate-200 border border-white flex items-center justify-center text-[9px] font-black text-slate-600">P{i}</div>
                 ))}
                 <div className="h-7 w-7 rounded-none bg-blue-600 border border-white flex items-center justify-center text-[9px] font-black text-white">+6</div>
              </div>
              <div className="h-8 w-[1px] bg-slate-200" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Practitioner <br/>Bandwidth</p>
           </div>
        </div>

        <TabsContent value="insights" className="space-y-6 mt-0 shadow-none">
          {/* Forensic High-Level Analytics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ForensicStatCard label="Active Assessees" value={stats?.total_clients || 0} icon={<Briefcase />} trend="+12% YoY" color="blue" />
            <ForensicStatCard label="Certification Rate" value={`${compliance ? Math.round((compliance.filed / (compliance.total || 1)) * 100) : 0}%`} icon={<ShieldCheck />} trend="+3.2% MoM" color="emerald" />
            <ForensicStatCard label="Notices Under Scrutiny" value={stats?.overdue_notices !== undefined ? (stats.overdue_notices + (stats.open_notices || 0)) : 0} icon={<Gavel />} trend="Legal Focus" color="indigo" />
            <ForensicStatCard label="Statutory Risk" value={(stats?.overdue_compliance || 0) + (stats?.overdue_notices || 0)} icon={<Scale />} trend="Action Req." color="rose" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
             {/* Regulatory Heatmap (Chart) */}
             <Card className="rounded-none border-slate-200 bg-white shadow-none overflow-hidden flex flex-col xl:col-span-2">
                <CardHeader className="p-5 pb-0 bg-slate-50/50 flex flex-row items-center justify-between border-b border-slate-100">
                   <div>
                      <CardTitle className="text-[11px] font-black uppercase tracking-widest text-[#0f172a]">Regulatory Density Heatmap</CardTitle>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Assignment Load vs. Statutory Deadlines</p>
                   </div>
                   <div className="flex gap-2">
                      <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-none bg-blue-600" /><span className="text-[8px] font-black text-slate-500 uppercase">GST</span></div>
                      <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-none bg-emerald-500" /><span className="text-[8px] font-black text-slate-500 uppercase">ITR</span></div>
                   </div>
                </CardHeader>
                <CardContent className="p-6 pt-8 flex-1">
                   <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="k" />
                        <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: 11, fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" animationDuration={1500} />
                        <Area type="monotone" dataKey="projected" stroke="#94a3b8" strokeWidth={1} strokeDasharray="5 5" fillOpacity={0} animationDuration={1500} />
                      </AreaChart>
                   </ResponsiveContainer>
                </CardContent>
             </Card>

             {/* Mandate Composition */}
             <Card className="rounded-none border-slate-200 bg-white shadow-none overflow-hidden">
                <CardHeader className="p-5 pb-0 bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-[#0f172a]">Assessee Lifecycle</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="relative h-[200px] flex items-center justify-center">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={0} strokeWidth={1} stroke="#fff">
                             {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                           </Pie>
                           <Tooltip contentStyle={{ borderRadius: 0, fontSize: 10, fontWeight: 'bold' }} />
                         </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                          <p className="text-3xl font-black text-[#0f172a] tracking-tighter tabular-nums">{compliance?.total || 40}</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mandates</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-6 border-t border-slate-100 pt-5">
                       {pieData.map((d) => (
                          <div key={d.name} className="flex flex-col gap-0.5 group cursor-default">
                             <div className="flex items-center gap-1.5">
                                <div style={{ background: d.color }} className="h-1.5 w-1.5 rounded-none" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-slate-900 transition-colors">{d.name}</span>
                             </div>
                             <span className="text-lg font-black text-[#0f172a] ml-3 tabular-nums">{d.value}</span>
                          </div>
                       ))}
                    </div>
                </CardContent>
             </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
             {/* Critical Queue */}
             <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                   <h2 className="text-[11px] font-black text-[#0f172a] uppercase tracking-[0.2em] flex items-center gap-2">
                       <AlertCircle className="h-4 w-4 text-rose-500" />
                       High-Criticality Queue
                   </h2>
                   <Button variant="link" className="text-[10px] font-black uppercase tracking-widest text-blue-600 h-auto p-0 group rounded-none">
                      Full Manifest <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                   </Button>
                </div>
                <div className="grid gap-0">
                    {deadlines.slice(0, 4).map((d: any) => {
                       const isDangerous = d.days_remaining <= 3;
                       return (
                        <div key={d.id} className={`group flex items-center justify-between p-3.5 bg-white border-x border-b first:border-t transition-all ${isDangerous ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-none flex flex-col items-center justify-center font-black transition-all ${isDangerous ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-[#0f172a] group-hover:text-white'}`}>
                                   <span className="text-[8px] uppercase tracking-tighter leading-none opacity-60 mb-0.5">{format(new Date(d.due_date), 'MMM')}</span>
                                   <span className="text-sm leading-none tabular-nums font-black">{format(new Date(d.due_date), 'dd')}</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-black text-[#0f172a] truncate tracking-tight uppercase">{d.client_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                       <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-bold border-slate-200 text-slate-500 uppercase rounded-none"> {d.type}</Badge>
                                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">• {d.period || 'MTD'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                               <span className={`text-[12px] font-black tabular-nums ${isDangerous ? 'text-rose-600' : 'text-slate-900'}`}>{d.days_remaining}D</span>
                               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Left</span>
                            </div>
                        </div>
                    )})}
                </div>
             </div>

             {/* Forensic Activity Stream */}
             <div className="space-y-4">
                <h2 className="text-[11px] font-black text-[#0f172a] uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                   <Terminal className="h-4 w-4 text-slate-400" />
                   Practice Pulse Stream
                </h2>
                <div className="bg-white rounded-none border border-slate-200 shadow-none overflow-hidden flex flex-col">
                   <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Latest System Operations</span>
                      <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 bg-emerald-500 rounded-none animate-pulse" /><span className="text-[8px] font-bold text-slate-500 uppercase">Live Feed</span></div>
                   </div>
                   <div className="divide-y divide-slate-100">
                      {activity.slice(0, 6).map((a: any) => (
                          <div key={a.id} className="flex gap-4 p-3.5 items-start hover:bg-slate-50/80 group transition-colors cursor-default">
                              <div className="text-[9px] font-black text-slate-300 group-hover:text-blue-500 uppercase w-12 pt-1 tabular-nums transition-colors">{format(new Date(a.created_at || new Date()), 'HH:mm:ss')}</div>
                              <div className="flex-1">
                                  <p className="text-[12px] font-medium leading-normal text-slate-600 flex flex-wrap gap-x-1 gap-y-0.5 items-center">
                                      <span className="font-black text-[#0f172a] uppercase tracking-tight">{a.actor_name}</span> 
                                      <span className="text-[10px] font-bold text-slate-400 italic lowercase">{a.action}</span> 
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px] font-black border-none h-5 px-1.5 hover:bg-blue-100 transition-colors rounded-none">{a.entity_name || a.entity_type}</Badge>
                                  </p>
                              </div>
                              <ChevronRight className="h-3 w-3 text-slate-200 group-hover:text-blue-200 transition-colors mt-1" />
                          </div>
                      ))}
                   </div>
                   <Button variant="ghost" className="h-10 w-full rounded-none text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-blue-600 border-t border-slate-100">
                      View System Audit Trail
                   </Button>
                </div>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="financials" className="mt-0 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-slate-200">
              <FinancialSummaryCard label="Total Revenue (AR)" value={`₹${((stats?.total_revenue || 0) / 1000).toFixed(0)}K`} trend="+₹12K this week" status="up" />
              <FinancialSummaryCard label="Realization Rate" value="94.2%" trend="Exceeding Target" status="up" />
              <FinancialSummaryCard label="WIP Value" value="₹128K" trend="Unbilled Mandates" status="neutral" />
              <FinancialSummaryCard label="Outstanding" value={`₹${((stats?.total_outstanding || 0) / 1000).toFixed(0)}K`} trend="-4.1% Collections" status="down" />
           </div>

           <Card className="rounded-none bg-[#0f172a] text-white p-8 relative overflow-hidden group border-none shadow-none">
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                       <Line type="monotone" dataKey="revenue" stroke="#fff" strokeWidth={10} dot={false} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Practice Financial Velocity</p>
                       <h3 className="text-4xl font-black tracking-tighter">Forensic Realization Index</h3>
                    </div>
                    <Button variant="outline" className="h-10 border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 hover:text-white border-blue-500/30 rounded-none">
                       Full Realization Report
                    </Button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                    <div>
                       <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Invoiced (MTD)</p>
                       <p className="text-3xl font-black tabular-nums">₹42.5K</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Collections (MTD)</p>
                       <p className="text-3xl font-black tabular-nums">₹38.2K</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Realization Variance</p>
                       <p className="text-3xl font-black text-emerald-400 tabular-nums">+4.3%</p>
                    </div>
                 </div>

                 <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                    <p className="text-[10px] font-medium text-slate-400 max-w-sm">
                       Practice financials are synchronized with the timesheet engine and invoice catalog. Variance reflects a positive realization of professional mandates.
                    </p>
                    <div className="flex items-center gap-4">
                       <div className="text-right">
                          <p className="text-[9px] font-black uppercase text-slate-500">Last Synced</p>
                          <p className="text-[10px] font-bold">2 minutes ago</p>
                       </div>
                       <Zap className="h-5 w-5 text-blue-500 animate-pulse" />
                    </div>
                 </div>
              </div>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ForensicStatCard({ label, value, icon, trend, color }: { label: string, value: any, icon: any, trend: string, color: 'blue' | 'emerald' | 'indigo' | 'rose' }) {
   const styles = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-400', iconBg: 'bg-blue-50/50' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-400', iconBg: 'bg-emerald-50/50' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-400', iconBg: 'bg-indigo-50/50' },
      rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-400', iconBg: 'bg-rose-50/50' }
   }
   const s = styles[color];

   return (
      <Card className={`rounded-none border border-slate-200 bg-white shadow-none transition-all duration-300 group hover:border-slate-900 overflow-hidden`}>
         <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
               <div className={`h-11 w-11 rounded-none flex items-center justify-center transition-colors group-hover:bg-slate-900 group-hover:text-white duration-500 ${s.bg}`}>
                  {cloneElement(icon as ReactElement, { className: `h-5 w-5 ${s.text} group-hover:text-white` })}
               </div>
               <Badge variant="outline" className={`bg-transparent border-none text-[9px] font-black uppercase tracking-tighter ${s.text} rounded-none`}>
                  {trend}
               </Badge>
            </div>
            <h3 className="text-4xl font-black tracking-tighter text-[#0f172a] tabular-nums mb-1">{value}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
         </CardContent>
      </Card>
   )
}

function FinancialSummaryCard({ label, value, trend, status }: { label: string, value: string, trend: string, status: 'up' | 'down' | 'neutral' }) {
   return (
      <Card className="rounded-none border-r border-b border-slate-200 bg-white p-5 shadow-none group hover:bg-slate-50 transition-colors">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
         <div className="flex items-end justify-between">
            <h4 className="text-2xl font-black text-[#0f172a] tabular-nums">{value}</h4>
            <div className="flex items-center gap-1">
               {status === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
               {status === 'down' && <ArrowDownRight className="h-3 w-3 text-rose-500" />}
               <span className={`text-[10px] font-black tabular-nums ${status === 'up' ? 'text-emerald-600' : status === 'down' ? 'text-rose-600' : 'text-slate-500'}`}>
                  {trend}
               </span>
            </div>
         </div>
      </Card>
   )
}
