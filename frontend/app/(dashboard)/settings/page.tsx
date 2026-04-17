'use client'
import { useState } from 'react'
import { authApi } from '@/lib/api'
import { setUser, getUser } from '@/lib/auth'
import { 
  User, Lock, Phone, ShieldCheck, Building2, 
  Bell, Globe, Database, CreditCard, Key,
  Mail, Settings2, Fingerprint, ExternalLink,
  ChevronRight, Save, LogOut, CheckCircle2,
  AlertCircle, History, Cloud
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SettingsPage() {
  const currentUser = getUser()
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.profile?.name || '',
    phone: currentUser?.profile?.phone || '',
  })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authApi.updateProfile(profileForm)
      setUser(res.data)
      toast.success('Professional profile updated!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Identity update failed')
    } finally { setSaving(false) }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) { toast.error('Passphrase mismatch detected'); return }
    if (pwForm.new_password.length < 8) { toast.error('Security protocols require min 8 chars'); return }
    setSavingPw(true)
    try {
      await authApi.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      toast.success('Security credentials rotated!')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Credential rotation error')
    } finally { setSavingPw(false) }
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Firm Governance Center</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Global Account & Statutory Identity Management</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-slate-100 p-0 rounded-none h-11 border border-slate-200 shadow-none">
          <TabsTrigger value="profile" className="rounded-none px-8 data-[state=active]:bg-[#0f172a] data-[state=active]:text-white h-full text-[10px] font-black uppercase tracking-widest border-r border-slate-200 last:border-r-0 transition-colors">Identity Profile</TabsTrigger>
          <TabsTrigger value="security" className="rounded-none px-8 data-[state=active]:bg-[#0f172a] data-[state=active]:text-white h-full text-[10px] font-black uppercase tracking-widest border-r border-slate-200 last:border-r-0 transition-colors">Access Governance</TabsTrigger>
          <TabsTrigger value="firm" className="rounded-none px-8 data-[state=active]:bg-[#0f172a] data-[state=active]:text-white h-full text-[10px] font-black uppercase tracking-widest border-r border-slate-200 last:border-r-0 transition-colors">Statutory Branding</TabsTrigger>
          <TabsTrigger value="integration" className="rounded-none px-8 data-[state=active]:bg-[#0f172a] data-[state=active]:text-white h-full text-[10px] font-black uppercase tracking-widest border-r border-slate-200 last:border-r-0 transition-colors">ERP Protocols</TabsTrigger>
        </TabsList>

        {/* Identity Profile */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-slate-200 shadow-none rounded-none bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 border-b p-4 px-6 flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-sm font-black tracking-tight uppercase">Assigned Professional Account</CardTitle>
                   <CardDescription className="text-[10px] uppercase font-black text-slate-500">Manage individual practitioner details</CardDescription>
                </div>
                <User className="h-4 w-4 text-slate-900" />
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleProfileSave} className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center border-b border-slate-100 pb-8">
                      <div className="h-24 w-24 rounded-none bg-[#0f172a] flex items-center justify-center text-white text-3xl font-black shadow-none border-4 border-slate-50">
                        {(profileForm.name || currentUser?.email || 'U').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black tracking-tight text-[#0f172a] uppercase">{profileForm.name || 'Practitioner'}</p>
                        <p className="text-[11px] font-black text-slate-500 flex items-center gap-1.5 uppercase tracking-wider"><Mail className="h-3.5 w-3.5" /> {currentUser?.email}</p>
                        <Badge className="bg-blue-600 text-white rounded-none border-none text-[8px] font-black uppercase py-1 px-2 mt-3 tracking-widest shadow-none">{currentUser?.role?.replace('_', ' ')}</Badge>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Practitioner Identity / Name</label>
                      <Input className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600 uppercase" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Your Name" />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Liaison Mobile (Authorized)</label>
                      <Input className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600 tabular-nums" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+91 99999 99999" />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={saving} className="h-10 px-8 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none hover:bg-slate-800 transition-colors">
                       {saving ? "Synchronizing..." : "Authorize Identity Update"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-slate-300 shadow-none rounded-none bg-[#0f172a] text-white overflow-hidden h-fit">
              <CardContent className="p-6 space-y-6">
                 <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Account Veracity</h3>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">Your account is tied to the firm's global governance license. Some attributes are restricted by firm administration.</p>
                 </div>
                 <div className="space-y-3">
                   <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-none">
                      <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest">
                        <Lock className="h-4 w-4 text-blue-400" /> 2FA Protcol
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black border-none rounded-none uppercase">ACTIVE</Badge>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-none opacity-50">
                      <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest">
                        <Globe className="h-4 w-4 text-blue-400" /> Region Sync
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Global</span>
                   </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Access Governance */}
        <TabsContent value="security" className="mt-6">
          <Card className="border-slate-200 shadow-none rounded-none bg-white overflow-hidden max-w-2xl">
            <CardHeader className="bg-slate-50 border-b p-4 px-6 flex flex-row items-center justify-between">
              <div>
                 <CardTitle className="text-sm font-black tracking-tight uppercase">Credential Rotation Protocols</CardTitle>
                 <CardDescription className="text-[10px] uppercase font-black text-slate-500">Regular rotation prevents statutory credential risk</CardDescription>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handlePasswordSave} className="space-y-6">
                  <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Statutory Response Key (Current)</label>
                    <Input type="password" required className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Authority Key</label>
                      <Input type="password" required className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Verify New Key</label>
                      <Input type="password" required className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-end pt-6 border-t border-slate-50">
                    <Button type="submit" disabled={savingPw} className="h-10 px-10 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none hover:bg-slate-800 transition-colors">
                       {savingPw ? "Rotating Keys..." : "Authorize Credential Rotation"}
                    </Button>
                  </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Firm Branding */}
        <TabsContent value="firm" className="mt-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-slate-200 shadow-none rounded-none bg-white overflow-hidden">
                 <CardHeader className="bg-slate-50 border-b p-4 px-6">
                    <CardTitle className="text-sm font-black tracking-tight uppercase">Statutory Branding Identity</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 space-y-6">
                    <div className="flex p-5 bg-slate-50 rounded-none border border-slate-200 items-center justify-between">
                       <div className="flex items-center gap-5">
                          <div className="h-14 w-14 rounded-none bg-white border border-slate-200 flex items-center justify-center p-2 shadow-none">
                             <img src="/logo-icon.png" alt="Firm" className="h-full object-contain opacity-40 grayscale" />
                          </div>
                          <div>
                             <p className="text-[11px] font-black uppercase tracking-widest text-[#0f172a]">Firm Seal / Logo</p>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Branding Standard</p>
                          </div>
                       </div>
                       <Button variant="outline" size="sm" className="h-9 px-4 text-[9px] font-black uppercase tracking-widest rounded-none border-slate-200 shadow-none hover:bg-slate-100">Replace</Button>
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Firm PAN (Forensic ID)</label>
                       <Input disabled value="ABCDE1234F" className="h-10 font-black text-sm uppercase bg-slate-100/50 rounded-none border-slate-200 shadow-none tracking-widest font-mono" />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Master GSTIN (Statutory ID)</label>
                       <Input disabled value="22ABCDE1234F1Z1" className="h-10 font-black text-sm uppercase bg-slate-100/50 rounded-none border-slate-200 shadow-none tracking-widest font-mono" />
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none rounded-none bg-white overflow-hidden">
                 <CardHeader className="bg-slate-50 border-b p-4 px-6">
                    <CardTitle className="text-sm font-black tracking-tight uppercase">Alert Horizons & Notification</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 space-y-8">
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Statutory Alert Horizon</p>
                          <span className="text-[11px] font-black text-blue-600 tabular-nums uppercase">14 DAYS</span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 rounded-none overflow-hidden">
                          <div className="h-full bg-blue-600 w-[60%] shadow-none"></div>
                       </div>
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-none bg-emerald-50 border border-emerald-100 shadow-none">
                       <div className="flex items-center gap-4">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <div className="text-[11px] font-black uppercase text-emerald-800 tracking-widest">WhatsApp Port Protocol</div>
                       </div>
                       <Badge className="bg-emerald-600 text-white rounded-none border-none text-[8px] font-black uppercase px-2 shadow-none">CONNECTED</Badge>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        {/* Integration Protocols */}
        <TabsContent value="integration" className="mt-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-slate-200 shadow-none rounded-none bg-white overflow-hidden">
                 <CardHeader className="bg-slate-50 border-b p-4 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <Cloud className="h-5 w-5 text-blue-600" />
                       <CardTitle className="text-sm font-black tracking-tight uppercase">Tally ERP 9 Connector</CardTitle>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-none rounded-none text-[8px] font-black uppercase px-2 shadow-none">Online</Badge>
                 </CardHeader>
                 <CardContent className="p-8 space-y-5">
                    <div className="p-5 rounded-none bg-slate-50 border border-slate-200 space-y-3 shadow-none">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">XML Export Port</span>
                          <span className="text-xs font-mono font-black text-[#0f172a]">9002</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Ledger Push</span>
                          <span className="text-[11px] font-black text-[#0f172a] uppercase tabular-nums">Today, 09:42 AM</span>
                       </div>
                    </div>
                    <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest h-10 rounded-none border-slate-200 shadow-none hover:bg-slate-50">Recalibrate Ledger Sync</Button>
                 </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none rounded-none bg-white overflow-hidden">
                 <CardHeader className="bg-slate-50 border-b p-4 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <ShieldCheck className="h-5 w-5 text-emerald-600" />
                       <CardTitle className="text-sm font-black tracking-tight uppercase">Statutory Portal APIs</CardTitle>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-none rounded-none text-[8px] font-black uppercase px-2 shadow-none">Authorized</Badge>
                 </CardHeader>
                 <CardContent className="p-8 space-y-6">
                    <div className="space-y-3">
                       <div className="flex items-center justify-between p-3 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-none transition-colors cursor-pointer group">
                          <div className="flex items-center gap-4">
                             <Database className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                             <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 group-hover:text-[#0f172a]">GSTR-2B Auto-Fetch</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600" />
                       </div>
                       <div className="flex items-center justify-between p-3 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-none transition-colors cursor-pointer group">
                          <div className="flex items-center gap-4">
                             <Fingerprint className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                             <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 group-hover:text-[#0f172a]">MCA Filing Verifier</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600" />
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
