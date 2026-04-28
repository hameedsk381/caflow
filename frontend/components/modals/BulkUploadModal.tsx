'use client'
import { useState, useRef } from 'react'
import { 
  X, Upload, FileText, AlertCircle, CheckCircle2, 
  Info, Download, FileSpreadsheet, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'clients' | 'compliance'
  onUpload: (data: any[]) => Promise<any>
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess, type, onUpload }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.type !== 'text/csv' && !selected.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file')
        return
      }
      setFile(selected)
      parseCSV(selected)
    }
  }

  const parseCSV = (file: File) => {
    setParsing(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
      if (lines.length < 2) {
        toast.error('File seems empty or missing headers')
        setParsing(false)
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = values[index]
        })
        return obj
      })

      setPreview(data.slice(0, 5)) // Show first 5 rows
      setParsing(false)
    }
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    
    // Re-parse full file for upload
    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const allData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const obj: any = {}
        headers.forEach((header, index) => {
            // Basic data cleanup
            let val = values[index];
            if (header === 'due_date' || header === 'date') {
                // Try to ensure ISO format if it looks like dd/mm/yyyy
                if (val && val.includes('/')) {
                    const [d, m, y] = val.split('/');
                    val = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }
            }
            obj[header] = val
        })
        return obj
      })

      try {
        await onUpload(allData)
        toast.success(`Successfully uploaded ${allData.length} records`)
        onSuccess()
        onClose()
      } catch (err: any) {
        toast.error(err.response?.data?.detail || 'Upload failed')
      } finally {
        setUploading(false)
      }
    }
    reader.readAsText(file)
  }

  const downloadTemplate = () => {
    const templates = {
      clients: 'name,email,phone,pan,gstin,business_type,address\nAcme Corp,acme@example.com,9876543210,ABCDE1234F,22ABCDE1234F1Z1,Private Ltd,Mumbai',
      compliance: 'client_id,type,period,due_date,filing_reference\n[CLIENT_ID],GST,April 2024,2024-05-20,PENDING'
    }
    const blob = new Blob([templates[type]], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_template.csv`
    a.click()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full rounded-none border border-slate-300 shadow-2xl relative bg-white overflow-hidden animate-in zoom-in-95 duration-200">
        <CardHeader className="bg-[#0f172a] text-white border-b border-white/10 p-4 px-6">
          <CardTitle className="text-lg font-black tracking-tight flex items-center justify-between uppercase">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-blue-400" />
              Bulk Upload {type === 'clients' ? 'Clients' : 'Filings'}
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/10 rounded-none" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="p-8 space-y-6">
            {!file ? (
              <div 
                className="border-2 border-dashed border-slate-200 p-12 text-center space-y-4 hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="h-16 w-16 bg-slate-100 rounded-none flex items-center justify-center mx-auto group-hover:bg-blue-100 transition-colors">
                  <FileSpreadsheet className="h-8 w-8 text-slate-400 group-hover:text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Click to select CSV file</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">or drag and drop here</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv" 
                  onChange={handleFileChange} 
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{file.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 rounded-none font-black text-[10px] uppercase" onClick={() => { setFile(null); setPreview([]) }}>Remove</Button>
                </div>

                {preview.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Preview (First 5 rows)</p>
                    <div className="border border-slate-200 overflow-x-auto">
                      <table className="w-full text-left text-[10px] font-bold">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            {Object.keys(preview[0]).map(h => (
                              <th key={h} className="px-3 py-2 uppercase text-slate-500">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {preview.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              {Object.values(row).map((v: any, j) => (
                                <td key={j} className="px-3 py-2 text-slate-700 truncate max-w-[150px]">{v}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-blue-50/50 border border-blue-100">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0" />
                <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase">
                  Ensure your CSV follows the required format. Download the template for reference.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-[10px] font-black uppercase tracking-widest rounded-none border-blue-200 text-blue-700 hover:bg-blue-100 shrink-0"
                onClick={downloadTemplate}
              >
                <Download className="h-3.5 w-3.5 mr-2" />
                Template
              </Button>
            </div>
          </div>

          <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-3">
            <Button 
              variant="ghost" 
              className="h-10 px-6 text-[10px] font-black uppercase tracking-widest rounded-none" 
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              className="h-10 px-10 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none hover:bg-slate-800 disabled:opacity-50"
              onClick={handleUpload}
              disabled={!file || uploading || parsing}
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
              ) : (
                'Confirm & Upload'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
