import { supabase, Product, Customer, Sale, SaleItem } from './supabase'

// 📦 PRODUCTOS
export const productService = {
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async findByCode(code: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
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
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', id)
    
    if (error) throw error
  },

  async getLowStock(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('low_stock_products')
      .select('*')
    
    if (error) throw error
    return data || []
  }
}

// 👥 CLIENTES
export const customerService = {
  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async create(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async findByDocument(document: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('document_number', document)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
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
  }
}

// 📊 REPORTES
export const reportService = {
  async getTopProducts(limit = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('top_products')
      .select('*')
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  async getDashboardStats(): Promise<any> {
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
  }
}