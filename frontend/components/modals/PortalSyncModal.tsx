'use client'
import { useState, useEffect } from 'react'
import { portalSyncApi } from '@/lib/api'
import { 
  RefreshCw, CheckCircle2, AlertCircle, Clock, 
  Database, ShieldCheck, Globe, Zap, Loader2,
  ChevronRight, ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogDescription 
} from '@/components/ui/dialog'

interface PortalSyncModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName: string
}

export default function PortalSyncModal({ isOpen, onClose, clientId, clientName }: PortalSyncModalProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)

  const fetchLogs = async () => {
    try {
      const res = await portalSyncApi.getLogs(clientId)
      setLogs(res.data)
    } catch (err) {
      console.error("Failed to fetch sync logs")
    }
  }

  useEffect(() => {
    if (isOpen && clientId) {
      fetchLogs()
      const interval = setInterval(fetchLogs, 5000) // Poll every 5s while open
      return () => clearInterval(interval)
    }
  }, [isOpen, clientId])

  const handleSync = async (portal: string) => {
    setSyncing(portal)
    try {
      await portalSyncApi.trigger(clientId, portal, 'return_status')
      toast.success(`${portal} sync initiated`)
      fetchLogs()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Sync failed to start')
    } finally {
      setSyncing(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-none border-slate-300 p-0 overflow-hidden bg-white shadow-2xl">
        <DialogHeader className="bg-[#0f172a] text-white p-6 pb-8 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-blue-600 rounded-none flex items-center justify-center text-white">
                  <RefreshCw className={`h-6 w-6 ${syncing ? 'animate-spin' : ''}`} />
              </div>
              <div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">Portal Sync Center</DialogTitle>
                  <DialogDescription className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-1">
                      {clientName} • Verification & Status Bridge
                  </DialogDescription>
              </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 bg-slate-50/50">
            {/* Sync Controls */}
            <div className="grid grid-cols-2 gap-4">
                <SyncControlCard 
                    title="GST Portal" 
                    icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
                    onSync={() => handleSync('GST')}
                    loading={syncing === 'GST'}
                />
                <SyncControlCard 
                    title="MCA Portal" 
                    icon={<Globe className="h-4 w-4 text-blue-600" />}
                    onSync={() => handleSync('MCA')}
                    loading={syncing === 'MCA'}
                />
            </div>

            {/* Recent Logs */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" /> Recent Sync Activity
                    </h3>
                </div>
                
                <div className="space-y-2">
                    {logs.length === 0 ? (
                        <div className="p-12 border border-slate-200 border-dashed bg-white text-center">
                            <Database className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No sync history available</p>
                        </div>
                    ) : logs.map((log) => (
                        <div key={log.id} className="bg-white border border-slate-200 p-4 flex items-center justify-between group hover:border-slate-400 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-none flex items-center justify-center ${
                                    log.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                    log.status === 'failed' ? 'bg-rose-50 text-rose-600' :
                                    'bg-blue-50 text-blue-600 animate-pulse'
                                }`}>
                                    {log.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : 
                                     log.status === 'failed' ? <AlertCircle className="h-5 w-5" /> : 
                                     <Loader2 className="h-5 w-5 animate-spin" />}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{log.portal_type} {log.sync_type}</span>
                                        <Badge className={`h-4 text-[8px] font-black uppercase tracking-tighter rounded-none shadow-none ${
                                            log.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                            log.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {log.status}
                                        </Badge>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tabular-nums mt-1">
                                        {format(new Date(log.started_at), 'dd MMM yyyy, HH:mm:ss')}
                                    </span>
                                </div>
                            </div>

                            {log.status === 'failed' && (
                                <div className="text-right max-w-[150px]">
                                    <p className="text-[9px] font-bold text-rose-600 uppercase leading-tight truncate">{log.error_message}</p>
                                </div>
                            )}
                            
                            {log.status === 'completed' && log.result_data && (
                                <Button variant="ghost" size="sm" className="h-8 rounded-none text-[9px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 group">
                                    View Data <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="bg-slate-100 p-4 px-6 border-t border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-none bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Operational</span>
            </div>
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-600" onClick={onClose}>Close Dashboard</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SyncControlCard({ title, icon, onSync, loading }: { title: string, icon: any, onSync: () => void, loading: boolean }) {
    return (
        <Card className="rounded-none border-slate-200 shadow-none hover:border-slate-900 transition-all group overflow-hidden bg-white">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        {icon}
                    </div>
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{title}</span>
                </div>
                <Button 
                    size="sm" 
                    className="h-8 rounded-none bg-[#0f172a] text-white text-[9px] font-black uppercase tracking-widest shadow-none"
                    onClick={onSync}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Sync'}
                </Button>
            </CardContent>
        </Card>
    )
}
