'use client'
import { useState, useEffect } from 'react'
import { timesheetsApi, clientsApi, tasksApi } from '@/lib/api'
import { format } from 'date-fns'
import { 
  Plus, Clock, Search, Filter, MoreHorizontal, 
  Trash2, Edit2, CheckCircle2, AlertCircle,
  Calendar as CalendarIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export default function TimesheetsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<any>(null)

  // Form State
  const [newLog, setNewLog] = useState({
    client_id: '',
    task_id: '',
    start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    duration_hours: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [lRes, cRes, tRes] = await Promise.all([
        timesheetsApi.myLogs(),
        clientsApi.list(),
        tasksApi.list()
      ])
      setLogs(lRes.data)
      setClients(cRes.data.items || [])
      setTasks(tRes.data.items || [])
    } catch (err) {
      console.error("Failed to fetch timesheets:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await timesheetsApi.create({
        ...newLog,
        duration_hours: parseFloat(newLog.duration_hours)
      })
      setIsAddOpen(false)
      fetchData()
      setNewLog({
        client_id: '',
        task_id: '',
        start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        duration_hours: '',
        notes: ''
      })
    } catch (err) {
      console.error("Failed to create log:", err)
    }
  }

  const openEdit = (log: any) => {
    setEditingLog({
      id: log.id,
      client_id: log.client_id || '',
      task_id: log.task_id || '',
      start_time: format(new Date(log.start_time), "yyyy-MM-dd'T'HH:mm"),
      duration_hours: String(log.duration_hours || ''),
      notes: log.notes || ''
    })
    setIsEditOpen(true)
  }

  const handleEdit = async () => {
    if (!editingLog) return
    try {
      await timesheetsApi.update(editingLog.id, {
        client_id: editingLog.client_id || null,
        task_id: editingLog.task_id || null,
        start_time: editingLog.start_time,
        duration_hours: parseFloat(editingLog.duration_hours),
        notes: editingLog.notes
      })
      setIsEditOpen(false)
      setEditingLog(null)
      fetchData()
    } catch (err) {
      console.error("Failed to update log:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this log?")) return
    try {
      await timesheetsApi.delete(id)
      fetchData()
    } catch (err) {
      console.error("Failed to delete log:", err)
    }
  }

  const totalHours = logs.reduce((acc, log) => acc + (log.duration_hours || 0), 0)
  const todayHours = logs
    .filter(log => format(new Date(log.start_time), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
    .reduce((acc, log) => acc + (log.duration_hours || 0), 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">TimeSheet</h1>
          <p className="text-muted-foreground">Log and track your billable hours.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Log Time
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Work Hours</DialogTitle>
              <DialogDescription>Record time spent on a client or task.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="client">Client</Label>
                <Select onValueChange={(val) => setNewLog({...newLog, client_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task">Task (Optional)</Label>
                <Select onValueChange={(val) => setNewLog({...newLog, task_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Task" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start">Date & Time</Label>
                  <Input 
                    type="datetime-local" 
                    id="start" 
                    value={newLog.start_time}
                    onChange={(e) => setNewLog({...newLog, start_time: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hours">Hours</Label>
                  <Input 
                    type="number" 
                    step="0.5" 
                    id="hours" 
                    placeholder="e.g. 1.5"
                    value={newLog.duration_hours}
                    onChange={(e) => setNewLog({...newLog, duration_hours: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="What did you work on?" 
                  value={newLog.notes}
                  onChange={(e) => setNewLog({...newLog, notes: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Save Log</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Today's Total</p>
                <p className="text-3xl font-bold">{todayHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Weekly Total</p>
                <p className="text-3xl font-bold">{totalHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Entries</p>
                <p className="text-3xl font-bold">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Recent Logs</CardTitle>
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search logs..." className="pl-9 h-9 w-[200px] lg:w-[300px]" />
             </div>
             <Button variant="outline" size="icon" className="h-9 w-9">
                <Filter className="h-4 w-4" />
             </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                       <span className="animate-pulse">Loading logs...</span>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                       No time logs found. Start by clicking "Log Time".
                    </TableCell>
                  </TableRow>
                ) : logs.map((log) => (
                  <TableRow key={log.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {format(new Date(log.start_time), 'dd MMM, yyyy')}
                    </TableCell>
                    <TableCell>{log.client_name || '—'}</TableCell>
                    <TableCell>
                      {log.task_title ? (
                         <Badge variant="outline" className="font-normal text-xs">{log.task_title}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                       <span className="font-semibold text-primary">{log.duration_hours}h</span>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground italic">
                      {log.notes || 'No notes'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => openEdit(log)}>
                             <Edit2 className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(log.id)}>
                             <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Log</DialogTitle>
            <DialogDescription>Update the details for this time entry.</DialogDescription>
          </DialogHeader>
          {editingLog && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Client</Label>
                <Select value={editingLog.client_id} onValueChange={(val) => setEditingLog({...editingLog, client_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Select Client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Task (Optional)</Label>
                <Select value={editingLog.task_id} onValueChange={(val) => setEditingLog({...editingLog, task_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Select Task" /></SelectTrigger>
                  <SelectContent>
                    {tasks.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={editingLog.start_time}
                    onChange={(e) => setEditingLog({...editingLog, start_time: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editingLog.duration_hours}
                    onChange={(e) => setEditingLog({...editingLog, duration_hours: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Textarea
                  value={editingLog.notes}
                  onChange={(e) => setEditingLog({...editingLog, notes: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
