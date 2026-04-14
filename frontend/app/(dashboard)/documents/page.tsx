'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { documentsApi, clientsApi } from '@/lib/api'
import type { Document, Client } from '@/types'
import { Upload, FolderOpen, Trash2, Download, File } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const CATEGORIES = ['Tax', 'Legal', 'KYC', 'Financial', 'Audit', 'Other']

function formatBytes(bytes?: number) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [total, setTotal] = useState(0)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filterClient, setFilterClient] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [uploadModal, setUploadModal] = useState(false)
  const [uploadForm, setUploadForm] = useState<any>({ category: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dRes, cRes] = await Promise.all([
        documentsApi.list({ client_id: filterClient || undefined, category: filterCategory || undefined }),
        clientsApi.list({ size: 100 }),
      ])
      setDocs(dRes.data.items)
      setTotal(dRes.data.total)
      setClients(cRes.data.items)
    } catch { toast.error('Failed to load documents') }
    finally { setLoading(false) }
  }, [filterClient, filterCategory])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) { toast.error('Please select a file'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', selectedFile)
      if (uploadForm.client_id) fd.append('client_id', uploadForm.client_id)
      if (uploadForm.category) fd.append('category', uploadForm.category)
      await documentsApi.upload(fd)
      toast.success('Document uploaded!')
      setUploadModal(false)
      setSelectedFile(null)
      setUploadForm({ category: '' })
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally { setUploading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    try { await documentsApi.delete(id); toast.success('Deleted'); fetchData() }
    catch { toast.error('Failed to delete') }
  }

  const getFileIcon = (type?: string) => {
    if (!type) return '📄'
    if (type.includes('pdf')) return '📕'
    if (type.includes('image')) return '🖼'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    if (type.includes('word') || type.includes('document')) return '📝'
    return '📄'
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[28px] md:text-[40px] font-semibold tracking-vercel-display leading-[1.20]">Documents</h1>
          <p className="text-muted-foreground mt-2">{total} file{total !== 1 ? 's' : ''} stored</p>
        </div>
        <button id="upload-doc-btn" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={() => setUploadModal(true)}>
          <Upload size={15} /> Upload Document
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" style={{ width: 'auto' }} value={filterClient} onChange={e => setFilterClient(e.target.value)}>
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" style={{ width: 'auto' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="relative w-full overflow-auto rounded-lg shadow-vercel bg-card">
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 48, gap: 12 }}><div className="spinner" /><span className="text-muted">Loading…</span></div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-sm text-muted-foreground rounded-lg shadow-vercel border-dashed border border-border">
            <div className="mb-4 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center"><FolderOpen size={24} style={{ color: 'var(--text-muted)' }} /></div>
            <h3>No documents yet</h3><p>Upload your first document</p>
          </div>
        ) : (
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border"><tr className="border-b border-border transition-colors hover:bg-muted/50"><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">File</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Category</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Size</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Uploaded</th><th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"></th></tr></thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id}>
                  <td className="p-4 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 20 }}>{getFileIcon(d.file_type)}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{d.file_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.file_type || 'Unknown type'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle whitespace-nowrap">{d.category ? <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-muted text-muted-foreground hover:bg-muted/80">{d.category}</span> : <span className="text-muted">—</span>}</td>
                  <td className="p-4 align-middle whitespace-nowrap">{formatBytes(d.file_size)}</td>
                  <td className="p-4 align-middle whitespace-nowrap">{format(new Date(d.created_at), 'dd MMM yyyy')}</td>
                  <td className="p-4 align-middle whitespace-nowrap">
                    <div className="flex gap-1">
                      <a href={`${process.env.NEXT_PUBLIC_API_URL}${d.file_url}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-icon btn-sm" title="Download">
                        <Download size={14} />
                      </a>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(d.id)} style={{ color: 'var(--danger)' }} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {uploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setUploadModal(false)}>
          <div className="bg-background rounded-lg shadow-vercel-popover max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <span className="text-lg font-semibold tracking-vercel-card">Upload Document</span>
              <button className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground" onClick={() => setUploadModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="p-6" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: '2px dashed var(--border-light)', borderRadius: 'var(--radius)', padding: 32, textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)', background: selectedFile ? 'var(--accent-glow)' : 'transparent' }}
                >
                  <Upload size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    {selectedFile ? selectedFile.name : 'Click to choose file'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF, Excel, Word, Images supported</div>
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Client (optional)</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={uploadForm.client_id || ''} onChange={e => setUploadForm({ ...uploadForm, client_id: e.target.value })}>
                    <option value="">No client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium leading-none mb-2 block text-foreground">Category</label>
                  <select className="flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-6 border-t border-border bg-muted/20">
                <button type="button" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80" onClick={() => setUploadModal(false)}>Cancel</button>
                <button type="submit" className="inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" disabled={uploading || !selectedFile}>
                  {uploading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Uploading…</> : <><Upload size={14} /> Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
