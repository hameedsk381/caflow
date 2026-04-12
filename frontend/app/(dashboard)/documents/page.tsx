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
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">{total} file{total !== 1 ? 's' : ''} stored</p>
        </div>
        <button id="upload-doc-btn" className="btn btn-primary" onClick={() => setUploadModal(true)}>
          <Upload size={15} /> Upload Document
        </button>
      </div>

      <div className="filter-row">
        <select className="form-input" style={{ width: 'auto' }} value={filterClient} onChange={e => setFilterClient(e.target.value)}>
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-input" style={{ width: 'auto' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 48, gap: 12 }}><div className="spinner" /><span className="text-muted">Loading…</span></div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FolderOpen size={24} style={{ color: 'var(--text-muted)' }} /></div>
            <h3>No documents yet</h3><p>Upload your first document</p>
          </div>
        ) : (
          <table>
            <thead><tr><th>File</th><th>Category</th><th>Size</th><th>Uploaded</th><th></th></tr></thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 20 }}>{getFileIcon(d.file_type)}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{d.file_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.file_type || 'Unknown type'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{d.category ? <span className="badge badge-neutral">{d.category}</span> : <span className="text-muted">—</span>}</td>
                  <td>{formatBytes(d.file_size)}</td>
                  <td>{format(new Date(d.created_at), 'dd MMM yyyy')}</td>
                  <td>
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
        <div className="modal-overlay" onClick={() => setUploadModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Upload Document</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setUploadModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  <label className="form-label">Client (optional)</label>
                  <select className="form-input" value={uploadForm.client_id || ''} onChange={e => setUploadForm({ ...uploadForm, client_id: e.target.value })}>
                    <option value="">No client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setUploadModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading || !selectedFile}>
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
