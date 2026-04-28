'use client'
import { useState, useEffect } from 'react'
import { authApi } from '@/lib/api'
import { notificationPreferencesApi } from '@/lib/api'
import { 
  User, Lock, Phone, ShieldCheck, Building2, 
  Bell, Globe, Database, CreditCard, Key,
  Mail, Settings2, Fingerprint, ExternalLink,
  ChevronRight, Save, LogOut, CheckCircle2,
  AlertCircle, History, Cloud,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast';
import { getUser, setUser } from '@/lib/auth';
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
  const [savingPw, setSavingPw] = useState(false);
  const [pref, setPref] = useState({ email_enabled: false, whatsapp_enabled: false, reminder_days: 0 });
  const [savingPref, setSavingPref] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authApi.updateProfile(profileForm)
      setUser(res.data)
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally { setSaving(false) }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    if (pwForm.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSavingPw(true)
    try {
      await authApi.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      toast.success('Password changed successfully!')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to change password')
    } finally { setSavingPw(false) }
  }

  const handlePreferencesSave = async () => {
    setSavingPref(true);
    try {
      await notificationPreferencesApi.update(pref);
      toast.success('Notification preferences saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save preferences');
    } finally {
      setSavingPref(false);
    }
  };

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await notificationPreferencesApi.get();
        setPref(res.data);
      } catch (err) {
        console.error('Failed to load preferences');
      }
    };
    fetchPrefs();
  }, []);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Settings</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Manage your account and firm settings</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-slate-100 p-0 rounded-none h-11 border border-slate-200 shadow-none">
          <TabsTrigger value="profile" className="rounded-none px-8 data-[state=active]:bg-[#0f172a] data-[state=active]:text-white h-full text-[10px] font-black uppercase tracking-widest border-r border-slate-200 last:border-r-0 transition-colors">Profile</TabsTrigger>
          <TabsTrigger value="security" className="rounded-none px-8 data-[state=active]:bg-[#0f172a] data-[state=active]:text-white h-full text-[10px] font-black uppercase tracking-widest border-r border-slate-200 last:border-r-0 transition-colors">Security</TabsTrigger>
          <TabsTrigger value="firm" className="rounded-none px-8 data-[state=active]:bg-[#0f172a] data-[state=active]:text-white h-full text-[10px] font-black uppercase tracking-widest border-r border-slate-200 last:border-r-0 transition-colors">Firm Details</TabsTrigger>
          <TabsTrigger value="integration" className="rounded-none px-8 data-[state=active]:bg-[#0f172a] data-[state=active]:text-white h-full text-[10px] font-black uppercase tracking-widest border-r border-slate-200 last:border-r-0 transition-colors">Integrations</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-none px-8 data-[state=active]:bg-[#0f172a] data-[state=active]:text-white h-full text-[10px] font-black uppercase tracking-widest border-r border-slate-200 last:border-r-0 transition-colors">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-slate-200 shadow-none rounded-none bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 border-b p-4 px-6 flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-sm font-black tracking-tight uppercase">Profile Information</CardTitle>
                   <CardDescription className="text-[10px] uppercase font-black text-slate-500">Update your personal details</CardDescription>
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
                        <p className="text-xl font-black tracking-tight text-[#0f172a] uppercase">{profileForm.name || 'User'}</p>
                        <p className="text-[11px] font-black text-slate-500 flex items-center gap-1.5 uppercase tracking-wider"><Mail className="h-3.5 w-3.5" /> {currentUser?.email}</p>
                        <Badge className="bg-blue-600 text-white rounded-none border-none text-[8px] font-black uppercase py-1 px-2 mt-3 tracking-widest shadow-none">{currentUser?.role?.replace('_', ' ')}</Badge>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                      <Input className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600 uppercase" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Your Name" />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                      <Input className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600 tabular-nums" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+91 99999 99999" />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={saving} className="h-10 px-8 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none hover:bg-slate-800 transition-colors">
                       {saving ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-slate-300 shadow-none rounded-none bg-[#0f172a] text-white overflow-hidden h-fit">
              <CardContent className="p-6 space-y-6">
                 <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Account Status</h3>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">Your account is linked to your firm&apos;s subscription. Some settings may be managed by your firm administrator.</p>
                 </div>
                 <div className="space-y-3">
                   <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-none">
                      <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest">
                        <Lock className="h-4 w-4 text-blue-400" /> Two-Factor Auth
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black border-none rounded-none uppercase">ACTIVE</Badge>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-none opacity-50">
                      <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest">
                        <Globe className="h-4 w-4 text-blue-400" /> Region
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">India</span>
                   </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-6">
          <Card className="border-slate-200 shadow-none rounded-none bg-white overflow-hidden max-w-2xl">
            <CardHeader className="bg-slate-50 border-b p-4 px-6 flex flex-row items-center justify-between">
              <div>
                 <CardTitle className="text-sm font-black tracking-tight uppercase">Change Password</CardTitle>
                 <CardDescription className="text-[10px] uppercase font-black text-slate-500">Keep your account secure with a strong password</CardDescription>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handlePasswordSave} className="space-y-6">
                  <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Password</label>
                    <Input type="password" required className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                      <Input type="password" required className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm New Password</label>
                      <Input type="password" required className="h-10 font-bold text-sm rounded-none border-slate-200 shadow-none focus-visible:ring-1 focus-visible:ring-blue-600" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-end pt-6 border-t border-slate-50">
                    <Button type="submit" disabled={savingPw} className="h-10 px-10 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none hover:bg-slate-800 transition-colors">
                       {savingPw ? "Saving..." : "Change Password"}
                    </Button>
                  </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Firm Details */}
        <TabsContent value="firm" className="mt-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-slate-200 shadow-none rounded-none bg-white overflow-hidden">
                 <CardHeader className="bg-slate-50 border-b p-4 px-6">
                    <CardTitle className="text-sm font-black tracking-tight uppercase">Firm Information</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 space-y-6">
                    <div className="flex p-5 bg-slate-50 rounded-none border border-slate-200 items-center justify-between">
                       <div className="flex items-center gap-5">
                          <div className="h-14 w-14 rounded-none bg-white border border-slate-200 flex items-center justify-center p-2 shadow-none">
                             <img src="/logo-icon.png" alt="Firm" className="h-full object-contain opacity-40 grayscale" />
                          </div>
                          <div>
                             <p className="text-[11px] font-black uppercase tracking-widest text-[#0f172a]">Firm Logo</p>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Upload your firm logo</p>
                          </div>
                       </div>
                       <Button variant="outline" size="sm" className="h-9 px-4 text-[9px] font-black uppercase tracking-widest rounded-none border-slate-200 shadow-none hover:bg-slate-100">Replace</Button>
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Firm PAN</label>
                       <Input disabled value="ABCDE1234F" className="h-10 font-black text-sm uppercase bg-slate-100/50 rounded-none border-slate-200 shadow-none tracking-widest font-mono" />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Firm GSTIN</label>
                       <Input disabled value="22ABCDE1234F1Z1" className="h-10 font-black text-sm uppercase bg-slate-100/50 rounded-none border-slate-200 shadow-none tracking-widest font-mono" />
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none rounded-none bg-white overflow-hidden">
                 <CardHeader className="bg-slate-50 border-b p-4 px-6">
                    <CardTitle className="text-sm font-black tracking-tight uppercase">Reminder Settings</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 space-y-8">
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Default Reminder Window</p>
                          <span className="text-[11px] font-black text-blue-600 tabular-nums uppercase">14 DAYS</span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 rounded-none overflow-hidden">
                          <div className="h-full bg-blue-600 w-[60%] shadow-none"></div>
                       </div>
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-none bg-emerald-50 border border-emerald-100 shadow-none">
                       <div className="flex items-center gap-4">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <div className="text-[11px] font-black uppercase text-emerald-800 tracking-widest">WhatsApp Notifications</div>
                       </div>
                       <Badge className="bg-emerald-600 text-white rounded-none border-none text-[8px] font-black uppercase px-2 shadow-none">CONNECTED</Badge>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integration" className="mt-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-slate-200 shadow-none rounded-none bg-white overflow-hidden">
                 <CardHeader className="bg-slate-50 border-b p-4 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <Cloud className="h-5 w-5 text-blue-600" />
                       <CardTitle className="text-sm font-black tracking-tight uppercase">Tally Integration</CardTitle>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-none rounded-none text-[8px] font-black uppercase px-2 shadow-none">Online</Badge>
                 </CardHeader>
                 <CardContent className="p-8 space-y-5">
                    <div className="p-5 rounded-none bg-slate-50 border border-slate-200 space-y-3 shadow-none">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Port</span>
                          <span className="text-xs font-mono font-black text-[#0f172a]">9002</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Sync</span>
                          <span className="text-[11px] font-black text-[#0f172a] uppercase tabular-nums">Today, 09:42 AM</span>
                       </div>
                    </div>
                    <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest h-10 rounded-none border-slate-200 shadow-none hover:bg-slate-50">Sync Now</Button>
                 </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none rounded-none bg-white overflow-hidden">
                 <CardHeader className="bg-slate-50 border-b p-4 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <ShieldCheck className="h-5 w-5 text-emerald-600" />
                       <CardTitle className="text-sm font-black tracking-tight uppercase">Government Portals</CardTitle>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-none rounded-none text-[8px] font-black uppercase px-2 shadow-none">Connected</Badge>
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
                             <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 group-hover:text-[#0f172a]">MCA Filing Status</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600" />
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="border-slate-200 shadow-none rounded-none bg-white overflow-hidden max-w-2xl">
            <CardHeader className="bg-slate-50 border-b p-4 px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black tracking-tight uppercase">Notification Preferences</CardTitle>
                <CardDescription className="text-[10px] uppercase font-black text-slate-500">Choose how you receive deadline reminders</CardDescription>
              </div>
              <Bell className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-none">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-[#0f172a]">Email Alerts</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">Receive reminders via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={pref.email_enabled} onChange={e => setPref({ ...pref, email_enabled: e.target.checked })} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-checked:bg-blue-600 rounded-full peer-focus:ring-2 peer-focus:ring-blue-300 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-none">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-[#0f172a]">WhatsApp Alerts</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">Receive reminders via WhatsApp</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={pref.whatsapp_enabled} onChange={e => setPref({ ...pref, whatsapp_enabled: e.target.checked })} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-checked:bg-emerald-600 rounded-full peer-focus:ring-2 peer-focus:ring-emerald-300 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-[#0f172a]">Reminder Lead Days</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-0.5">How many days before a deadline should we remind you?</p>
                    </div>
                  </div>
                  <Input type="number" min={0} max={30} value={pref.reminder_days} onChange={e => setPref({ ...pref, reminder_days: Number(e.target.value) })} className="w-20 h-9 text-center font-black text-sm rounded-none border-slate-200 shadow-none tabular-nums" />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button onClick={handlePreferencesSave} disabled={savingPref} className="h-10 px-8 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none hover:bg-slate-800 transition-colors">
                  {savingPref ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
