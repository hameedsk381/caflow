'use client'
import { useState, useEffect } from 'react'
import { communicationApi, clientsApi } from '@/lib/api'
import { format } from 'date-fns'
import { 
  Send, MessageSquare, Mail, History, 
  Plus, Search, Layout, CheckCircle2, 
  Settings2, Copy, Trash2, Clock,
  Smartphone, Globe, Shovel, Share2,
  Calendar, FileText, UserPlus, Zap,
  AlertCircle, ChevronRight, Bookmark,
  MoreVertical, Edit3, Terminal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import toast from 'react-hot-toast'

export default function CommunicationDashboard() {
  const [activeTab, setActiveTab] = useState('logs')
  const [templates, setTemplates] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false)
  const [isSendMessageOpen, setIsSendMessageOpen] = useState(false)
  
  // Form States
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    channel: 'whatsapp',
    subject: '',
    body: ''
  })
  
  const [sendMessageForm, setSendMessageForm] = useState({
    client_id: '',
    template_id: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tRes, lRes, cRes] = await Promise.all([
        communicationApi.listTemplates(),
        communicationApi.listLogs(),
        clientsApi.list({ size: 100 })
      ])
      setTemplates(tRes.data)
      setLogs(lRes.data)
      setClients(cRes.data.items || [])
    } catch (err) {
      console.error("Failed to fetch liaison data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      await communicationApi.createTemplate(newTemplate)
      setIsAddTemplateOpen(false)
      fetchData()
      toast.success("Liaison framework saved!")
    } catch (err) {
      toast.error("Failed to archive template")
    }
  }

  const handleSendMessage = async () => {
    try {
      await communicationApi.sendMessage(sendMessageForm)
      setIsSendMessageOpen(false)
      fetchData()
      toast.success("Professional broadcast dispatched!")
    } catch (err) {
      toast.error("Liaison failed to synchronize")
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Professional Liaison Hub</h1>
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-200 text-slate-500 rounded-none">Multichannel Correspondence</Badge>
             <div className="h-1 w-1 rounded-none bg-slate-300" />
             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">System Online & Synchronized</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsAddTemplateOpen(true)} className="h-9 px-4 text-[11px] font-black uppercase tracking-wider border-slate-200 rounded-none shadow-none">
                <Layout className="h-3.5 w-3.5 mr-2" />
                Liaison Frameworks
            </Button>

            <Button onClick={() => setIsSendMessageOpen(true)} className="h-9 px-4 bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider rounded-none shadow-none hover:bg-blue-700">
                <Send className="h-3.5 w-3.5 mr-2" />
                Dispatch Broadcast
            </Button>
        </div>
      </div>

      {/* Liaison Pulse Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-slate-200 bg-white shadow-none rounded-none overflow-hidden hover:border-emerald-400 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                  <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WA Correspondence</p>
                      <p className="text-2xl font-black tracking-tighter text-emerald-600 tabular-nums">{logs.filter(l => l.channel === 'whatsapp').length}</p>
                  </div>
                  <div className="h-10 w-10 bg-emerald-50 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                  </div>
              </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white shadow-none rounded-none overflow-hidden hover:border-blue-400 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                  <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Advisories</p>
                      <p className="text-2xl font-black tracking-tighter text-blue-600 tabular-nums">{logs.filter(l => l.channel === 'email').length}</p>
                  </div>
                  <div className="h-10 w-10 bg-blue-50 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
              </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white shadow-none rounded-none overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                  <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Frameworks</p>
                      <p className="text-2xl font-black tracking-tighter text-slate-900 tabular-nums">{templates.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-slate-100 flex items-center justify-center">
                    <Layout className="h-5 w-5 text-slate-600" />
                  </div>
              </CardContent>
          </Card>
          <Card className="border-[#0f172a] bg-[#0f172a] text-white shadow-none rounded-none overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                  <div>
                      <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest">Broadcast Fidelity</p>
                      <p className="text-2xl font-black tracking-tighter tabular-nums">99.8%</p>
                  </div>
                  <div className="h-10 w-10 bg-blue-500/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-blue-400" />
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* Main Liaison Workspace */}
      <Tabs defaultValue="logs" onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
             <TabsList className="h-10 bg-slate-100 border border-slate-200 p-0 rounded-none">
                <TabsTrigger value="logs" className="text-[10px] font-black uppercase tracking-wider px-6 rounded-none data-[state=active]:bg-white data-[state=active]:text-blue-600">
                   <History className="h-3.5 w-3.5 mr-2" /> Transmission Logs
                </TabsTrigger>
                <TabsTrigger value="templates" className="text-[10px] font-black uppercase tracking-wider px-6 rounded-none data-[state=active]:bg-white data-[state=active]:text-emerald-600">
                   <Bookmark className="h-3.5 w-3.5 mr-2" /> Template Catalog
                </TabsTrigger>
             </TabsList>
             
             <div className="flex items-center gap-2">
                <div className="relative">
                   <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                   <Input placeholder="Search transmissions..." className="h-8 pl-8 w-[240px] text-[10px] font-bold border-slate-200 bg-white rounded-none shadow-none" />
                </div>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border border-slate-200 bg-white rounded-none shadow-none"><Settings2 className="h-3.5 w-3.5" /></Button>
             </div>
          </div>
          
          <TabsContent value="logs" className="animate-in fade-in duration-300">
              <Card className="border-slate-200 shadow-none rounded-none overflow-hidden bg-white">
                  <Table>
                      <TableHeader className="bg-slate-50 border-b border-slate-100">
                          <TableRow className="h-10 hover:bg-transparent border-none">
                              <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Transmission Time</TableHead>
                              <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Assessee / Client</TableHead>
                              <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500 text-center">Channel</TableHead>
                              <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Point of Contact</TableHead>
                              <TableHead className="px-4 font-black text-[10px] uppercase text-slate-500">Status</TableHead>
                              <TableHead className="px-4 w-10"></TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {loading ? (
                              <TableRow><TableCell colSpan={6} className="h-40 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Syncing transmission packets…</TableCell></TableRow>
                          ) : logs.length === 0 ? (
                              <TableRow><TableCell colSpan={6} className="h-40 text-center text-xs font-bold text-slate-400 italic">No correspondence transmission records found.</TableCell></TableRow>
                          ) : logs.map(l => (
                              <TableRow key={l.id} className="h-12 border-slate-50 hover:bg-slate-50/80 transition-colors group border-b last:border-0 text-[#0f172a]">
                                  <TableCell className="px-4 py-2 font-black text-[10px] text-slate-400 uppercase tabular-nums">
                                      {format(new Date(l.created_at), 'dd MMM | hh:mm a')}
                                  </TableCell>
                                  <TableCell className="px-4 py-2">
                                      <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-tight">
                                          <div className="h-5 w-5 bg-slate-100 flex items-center justify-center"><Globe className="h-3 w-3 text-slate-400" /></div>
                                          {l.client_name}
                                      </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-2 text-center">
                                      <Badge variant="outline" className={`rounded-none px-2 py-0.5 text-[9px] font-black uppercase tracking-tight border-none ${l.channel === 'whatsapp' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                                          {l.channel === 'whatsapp' ? <MessageSquare size={10} className="mr-1" /> : <Mail size={10} className="mr-1" />}
                                          {l.channel.toUpperCase()}
                                      </Badge>
                                  </TableCell>
                                  <TableCell className="px-4 py-2 text-[11px] font-bold text-slate-500 tabular-nums lowercase tracking-tight">
                                      {l.sent_to}
                                  </TableCell>
                                  <TableCell className="px-4 py-2">
                                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                                          <CheckCircle2 size={12} className="shrink-0" /> Transmitted
                                      </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-2 text-right">
                                      <DropdownMenu>
                                         <DropdownMenuTrigger asChild>
                                             <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-none"><MoreVertical className="h-4 w-4" /></Button>
                                         </DropdownMenuTrigger>
                                         <DropdownMenuContent align="end" className="w-40 rounded-none border-slate-200 shadow-none">
                                             <DropdownMenuItem className="text-xs font-bold rounded-none"><Copy className="mr-2 h-3.5 w-3.5" /> Clone Message</DropdownMenuItem>
                                             <DropdownMenuItem className="text-xs font-bold rounded-none"><History className="mr-2 h-3.5 w-3.5" /> Trace Delivery</DropdownMenuItem>
                                             <Separator className="my-1" />
                                             <DropdownMenuItem className="text-xs font-bold text-rose-600 rounded-none"><Trash2 className="mr-2 h-3.5 w-3.5" /> Purge Log</DropdownMenuItem>
                                         </DropdownMenuContent>
                                      </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </Card>
          </TabsContent>

          <TabsContent value="templates" className="animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map(t => (
                      <Card key={t.id} className="relative overflow-hidden group border-slate-200 shadow-none rounded-none transition-all duration-300 hover:border-slate-900">
                          <div className={`absolute top-0 left-0 w-1 h-full ${t.channel === 'whatsapp' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                          <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
                              <div className="flex items-center justify-between mb-2">
                                  <Badge variant="secondary" className={`rounded-none px-1.5 py-0 text-[8px] font-black uppercase tracking-[0.2em] border-none shadow-none ${t.channel === 'whatsapp' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {t.channel}
                                  </Badge>
                                  <div className="flex gap-1 opacity-100">
                                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none hover:bg-slate-200"><Edit3 size={12} /></Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none hover:bg-rose-50 text-rose-500"><Trash2 size={12} /></Button>
                                  </div>
                              </div>
                              <CardTitle className="text-[14px] font-black tracking-tight text-slate-900 uppercase">{t.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                              <div className="bg-slate-50 p-3 rounded-none border border-slate-100 min-h-[80px] relative">
                                  <Terminal className="absolute top-1 right-1 h-3 w-3 text-slate-200" />
                                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">
                                      "{t.body}"
                                  </p>
                              </div>
                              <div className="mt-4 flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest tabular-nums">
                                      <Clock size={10} /> {format(new Date(t.created_at), 'dd MMM')}
                                  </div>
                                  <Button variant="outline" className="h-6 px-3 text-[8px] font-black uppercase rounded-none border-slate-200 hover:bg-slate-900 hover:text-white transition-colors">Deploy</Button>
                              </div>
                          </CardContent>
                      </Card>
                  ))}
                  <button 
                      onClick={() => setIsAddTemplateOpen(true)}
                      className="border-2 border-dashed border-slate-200 rounded-none p-8 flex flex-col items-center justify-center gap-3 text-slate-400 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition-all group shadow-none"
                    >
                      <div className="h-10 w-10 rounded-none border-2 border-dotted border-slate-200 flex items-center justify-center group-hover:border-blue-400 group-hover:scale-105 transition-transform">
                         <Plus size={20} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest leading-none">Draft Framework</span>
                  </button>
              </div>
          </TabsContent>
      </Tabs>

      {/* Liaision Dialogs - Brutalist */}
      {isAddTemplateOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-none flex items-center justify-center p-4">
              <Card className="max-w-xl w-full rounded-none border border-slate-300 shadow-none bg-white overflow-hidden animate-in zoom-in-100 duration-150">
                  <div className="bg-[#0f172a] text-white p-6 border-b border-white/10">
                      <h2 className="text-xl font-black tracking-tight uppercase">Archiving Liaison Framework</h2>
                      <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-1">Multi-Channel Transmission Blueprint</p>
                  </div>
                  <div className="p-8 space-y-5">
                      <div className="grid gap-1.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Liaison Name / Internal ID</Label>
                          <Input placeholder="e.g. Audit Confirmation Letter" className="h-10 font-bold border-slate-200 rounded-none" value={newTemplate.name} onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-1.5">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Channel</Label>
                              <Select value={newTemplate.channel} onValueChange={(val) => setNewTemplate({...newTemplate, channel: val as any})}>
                                  <SelectTrigger className="h-10 font-black text-xs border-slate-200 uppercase rounded-none"><SelectValue /></SelectTrigger>
                                  <SelectContent className="rounded-none">
                                      <SelectItem value="whatsapp" className="text-xs font-bold uppercase rounded-none">WhatsApp Transmission</SelectItem>
                                      <SelectItem value="email" className="text-xs font-bold uppercase rounded-none">Email Advisory</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>
                      <div className="grid gap-1.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center justify-between">
                             Liaison Narrative / Body
                             <span className="text-[8px] opacity-70 italic font-medium">Personalize with {"{{client_name}}"}</span>
                          </Label>
                          <Textarea 
                              className="min-h-[160px] rounded-none border-slate-200 font-bold text-sm bg-slate-50/50 p-4 focus:ring-1 focus:ring-blue-600" 
                              placeholder="Respected {{client_name}}, this communication is per your professional mandate..." 
                              value={newTemplate.body}
                              onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                          />
                      </div>
                  </div>
                  <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-2">
                      <Button variant="ghost" className="h-10 text-[11px] font-black uppercase rounded-none" onClick={() => setIsAddTemplateOpen(false)}>Discard Draft</Button>
                      <Button onClick={handleCreateTemplate} className="h-10 px-8 bg-[#0f172a] text-white font-black text-[11px] uppercase tracking-wider rounded-none shadow-none hover:bg-slate-800">Index Framework</Button>
                  </div>
              </Card>
          </div>
      )}

      {isSendMessageOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-none flex items-center justify-center p-4">
              <Card className="max-w-lg w-full rounded-none border border-slate-300 shadow-none bg-white overflow-hidden animate-in zoom-in-100 duration-150">
                  <div className="bg-blue-600 text-white p-6 border-b border-blue-500">
                      <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                         <Zap className="h-5 w-5" /> Professional Dispatch
                      </h2>
                      <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mt-1">Synchronizing Ad-Hoc Liaison Correspondence</p>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="grid gap-1.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Assessee / Client</Label>
                          <Select onValueChange={(val) => setSendMessageForm({...sendMessageForm, client_id: val})}>
                              <SelectTrigger className="h-11 font-black text-xs border-slate-200 rounded-none"><SelectValue placeholder="Search Directory..." /></SelectTrigger>
                              <SelectContent className="rounded-none">
                                  {clients.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase rounded-none">{c.name}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="grid gap-1.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deployable Liaison Framework</Label>
                          <Select onValueChange={(val) => setSendMessageForm({...sendMessageForm, template_id: val})}>
                              <SelectTrigger className="h-11 font-black text-xs border-slate-200 rounded-none"><SelectValue placeholder="Select Validated Template..." /></SelectTrigger>
                              <SelectContent className="rounded-none">
                                  {templates.map(t => (
                                      <SelectItem key={t.id} value={t.id} className="text-xs font-bold uppercase py-2 rounded-none">
                                          <div className="flex flex-col">
                                             <span>{t.name}</span>
                                             <span className="text-[9px] opacity-40 font-black tabular-nums">{t.channel.toUpperCase()}</span>
                                          </div>
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-100 flex items-start gap-3 rounded-none">
                         <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                         <p className="text-[10px] font-black text-blue-700 leading-relaxed uppercase tracking-tight">
                            Dispatching will initialize outbound transmission to the registered point-of-contact in the directory.
                         </p>
                      </div>
                  </div>
                  <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-2">
                      <Button variant="ghost" className="h-10 text-[11px] font-black uppercase rounded-none" onClick={() => setIsSendMessageOpen(false)}>Abort Dispatch</Button>
                      <Button onClick={handleSendMessage} className="h-10 px-8 bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest rounded-none shadow-none hover:bg-blue-700">Execute Transmission</Button>
                  </div>
              </Card>
          </div>
      )}
    </div>
  )
}
