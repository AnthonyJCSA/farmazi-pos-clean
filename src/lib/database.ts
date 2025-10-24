import { supabase, Product, Customer, Sale, SaleItem } from './supabase'

// Mock data para fallback
const mockProducts: Product[] = [
  { id: '1', code: '001', name: 'Paracetamol 500mg', price: 2.50, stock: 100, min_stock: 5, is_active: true, created_at: '', updated_at: '' },
  { id: '2', code: '002', name: 'Ibuprofeno 400mg', price: 3.20, stock: 50, min_stock: 5, is_active: true, created_at: '', updated_at: '' },
  { id: '3', code: '003', name: 'Amoxicilina 500mg', price: 8.90, stock: 25, min_stock: 5, is_active: true, created_at: '', updated_at: '' },
  { id: '4', code: '004', name: 'Vitamina C 1000mg', price: 15.00, stock: 80, min_stock: 5, is_active: true, created_at: '', updated_at: '' },
  { id: '5', code: '005', name: 'Aspirina 100mg', price: 1.80, stock: 200, min_stock: 5, is_active: true, created_at: '', updated_at: '' },
]

const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
}

// 📦 PRODUCTOS
export const productService = {
  async getAll(): Promise<Product[]> {
    if (!isSupabaseConfigured()) return mockProducts
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      return data || mockProducts
    } catch (error) {
      console.error('Error loading products:', error)
      return mockProducts
    }
  },

  async findByCode(code: string): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      return mockProducts.find(p => p.code === code) || null
    }
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('Error finding product:', error)
      return null
    }
  },

  async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no configurado')
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no configurado')
    }
    
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateStock(id: string, newStock: number): Promise<void> {
    if (!isSupabaseConfigured()) return
    
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', id)
    
    if (error) throw error
  },

  async getLowStock(): Promise<Product[]> {
    if (!isSupabaseConfigured()) {
      return mockProducts.filter(p => p.stock <= p.min_stock)
    }
    
    try {
      const { data, error } = await supabase
        .from('low_stock_products')
        .select('*')
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading low stock:', error)
      return []
    }
  }
}

// 👥 CLIENTES
export const customerService = {
  async getAll(): Promise<Customer[]> {
    if (!isSupabaseConfigured()) return []
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading customers:', error)
      return []
    }
  },

  async create(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no configurado')
    }
    
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async findByDocument(document: string): Promise<Customer | null> {
    if (!isSupabaseConfigured()) return null
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('document_number', document)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('Error finding customer:', error)
      return null
    }
  }
}

// 🧾 VENTAS
export const saleService = {
  async create(saleData: {
    customer_id?: string
    receipt_type: string
    subtotal: number
    igv: number
    total: number
    payment_method: string
    items: Array<{
      product_id: string
      quantity: number
      unit_price: number
      subtotal: number
    }>
  }): Promise<Sale> {
    if (!isSupabaseConfigured()) {
      // Simular venta exitosa
      return {
        id: Date.now().toString(),
        sale_number: `${saleData.receipt_type}-${Date.now()}`,
        receipt_type: saleData.receipt_type,
        subtotal: saleData.subtotal,
        igv: saleData.igv,
        total: saleData.total,
        payment_method: saleData.payment_method,
        status: 'COMPLETED',
        created_at: new Date().toISOString()
      }
    }
    
    const saleNumber = `${saleData.receipt_type}-${Date.now()}`
    
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        sale_number: saleNumber,
        customer_id: saleData.customer_id,
        receipt_type: saleData.receipt_type,
        subtotal: saleData.subtotal,
        igv: saleData.igv,
        total: saleData.total,
        payment_method: saleData.payment_method
      })
      .select()
      .single()
    
    if (saleError) throw saleError

    const saleItems = saleData.items.map(item => ({
      ...item,
      sale_id: sale.id
    }))

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems)
    
    if (itemsError) throw itemsError

    // Actualizar stock y crear movimientos
    for (const item of saleData.items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single()
      
      if (product) {
        await productService.updateStock(item.product_id, product.stock - item.quantity)
        
        await supabase
          .from('inventory_movements')
          .insert({
            product_id: item.product_id,
            movement_type: 'OUT',
            quantity: -item.quantity,
            reference_type: 'SALE',
            reference_id: sale.id
          })
      }
    }

    return sale
  },

  async getTodaySales(): Promise<Sale[]> {
    if (!isSupabaseConfigured()) return []
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(*),
          sale_items(*, product:products(*))
        `)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading today sales:', error)
      return []
    }
  }
}

// 📊 REPORTES
export const reportService = {
  async getTopProducts(limit = 10): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      return mockProducts.slice(0, limit).map(p => ({
        name: p.name,
        code: p.code,
        total_sold: Math.floor(Math.random() * 100),
        total_revenue: p.price * Math.floor(Math.random() * 100)
      }))
    }
    
    try {
      const { data, error } = await supabase
        .from('top_products')
        .select('*')
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading top products:', error)
      return []
    }
  },

  async getDashboardStats(): Promise<any> {
    if (!isSupabaseConfigured()) {
      return {
        todaySales: 125.50,
        todayTransactions: 8,
        totalProducts: mockProducts.length,
        lowStockCount: 2,
        totalCustomers: 15
      }
    }
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Ventas de hoy
      const { data: todaySales } = await supabase
        .from('daily_sales')
        .select('*')
        .eq('sale_date', today)
        .single()
      
      // Total productos
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      
      // Stock bajo
      const lowStockProducts = await productService.getLowStock()
      
      // Total clientes
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
      
      return {
        todaySales: todaySales?.total_amount || 0,
        todayTransactions: todaySales?.total_sales || 0,
        totalProducts: totalProducts || 0,
        lowStockCount: lowStockProducts.length,
        totalCustomers: totalCustomers || 0
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      return {
        todaySales: 0,
        todayTransactions: 0,
        totalProducts: 0,
        lowStockCount: 0,
        totalCustomers: 0
      }
    }
  }
}