'use client'
import { useState, useEffect } from 'react'
import { attendanceApi } from '@/lib/api'
import { format } from 'date-fns'
import {
  MapPin, Clock, LogIn, LogOut, Navigation,
  History, Calendar, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function AttendancePage() {
  const [status, setStatus] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [workType, setWorkType] = useState('Internal')
  const [notes, setNotes] = useState('')
  const [isMonthOpen, setIsMonthOpen] = useState(false)
  const [monthlyLogs, setMonthlyLogs] = useState<any[]>([])
  const [monthlyLoading, setMonthlyLoading] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })

  useEffect(() => {
    fetchInitialData()
    // Get geolocation if supported
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({lat: pos.coords.latitude, lng: pos.coords.longitude})
      })
    }
  }, [])

  const openMonthView = async (year: number, month: number) => {
    setIsMonthOpen(true)
    setMonthlyLoading(true)
    try {
      const res = await attendanceApi.monthlyHistory(year, month)
      setMonthlyLogs(res.data)
    } catch (err) {
      console.error("Failed to fetch monthly history:", err)
    } finally {
      setMonthlyLoading(false)
    }
  }

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [sRes, hRes] = await Promise.all([
        attendanceApi.status(),
        attendanceApi.history()
      ])
      setStatus(sRes.data)
      setHistory(hRes.data)
    } catch (err) {
      console.error("Failed to fetch attendance data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setActionLoading(true)
    try {
      const res = await attendanceApi.checkIn({
        lat: location?.lat,
        lng: location?.lng,
        work_location_type: workType,
        notes: notes
      })
      setStatus(res.data)
      fetchInitialData()
      setNotes('')
    } catch (err) {
      console.error("Check-in failed:", err)
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
      setStatus(res.data)
      fetchInitialData()
      setNotes('')
    } catch (err) {
      console.error("Check-out failed:", err)
    } finally {
      setActionLoading(false)
    }
  }

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Log your daily presence and check-ins.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full border">
           <Clock className="h-4 w-4 text-primary" />
           <span className="text-sm font-semibold">{format(new Date(), 'EEEE, dd MMMM yyyy')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Check-In Card */}
        <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              {status?.check_in && !status?.check_out ? <Navigation className="h-5 w-5 text-primary animate-pulse" /> : <Clock className="h-5 w-5 text-primary" />}
              Work Console
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-6 bg-white rounded-2xl border shadow-sm">
                <p className="text-5xl font-bold tracking-tighter text-slate-800">{currentTime}</p>
                <p className="text-sm text-muted-foreground mt-1">Current Time</p>
            </div>

            <div className="space-y-4">
               {!status?.check_in && (
                 <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Working From</Label>
                        <Select value={workType} onValueChange={setWorkType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Internal">Office (Internal)</SelectItem>
                                <SelectItem value="Client Visit">Client Office / Field</SelectItem>
                                <SelectItem value="Home">Work from Home</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
               )}
               
               <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input placeholder="What's for today?" value={notes} onChange={(e) => setNotes(e.target.value)} />
               </div>

               {location ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded">
                     <MapPin className="h-3 w-3" />
                     Location verified: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
               ) : (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded">
                     <Loader2 className="h-3 w-3 animate-spin" />
                     Fetching location...
                  </div>
               )}

               {!status?.check_in ? (
                 <Button className="w-full h-14 text-lg gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleCheckIn} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                    Check In
                 </Button>
               ) : !status?.check_out ? (
                 <Button className="w-full h-14 text-lg gap-2 bg-rose-600 hover:bg-rose-700" onClick={handleCheckOut} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
                    Check Out
                 </Button>
               ) : (
                 <div className="p-4 bg-slate-100 rounded-xl border border-dotted text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                    <p className="font-semibold">Shift Completed!</p>
                    <p className="text-xs text-muted-foreground">Great work today. You've logged your shift.</p>
                 </div>
               )}
            </div>

            {status?.check_in && (
               <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t">
                  <div className="space-y-1">
                     <p className="text-xs text-muted-foreground uppercase">Started at</p>
                     <p className="font-bold">{format(new Date(status.check_in), 'hh:mm a')}</p>
                  </div>
                  {status.check_out && (
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase">Finished at</p>
                        <p className="font-bold">{format(new Date(status.check_out), 'hh:mm a')}</p>
                    </div>
                  )}
               </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card className="lg:col-span-2">
           <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                 <History className="h-5 w-5 text-muted-foreground" />
                 Recent History
              </CardTitle>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => openMonthView(viewMonth.year, viewMonth.month)}>
                 <Calendar className="h-4 w-4" /> Full Month
              </Button>
           </CardHeader>
           <CardContent>
              <div className="rounded-lg border overflow-hidden">
                 <Table>
                    <TableHeader className="bg-muted/50">
                       <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>In</TableHead>
                          <TableHead>Out</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {loading ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-20 animate-pulse">Syncing logs...</TableCell></TableRow>
                       ) : history.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No attendance records found.</TableCell></TableRow>
                       ) : history.map((h) => {
                          const duration = h.check_out && h.check_in ? 
                            (new Date(h.check_out).getTime() - new Date(h.check_in).getTime()) / (1000 * 60 * 60) : 0
                          
                          return (
                            <TableRow key={h.id}>
                               <TableCell className="font-medium">{format(new Date(h.date), 'dd MMM yyyy')}</TableCell>
                               <TableCell>
                                  <Badge variant="outline" className="font-normal">{h.work_location_type}</Badge>
                               </TableCell>
                               <TableCell className="text-emerald-600 font-medium">
                                  {h.check_in ? format(new Date(h.check_in), 'hh:mm a') : '—'}
                               </TableCell>
                               <TableCell className="text-rose-600 font-medium">
                                  {h.check_out ? format(new Date(h.check_out), 'hh:mm a') : '—'}
                               </TableCell>
                               <TableCell className="font-semibold">
                                  {duration > 0 ? `${duration.toFixed(1)}h` : '—'}
                               </TableCell>
                               <TableCell>
                                  {h.check_out ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Completed</Badge>
                                  ) : (
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">On Duty</Badge>
                                  )}
                               </TableCell>
                            </TableRow>
                          )
                       })}
                    </TableBody>
                 </Table>
              </div>
           </CardContent>
        </Card>
      </div>

      <Dialog open={isMonthOpen} onOpenChange={setIsMonthOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {new Date(viewMonth.year, viewMonth.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })} — Full Attendance
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-2">
            <Select value={String(viewMonth.month)} onValueChange={(v) => {
              const updated = { ...viewMonth, month: Number(v) }
              setViewMonth(updated)
              openMonthView(updated.year, updated.month)
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              className="w-[100px]"
              value={viewMonth.year}
              onChange={(e) => {
                const updated = { ...viewMonth, year: Number(e.target.value) }
                setViewMonth(updated)
              }}
              onBlur={() => openMonthView(viewMonth.year, viewMonth.month)}
            />
          </div>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>In</TableHead>
                  <TableHead>Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 animate-pulse">Loading...</TableCell></TableRow>
                ) : monthlyLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No records for this month.</TableCell></TableRow>
                ) : monthlyLogs.map((h) => {
                  const duration = h.check_out && h.check_in
                    ? (new Date(h.check_out).getTime() - new Date(h.check_in).getTime()) / (1000 * 60 * 60)
                    : 0
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{format(new Date(h.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell><Badge variant="outline" className="font-normal">{h.work_location_type}</Badge></TableCell>
                      <TableCell className="text-emerald-600 font-medium">{h.check_in ? format(new Date(h.check_in), 'hh:mm a') : '—'}</TableCell>
                      <TableCell className="text-rose-600 font-medium">{h.check_out ? format(new Date(h.check_out), 'hh:mm a') : '—'}</TableCell>
                      <TableCell className="font-semibold">{duration > 0 ? `${duration.toFixed(1)}h` : '—'}</TableCell>
                      <TableCell>
                        {h.check_out
                          ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Completed</Badge>
                          : <Badge className="bg-blue-100 text-blue-700 border-blue-200">On Duty</Badge>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
