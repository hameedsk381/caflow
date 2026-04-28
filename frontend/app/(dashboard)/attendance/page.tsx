'use client'
import { useState, useEffect, useCallback } from 'react'
import { attendanceApi, leaveApi } from '@/lib/api'
import type { AttendanceLog, LeaveRequest } from '@/types/index'
import { 
  MapPin, Clock, LogIn, LogOut, Navigation,
  History, Calendar, CheckCircle2, AlertCircle, 
  Loader2, Plus, User, ShieldCheck,
  Check, X, MoreVertical, FileText, Briefcase
} from 'lucide-react'
import { format, isPast, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState('attendance')
  const [status, setStatus] = useState<AttendanceLog | null>(null)
  const [history, setHistory] = useState<AttendanceLog[]>([])
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([])
  const [firmLeaves, setFirmLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [workType, setWorkType] = useState('Internal')
  const [notes, setNotes] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Leave Form
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'casual',
    from_date: format(new Date(), 'yyyy-MM-dd'),
    to_date: format(new Date(), 'yyyy-MM-dd'),
    reason: ''
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, hRes, lRes] = await Promise.all([
        attendanceApi.status(),
        attendanceApi.history(),
        leaveApi.myRequests()
      ])
      setStatus(sRes.data)
      setHistory(hRes.data)
      setMyLeaves(lRes.data)
      
      // Try fetching firm requests to check admin status
      try {
        const flRes = await leaveApi.firmRequests()
        setFirmLeaves(flRes.data)
        setIsAdmin(true)
      } catch {
        setIsAdmin(false)
      }
    } catch (err) {
      toast.error('Failed to sync attendance data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({lat: pos.coords.latitude, lng: pos.coords.longitude}),
        () => console.log("Location access denied")
      )
    }
  }, [fetchData])

  const handleCheckIn = async () => {
    setActionLoading(true)
    try {
      const res = await attendanceApi.checkIn({
        lat: location?.lat,
        lng: location?.lng,
        work_location_type: workType,
        notes: notes
      })
      toast.success('Check-in successful')
      setStatus(res.data)
      fetchData()
      setNotes('')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Check-in failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setActionLoading(true)
    try {
      const res = await attendanceApi.checkOut({
        lat: location?.lat,
        lng: location?.lng,
        notes: notes
      })
      toast.success('Check-out successful')
      setStatus(res.data)
      fetchData()
      setNotes('')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Check-out failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await leaveApi.apply(leaveForm)
      toast.success('Leave application submitted')
      setShowLeaveModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit leave')
    }
  }

  const handleApproveLeave = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await leaveApi.approve(id, status)
      toast.success(`Leave ${status}`)
      fetchData()
    } catch {
      toast.error('Action failed')
    }
  }

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">Staff Desk</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Attendance, Leave & Performance Tracking</p>
        </div>
        
        <div className="flex items-center gap-3">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Today</span>
                <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{format(new Date(), 'EEEE, dd MMM')}</span>
             </div>
             <div className="h-8 w-px bg-slate-200" />
             <div className="text-2xl font-black tracking-tighter text-blue-600 tabular-nums leading-none">
                {currentTime}
             </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-none h-12 w-full md:w-auto border border-slate-200 shadow-sm">
          <TabsTrigger value="attendance" className="rounded-none px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#0f172a] data-[state=active]:text-white">Attendance</TabsTrigger>
          <TabsTrigger value="leave" className="rounded-none px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#0f172a] data-[state=active]:text-white">Leave Requests</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin" className="rounded-none px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#0f172a] data-[state=active]:text-white">Admin Console</TabsTrigger>}
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Check-In Console */}
             <Card className="lg:col-span-1 border-slate-200 shadow-none rounded-none bg-white">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-slate-600">
                        <Clock className="h-4 w-4" /> Shift Control
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 space-y-6">
                   <div className="space-y-4">
                      {!status?.check_in && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Working Location</label>
                            <Select value={workType} onValueChange={setWorkType}>
                                <SelectTrigger className="h-10 font-bold text-xs rounded-none border-slate-200 uppercase">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-none">
                                    <SelectItem value="Internal" className="rounded-none">🏢 Office (Internal)</SelectItem>
                                    <SelectItem value="Client Visit" className="rounded-none">🚗 Client Office / Field</SelectItem>
                                    <SelectItem value="Home" className="rounded-none">🏠 Work from Home</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                      )}
                      
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Log Notes (Optional)</label>
                         <Input placeholder="Work update..." className="h-10 font-bold text-xs rounded-none border-slate-200 uppercase" value={notes} onChange={(e) => setNotes(e.target.value)} />
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-none">
                         {location ? (
                            <>
                                <MapPin className="h-4 w-4 text-emerald-600" />
                                <span className="text-[9px] font-black uppercase text-slate-600 tracking-tight leading-tight">GPS Tracking Active: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                            </>
                         ) : (
                            <>
                                <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-tight leading-tight">Establishing GPS Signal...</span>
                            </>
                         )}
                      </div>

                      {!status?.check_in ? (
                        <Button className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] gap-3 bg-blue-600 hover:bg-blue-700 rounded-none shadow-none" onClick={handleCheckIn} disabled={actionLoading || !location}>
                            {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                            Check In
                        </Button>
                      ) : !status?.check_out ? (
                        <div className="space-y-3">
                           <div className="p-4 bg-emerald-50 border border-emerald-100 text-center">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Shift</p>
                                <p className="text-2xl font-black text-emerald-700 tabular-nums mt-1">{format(new Date(status.check_in!), 'hh:mm a')}</p>
                           </div>
                           <Button className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] gap-3 bg-rose-600 hover:bg-rose-700 rounded-none shadow-none" onClick={handleCheckOut} disabled={actionLoading}>
                                {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
                                Check Out
                           </Button>
                        </div>
                      ) : (
                        <div className="p-8 bg-slate-50 border border-slate-200 border-dashed text-center space-y-3">
                           <div className="h-12 w-12 bg-emerald-100 rounded-none flex items-center justify-center mx-auto">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                           </div>
                           <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Daily Log Complete</p>
                           <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed px-4">Shift recorded for {format(new Date(), 'dd MMM')}. Good work today!</p>
                        </div>
                      )}
                   </div>
                </CardContent>
             </Card>

             {/* Recent History Table */}
             <Card className="lg:col-span-2 border-slate-200 shadow-none rounded-none bg-white">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-slate-600">
                        <History className="h-4 w-4" /> Performance Log
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="h-12 hover:bg-transparent border-none">
                                <TableHead className="px-6 font-black text-[10px] uppercase text-slate-500">Date</TableHead>
                                <TableHead className="px-6 font-black text-[10px] uppercase text-slate-500">Log Type</TableHead>
                                <TableHead className="px-6 font-black text-[10px] uppercase text-slate-500 text-center">In / Out</TableHead>
                                <TableHead className="px-6 font-black text-[10px] uppercase text-slate-500 text-right">Duration</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} className="h-40 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Syncing logs...</TableCell></TableRow>
                            ) : history.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="h-40 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">No logs found</TableCell></TableRow>
                            ) : history.map((h) => {
                                const duration = h.check_out && h.check_in ? 
                                    (new Date(h.check_out).getTime() - new Date(h.check_in).getTime()) / (1000 * 60 * 60) : 0
                                
                                return (
                                    <TableRow key={h.id} className="h-16 border-slate-50 border-b hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="px-6">
                                            <span className="font-black text-[11px] text-slate-900 uppercase tracking-tight">{format(new Date(h.date), 'dd MMM yyyy')}</span>
                                        </TableCell>
                                        <TableCell className="px-6">
                                            <Badge variant="outline" className="rounded-none border-slate-200 text-[9px] font-black uppercase tracking-widest">{h.work_location_type}</Badge>
                                        </TableCell>
                                        <TableCell className="px-6">
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">In</span>
                                                    <span className="text-[11px] font-black text-emerald-600 tabular-nums">{h.check_in ? format(new Date(h.check_in), 'hh:mm a') : '--:--'}</span>
                                                </div>
                                                <div className="h-4 w-px bg-slate-200" />
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Out</span>
                                                    <span className="text-[11px] font-black text-rose-600 tabular-nums">{h.check_out ? format(new Date(h.check_out), 'hh:mm a') : '--:--'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 text-right">
                                            <span className="font-black text-sm text-slate-900 tabular-nums tracking-tighter">
                                                {duration > 0 ? `${duration.toFixed(1)}h` : '--'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
          </div>
        </TabsContent>

        {/* Leave Tab */}
        <TabsContent value="leave" className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Personal Leave Tracker</h2>
                <Button className="h-10 px-6 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none" onClick={() => setShowLeaveModal(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Apply For Leave
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-slate-200 shadow-none rounded-none bg-white">
                    <CardContent className="p-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Approved</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{myLeaves.filter(l => l.status === 'approved').length}</p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-none rounded-none bg-white">
                    <CardContent className="p-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending Requests</p>
                        <p className="text-2xl font-black text-amber-600 mt-1">{myLeaves.filter(l => l.status === 'pending').length}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 shadow-none rounded-none bg-white overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="h-12 hover:bg-transparent border-none">
                                <TableHead className="px-6 font-black text-[10px] uppercase text-slate-500">Period</TableHead>
                                <TableHead className="px-6 font-black text-[10px] uppercase text-slate-500">Type</TableHead>
                                <TableHead className="px-6 font-black text-[10px] uppercase text-slate-500">Reason</TableHead>
                                <TableHead className="px-6 font-black text-[10px] uppercase text-slate-500">Status</TableHead>
                                <TableHead className="px-6 w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {myLeaves.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-32 text-center text-[10px] font-black uppercase text-slate-300">No leave requests found</TableCell></TableRow>
                            ) : myLeaves.map((l) => (
                                <TableRow key={l.id} className="h-16 border-slate-50 border-b hover:bg-slate-50/50">
                                    <TableCell className="px-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-[11px] text-slate-900 uppercase">
                                                {format(new Date(l.from_date), 'dd MMM')} — {format(new Date(l.to_date), 'dd MMM yyyy')}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                                                {differenceInDays(new Date(l.to_date), new Date(l.from_date)) + 1} Days
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <Badge variant="outline" className="rounded-none border-slate-200 text-[9px] font-black uppercase">{l.leave_type}</Badge>
                                    </TableCell>
                                    <TableCell className="px-6 max-w-[240px]">
                                        <p className="text-[11px] font-black text-slate-500 uppercase truncate">{l.reason || 'No reason specified'}</p>
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <Badge className={`rounded-none text-[9px] font-black uppercase shadow-none ${
                                            l.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                            l.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {l.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6">
                                        {l.status === 'pending' && (
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50" onClick={async () => {
                                                if(confirm('Cancel this request?')) {
                                                    await leaveApi.delete(l.id)
                                                    fetchData()
                                                }
                                            }}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        {/* Admin Console */}
        {isAdmin && (
            <TabsContent value="admin" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-slate-200 shadow-none rounded-none bg-white">
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 flex items-center justify-between">
                                Pending Approvals
                                <Badge className="bg-amber-500 text-white rounded-none border-none text-[9px] font-black">{firmLeaves.filter(l => l.status === 'pending').length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableBody>
                                    {firmLeaves.filter(l => l.status === 'pending').length === 0 ? (
                                        <TableRow><TableCell className="h-32 text-center text-[10px] font-black uppercase text-slate-300">All caught up!</TableCell></TableRow>
                                    ) : firmLeaves.filter(l => l.status === 'pending').map((l) => (
                                        <TableRow key={l.id} className="border-slate-50 border-b">
                                            <TableCell className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-blue-600 flex items-center justify-center text-white text-[10px] font-black uppercase">{l.user_name?.substring(0,2)}</div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-slate-900 uppercase">{l.user_name}</span>
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase">{l.leave_type} | {format(new Date(l.from_date), 'dd MMM')} - {format(new Date(l.to_date), 'dd MMM')}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4 text-right space-x-1">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50" onClick={() => handleApproveLeave(l.id, 'approved')}><Check className="h-4 w-4" /></Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50" onClick={() => handleApproveLeave(l.id, 'rejected')}><X className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-none rounded-none bg-white">
                         <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">
                                Team Snapshot (Today)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                             <div className="p-4 bg-slate-50 border border-slate-100">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Office Presence</p>
                                 <p className="text-xl font-black text-slate-900 mt-1">High (85%)</p>
                             </div>
                             <div className="space-y-2">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">On Leave Today</p>
                                 <div className="flex flex-wrap gap-2">
                                     {firmLeaves.filter(l => l.status === 'approved' && isPast(new Date(l.from_date)) && !isPast(new Date(l.to_date))).length === 0 ? (
                                         <span className="text-[10px] font-black text-slate-300 uppercase italic">None</span>
                                     ) : firmLeaves.filter(l => l.status === 'approved' && isPast(new Date(l.from_date)) && !isPast(new Date(l.to_date))).map(l => (
                                         <Badge key={l.id} variant="secondary" className="rounded-none bg-slate-100 text-slate-600 text-[9px] font-black uppercase">{l.user_name}</Badge>
                                     ))}
                                 </div>
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        )}
      </Tabs>

      {/* Leave Apply Modal */}
      {showLeaveModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-none flex items-center justify-center p-4">
            <Card className="max-w-md w-full rounded-none border border-slate-300 shadow-none relative bg-white overflow-hidden">
                <CardHeader className="bg-[#0f172a] text-white p-4 px-6">
                    <CardTitle className="text-sm font-black tracking-widest flex items-center justify-between uppercase">
                        Apply For Leave
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/10 rounded-none" onClick={() => setShowLeaveModal(false)}>✕</Button>
                    </CardTitle>
                </CardHeader>
                <form onSubmit={handleApplyLeave}>
                    <div className="p-6 space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Leave Type</label>
                            <Select value={leaveForm.leave_type} onValueChange={val => setLeaveForm({...leaveForm, leave_type: val})}>
                                <SelectTrigger className="h-10 font-bold text-xs rounded-none border-slate-200 uppercase"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-none">
                                    <SelectItem value="casual" className="rounded-none uppercase">Casual Leave</SelectItem>
                                    <SelectItem value="sick" className="rounded-none uppercase">Sick Leave</SelectItem>
                                    <SelectItem value="annual" className="rounded-none uppercase">Annual Leave</SelectItem>
                                    <SelectItem value="wfh" className="rounded-none uppercase">Work From Home</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">From Date</label>
                                <Input required type="date" className="h-10 font-black text-xs rounded-none border-slate-200 uppercase" value={leaveForm.from_date} onChange={e => setLeaveForm({...leaveForm, from_date: e.target.value})} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">To Date</label>
                                <Input required type="date" className="h-10 font-black text-xs rounded-none border-slate-200 uppercase" value={leaveForm.to_date} onChange={e => setLeaveForm({...leaveForm, to_date: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reason / Notes</label>
                            <textarea className="flex min-h-[80px] w-full rounded-none border border-slate-200 bg-transparent px-3 py-2 text-[11px] font-black uppercase shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} placeholder="Reason for leave..." />
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2">
                        <Button variant="ghost" type="button" className="h-10 px-6 text-[10px] font-black uppercase rounded-none" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
                        <Button type="submit" className="h-10 px-8 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none">Submit Request</Button>
                    </div>
                </form>
            </Card>
          </div>
      )}
    </div>
  )
}
