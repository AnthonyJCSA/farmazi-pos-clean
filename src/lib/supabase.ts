import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Product {
  id: string
  code: string
  name: string
  price: number
  cost_price?: number
  stock: number
  min_stock: number
  category?: string
  laboratory?: string
  expiry_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  document_type: string
  document_number?: string
  name: string
  phone?: string
  email?: string
  address?: string
  created_at: string
}

export interface Sale {
  id: string
  sale_number: string
  customer_id?: string
  receipt_type: string
  subtotal: number
  igv: number
  total: number
  payment_method: string
  status: string
  created_at: string
  customer?: Customer
  sale_items?: SaleItem[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  product?: Product
}