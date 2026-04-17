export interface User {
  id: string
  firm_id: string
  email: string
  role: 'firm_admin' | 'employee' | 'client' | 'tax_consultant'
  status: string
  created_at: string
  profile?: Profile
}

export interface Profile {
  id: string
  user_id: string
  name: string
  phone?: string
  avatar?: string
}

export interface Client {
  id: string
  firm_id: string
  name: string
  gstin?: string
  pan?: string
  email?: string
  phone?: string
  address?: string
  business_type?: string
  status: 'active' | 'inactive'
  notes?: string
  created_at: string
  updated_at: string
}

export interface ComplianceRecord {
  id: string
  firm_id: string
  client_id: string
  type: 'GST' | 'ITR' | 'TDS' | 'ROC' | 'PT' | 'OTHER'
  period?: string
  due_date: string
  status: 'pending' | 'in_progress' | 'filed' | 'overdue'
  assigned_to?: string
  notes?: string
  filing_reference?: string
  created_at: string
  updated_at: string
  client_name?: string
  assignee_name?: string
}

export interface Task {
  id: string
  firm_id: string
  client_id?: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to?: string
  created_by?: string
  due_date?: string
  created_at: string
  updated_at: string
  client_name?: string
  assignee_name?: string
}

export interface Invoice {
  id: string
  firm_id: string
  client_id?: string
  invoice_number: string
  description?: string
  amount: number
  tax_amount: number
  total_amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date?: string
  created_at: string
  updated_at: string
  client_name?: string
}

export interface Document {
  id: string
  firm_id: string
  client_id?: string
  file_name: string
  file_url: string
  file_type?: string
  file_size?: number
  category?: string
  uploaded_by?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  firm_id: string
  title: string
  message?: string
  type: string
  is_read: boolean
  entity_type?: string
  entity_id?: string
  created_at: string
}

export interface TeamMember {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  name?: string
  phone?: string
  avatar?: string
}

export interface DashboardStats {
  total_clients: number
  pending_compliance: number
  overdue_compliance: number
  open_tasks: number
  total_revenue: number
  pending_invoices: number
  total_leads?: number
  active_services?: number
  overdue_notices?: number
  total_registers?: number
  total_sales: number
  total_collection: number
  total_outstanding: number
  expiring_dsc?: number
  expiring_licenses?: number
}
