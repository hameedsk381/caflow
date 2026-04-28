'use client'
import { useState, useEffect } from 'react'
import { activityLogsApi } from '@/lib/api'
import { 
  Search, Filter, Calendar, User, 
  Database, Info, ChevronLeft, ChevronRight,
  Terminal, ShieldCheck, Zap, AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    page: 1,
    entity_type: '',
    action: '',
    search: ''
  })

  useEffect(() => {
    fetchLogs()
  }, [filters.page, filters.entity_type, filters.action])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await activityLogsApi.list({
        ...filters,
        page_size: 20
      })
      setLogs(res.data.items)
      setTotal(res.data.total)
    } catch (err) {
      console.error("Failed to fetch logs:", err)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    const a = action.toLowerCase()
    if (a.includes('create') || a.includes('add')) return 'bg-emerald-100 text-emerald-700'
    if (a.includes('delete') || a.includes('remove')) return 'bg-rose-100 text-rose-700'
    if (a.includes('update') || a.includes('edit')) return 'bg-blue-100 text-blue-700'
    if (a.includes('reveal')) return 'bg-amber-100 text-amber-700'
    return 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">Audit Trail</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Immutable log of practice activity</p>
        </div>
        
        <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-8 rounded-none border-slate-200 px-3 text-[10px] font-black uppercase tracking-widest bg-white">
                <Database className="h-3 w-3 mr-2 text-blue-600" /> {total} Total Events
            </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-none border-slate-200 shadow-none bg-slate-50/50">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                    placeholder="Search logs..." 
                    className="pl-9 h-10 rounded-none border-slate-200 text-xs font-bold uppercase tracking-tight"
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
            </div>
            
            <Select value={filters.entity_type} onValueChange={(v) => setFilters({...filters, entity_type: v, page: 1})}>
                <SelectTrigger className="h-10 rounded-none border-slate-200 text-xs font-bold uppercase">
                    <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="client">Clients</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="task">Tasks</SelectItem>
                    <SelectItem value="vault">Password Vault</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
            </Select>

            <Select value={filters.action} onValueChange={(v) => setFilters({...filters, action: v, page: 1})}>
                <SelectTrigger className="h-10 rounded-none border-slate-200 text-xs font-bold uppercase">
                    <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Created</SelectItem>
                    <SelectItem value="update">Updated</SelectItem>
                    <SelectItem value="delete">Deleted</SelectItem>
                    <SelectItem value="reveal">Revealed (Secret)</SelectItem>
                </SelectContent>
            </Select>

            <Button className="h-10 bg-[#0f172a] text-white rounded-none text-[10px] font-black uppercase tracking-widest shadow-none" onClick={() => fetchLogs()}>
                <Filter className="h-3.5 w-3.5 mr-2" /> Apply Filters
            </Button>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="rounded-none border-slate-200 shadow-none bg-white overflow-hidden">
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow className="h-12 hover:bg-transparent border-none">
                        <TableHead className="px-6 font-black text-[10px] uppercase text-slate-500">Timestamp</TableHead>
                        <TableHead className="px-6 font-black text-[10px] uppercase text-slate-500">User</TableHead>
                        <TableHead className="px-6 font-black text-[10px] uppercase text-slate-500">Action</TableHead>
                        <TableHead className="px-6 font-black text-[10px] uppercase text-slate-500">Entity</TableHead>
                        <TableHead className="px-6 font-black text-[10px] uppercase text-slate-500 text-right">Reference</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={5} className="h-64 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Scanning audit logs...</TableCell></TableRow>
                    ) : logs.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-64 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">No events recorded</TableCell></TableRow>
                    ) : logs.map((log) => (
                        <TableRow key={log.id} className="h-16 border-slate-50 border-b hover:bg-slate-50 transition-colors">
                            <TableCell className="px-6">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-slate-900 tabular-nums">{format(new Date(log.created_at), 'dd MMM HH:mm:ss')}</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{format(new Date(log.created_at), 'yyyy')}</span>
                                </div>
                            </TableCell>
                            <TableCell className="px-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-7 w-7 rounded-none bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-600 border border-slate-200 uppercase">{log.actor_name.substring(0,2)}</div>
                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{log.actor_name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="px-6">
                                <Badge className={`rounded-none border-none text-[9px] font-black uppercase tracking-widest shadow-none ${getActionColor(log.action)}`}>
                                    {log.action}
                                </Badge>
                            </TableCell>
                            <TableCell className="px-6">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{log.entity_type}</span>
                                    {log.entity_name && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 truncate max-w-[150px]">{log.entity_name}</span>}
                                </div>
                            </TableCell>
                            <TableCell className="px-6 text-right">
                                <span className="text-[10px] font-black text-slate-400 tabular-nums">ID: {log.id.substring(0,8)}</span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Showing {(filters.page - 1) * 20 + 1} - {Math.min(filters.page * 20, total)} of {total}
                </p>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-none border-slate-200" 
                        disabled={filters.page === 1}
                        onClick={() => setFilters({...filters, page: filters.page - 1})}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-none border-slate-200"
                        disabled={filters.page * 20 >= total}
                        onClick={() => setFilters({...filters, page: filters.page + 1})}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
