'use client'

import { useState, useEffect, useRef } from 'react'
import { productService, saleService, customerService, reportService } from '@/lib/database'
import { Product, Customer } from '@/lib/supabase'
import InventoryModule from '@/components/inventory/InventoryModule'
import ReportsModule from '@/components/reports/ReportsModule'

interface CartItem extends Product {
  quantity: number
}

export default function FarmaciaPOS() {
  const [currentView, setCurrentView] = useState('pos')
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchCode, setSearchCode] = useState('')
  const [customerDoc, setCustomerDoc] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO')
  const [receiptType, setReceiptType] = useState('BOLETA')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>({})
  
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProducts()
    loadCustomers()
    loadStats()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await productService.getAll()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const loadCustomers = async () => {
    try {
      const data = await customerService.getAll()
      setCustomers(data)
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const loadStats = async () => {
    try {
      const data = await reportService.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSearch = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchCode.trim()) {
      try {
        const product = await productService.findByCode(searchCode) || 
                       products.find(p => p.name.toLowerCase().includes(searchCode.toLowerCase()))
        
        if (product && product.stock > 0) {
          addToCart(product)
          setSearchCode('')
        } else {
          alert('Producto no encontrado o sin stock')
          setSearchCode('')
        }
      } catch (error) {
        alert('Error al buscar producto')
        setSearchCode('')
      }
    }
  }

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id)
    const currentQty = existing ? existing.quantity : 0
    
    if (currentQty < product.stock) {
      if (existing) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ))
      } else {
        setCart([...cart, { ...product, quantity: 1 }])
      }
    } else {
      alert('Stock insuficiente')
    }
  }

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(cart.filter(item => item.id !== productId))
      return
    }
    
    const product = products.find(p => p.id === productId)
    if (product && newQty <= product.stock) {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQty }
          : item
      ))
    }
  }

  const processSale = async () => {
    if (cart.length === 0) {
      alert('Carrito vacío')
      return
    }

    setLoading(true)
    try {
      let customer = null
      if (customerDoc) {
        customer = await customerService.findByDocument(customerDoc)
        if (!customer && customerName) {
          customer = await customerService.create({
            document_type: 'DNI',
            document_number: customerDoc,
            name: customerName
          })
        }
      }

      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const igv = subtotal * 0.18
      const total = subtotal + igv

      const sale = await saleService.create({
        customer_id: customer?.id,
        receipt_type: receiptType,
        subtotal,
        igv,
        total,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity
        }))
      })

      printReceipt(sale, customer, cart, { subtotal, igv, total })
      
      setCart([])
      setCustomerDoc('')
      setCustomerName('')
      await loadProducts()
      await loadStats()
      searchRef.current?.focus()
      
      alert('Venta procesada exitosamente')
    } catch (error) {
      console.error('Error processing sale:', error)
      alert('Error al procesar la venta')
    } finally {
      setLoading(false)
    }
  }

  const printReceipt = (sale: any, customer: any, items: CartItem[], totals: any) => {
    const receipt = `
═══════════════════════════════════
           FARMACIA SALUD
═══════════════════════════════════
${sale.receipt_type}: ${sale.sale_number}
Fecha: ${new Date().toLocaleString('es-PE')}
───────────────────────────────────
Cliente: ${customer?.name || 'Cliente General'}
Doc: ${customer?.document_number || '00000000'}
───────────────────────────────────
PRODUCTOS:
${items.map(item => 
  `${item.name}
  ${item.quantity} x S/ ${item.price.toFixed(2)} = S/ ${(item.quantity * item.price).toFixed(2)}`
).join('\n')}
───────────────────────────────────
Subtotal:        S/ ${totals.subtotal.toFixed(2)}
IGV (18%):       S/ ${totals.igv.toFixed(2)}
TOTAL:           S/ ${totals.total.toFixed(2)}
───────────────────────────────────
Pago: ${sale.payment_method}
───────────────────────────────────
        ¡GRACIAS POR SU COMPRA!
═══════════════════════════════════`

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Comprobante</title></head>
          <body style="font-family: monospace; white-space: pre-line; margin: 20px;">
            ${receipt}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (currentView !== 'pos') return
      
      if (e.key === 'F1') {
        e.preventDefault()
        setCart([])
        setCustomerDoc('')
        setCustomerName('')
        searchRef.current?.focus()
      }
      
      if (e.key === 'F2') {
        e.preventDefault()
        processSale()
      }
      
      if (e.key === 'Escape') {
        setSearchCode('')
        searchRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [cart, currentView])

  const styles = {
    container: { minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '16px' },
    maxWidth: { maxWidth: '1280px', margin: '0 auto' },
    header: { backgroundColor: '#2563eb', color: 'white', padding: '16px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    content: { backgroundColor: 'white', borderRadius: '0 0 8px 8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '24px' },
    grid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
    input: { width: '100%', padding: '12px', fontSize: '18px', border: '2px solid #93c5fd', borderRadius: '4px', outline: 'none' },
    productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginTop: '16px' },
    productCard: { padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white' },
    sidebar: { backgroundColor: '#f9fafb', padding: '16px', borderRadius: '4px' },
    button: { padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', margin: '0 4px' },
    buttonPrimary: { backgroundColor: '#16a34a', color: 'white' },
    buttonSecondary: { backgroundColor: '#dc2626', color: 'white' },
    navButton: { backgroundColor: 'white', color: '#2563eb', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', margin: '0 4px' }
  }

  if (currentView === 'inventory') {
    return <InventoryModule onBack={() => setCurrentView('pos')} onProductsChange={loadProducts} />
  }

  if (currentView === 'reports') {
    return <ReportsModule onBack={() => setCurrentView('pos')} />
  }

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        
        <div style={styles.header}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>💊 FARMACIA POS - SUPABASE</h1>
            <p style={{ fontSize: '14px', margin: '4px 0 0 0' }}>F1: Nueva Venta | F2: Procesar | ESC: Limpiar</p>
          </div>
          <div>
            <button
              onClick={() => setCurrentView('inventory')}
              style={styles.navButton}
            >
              📦 Inventario
            </button>
            <button
              onClick={() => setCurrentView('reports')}
              style={styles.navButton}
            >
              📊 Reportes
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div style={{ backgroundColor: 'white', padding: '16px', margin: '16px 0', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#16a34a' }}>Ventas Hoy</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>S/ {stats.todaySales?.toFixed(2) || '0.00'}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#2563eb' }}>Productos</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.totalProducts || 0}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#7c3aed' }}>Clientes</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.totalCustomers || 0}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>Stock Bajo</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.lowStockCount || 0}</p>
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.grid}>
            
            <div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  BUSCAR PRODUCTO (Código o Nombre)
                </label>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onKeyDown={handleSearch}
                  style={styles.input}
                  placeholder="Escriba código o nombre y presione ENTER"
                  autoComplete="off"
                />
              </div>

              <div style={styles.productGrid}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    style={{
                      ...styles.productCard,
                      opacity: product.stock === 0 ? 0.5 : 1,
                      backgroundColor: product.stock === 0 ? '#fef2f2' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '0 0 4px 0' }}>
                          [{product.code}] {product.name}
                        </p>
                        <p style={{ color: '#2563eb', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                          S/ {product.price.toFixed(2)}
                        </p>
                        {product.category && (
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{product.category}</p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ 
                          fontSize: '14px', 
                          margin: 0,
                          color: product.stock > product.min_stock ? '#16a34a' : 
                                 product.stock > 0 ? '#ca8a04' : '#dc2626'
                        }}>
                          Stock: {product.stock}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.sidebar}>
              
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>CLIENTE</h3>
                <input
                  type="text"
                  value={customerDoc}
                  onChange={(e) => setCustomerDoc(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  placeholder="DNI/RUC"
                />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  placeholder="Nombre/Razón Social"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>COMPROBANTE</h3>
                <select
                  value={receiptType}
                  onChange={(e) => setReceiptType(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                >
                  <option value="BOLETA">BOLETA</option>
                  <option value="FACTURA">FACTURA</option>
                  <option value="TICKET">TICKET</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>CARRITO ({cart.length} items)</h3>
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {cart.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '16px 0' }}>Carrito vacío</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '8px', 
                        padding: '8px', 
                        backgroundColor: 'white', 
                        borderRadius: '4px' 
                      }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: '500', fontSize: '14px', margin: '0 0 2px 0' }}>{item.name}</p>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>S/ {item.price.toFixed(2)} c/u</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              backgroundColor: '#dc2626', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px', 
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            -
                          </button>
                          <span style={{ width: '32px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              backgroundColor: '#16a34a', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px', 
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {cart.length > 0 && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span>Subtotal:</span>
                    <span>S/ {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span>IGV (18%):</span>
                    <span>S/ {(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.18).toFixed(2)}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontWeight: 'bold', 
                    fontSize: '18px', 
                    borderTop: '1px solid #d1d5db', 
                    paddingTop: '8px',
                    marginTop: '8px'
                  }}>
                    <span>TOTAL:</span>
                    <span>S/ {(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.18).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>PAGO</h3>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                >
                  <option value="EFECTIVO">EFECTIVO</option>
                  <option value="TARJETA">TARJETA</option>
                  <option value="YAPE">YAPE</option>
                  <option value="PLIN">PLIN</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={processSale}
                  disabled={cart.length === 0 || loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    opacity: cart.length === 0 || loading ? 0.5 : 1
                  }}
                >
                  {loading ? '⏳ Procesando...' : '🖨️ PROCESAR VENTA (F2)'}
                </button>
                
                <button
                  onClick={() => {
                    setCart([])
                    setCustomerDoc('')
                    setCustomerName('')
                    searchRef.current?.focus()
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    backgroundColor: '#dc2626',
                    color: 'white'
                  }}
                >
                  🗑️ LIMPIAR (F1)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}