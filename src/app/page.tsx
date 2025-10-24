'use client'

import { useState, useEffect, useRef } from 'react'

interface Product {
  id: string
  code: string
  name: string
  price: number
  stock: number
}

interface CartItem extends Product {
  quantity: number
}

export default function FarmaciaPOS() {
  const [products] = useState<Product[]>([
    { id: '1', code: '001', name: 'Paracetamol 500mg', price: 2.50, stock: 100 },
    { id: '2', code: '002', name: 'Ibuprofeno 400mg', price: 3.20, stock: 50 },
    { id: '3', code: '003', name: 'Amoxicilina 500mg', price: 8.90, stock: 25 },
    { id: '4', code: '004', name: 'Vitamina C 1000mg', price: 15.00, stock: 80 },
    { id: '5', code: '005', name: 'Aspirina 100mg', price: 1.80, stock: 200 },
  ])

  const [cart, setCart] = useState<CartItem[]>([])
  const [searchCode, setSearchCode] = useState('')
  const [customerDoc, setCustomerDoc] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO')
  const [receiptType, setReceiptType] = useState('BOLETA')
  
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const product = products.find(p => p.code === searchCode || p.name.toLowerCase().includes(searchCode.toLowerCase()))
      
      if (product && product.stock > 0) {
        addToCart(product)
        setSearchCode('')
      } else {
        alert('Producto no encontrado o sin stock')
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

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

  const processSale = () => {
    if (cart.length === 0) {
      alert('Carrito vacío')
      return
    }

    const saleData = {
      type: receiptType,
      number: `${receiptType}-${Date.now()}`,
      date: new Date().toLocaleString('es-PE'),
      customer: {
        doc: customerDoc || '00000000',
        name: customerName || 'Cliente General'
      },
      items: cart,
      subtotal: subtotal.toFixed(2),
      igv: igv.toFixed(2),
      total: total.toFixed(2),
      payment: paymentMethod
    }

    printReceipt(saleData)
    
    setCart([])
    setCustomerDoc('')
    setCustomerName('')
    searchRef.current?.focus()
  }

  const printReceipt = (sale: any) => {
    const receipt = `
═══════════════════════════════════
           FARMACIA SALUD
═══════════════════════════════════
${sale.type}: ${sale.number}
Fecha: ${sale.date}
───────────────────────────────────
Cliente: ${sale.customer.name}
Doc: ${sale.customer.doc}
───────────────────────────────────
PRODUCTOS:
${sale.items.map((item: CartItem) => 
  `${item.name}
  ${item.quantity} x S/ ${item.price.toFixed(2)} = S/ ${(item.quantity * item.price).toFixed(2)}`
).join('\n')}
───────────────────────────────────
Subtotal:        S/ ${sale.subtotal}
IGV (18%):       S/ ${sale.igv}
TOTAL:           S/ ${sale.total}
───────────────────────────────────
Pago: ${sale.payment}
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
  }, [cart])

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '16px'
    },
    maxWidth: {
      maxWidth: '1280px',
      margin: '0 auto'
    },
    header: {
      backgroundColor: '#2563eb',
      color: 'white',
      padding: '16px',
      borderRadius: '8px 8px 0 0'
    },
    content: {
      backgroundColor: 'white',
      borderRadius: '0 0 8px 8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      padding: '24px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '24px'
    },
    input: {
      width: '100%',
      padding: '12px',
      fontSize: '18px',
      border: '2px solid #93c5fd',
      borderRadius: '4px',
      outline: 'none'
    },
    productGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '12px',
      marginTop: '16px'
    },
    productCard: {
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      cursor: 'pointer',
      backgroundColor: 'white'
    },
    sidebar: {
      backgroundColor: '#f9fafb',
      padding: '16px',
      borderRadius: '4px'
    },
    button: {
      width: '100%',
      padding: '12px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold'
    },
    buttonPrimary: {
      backgroundColor: '#16a34a',
      color: 'white'
    },
    buttonSecondary: {
      backgroundColor: '#dc2626',
      color: 'white'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        
        <div style={styles.header}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>💊 FARMACIA POS</h1>
          <p style={{ fontSize: '14px', margin: '4px 0 0 0' }}>F1: Nueva Venta | F2: Procesar | ESC: Limpiar</p>
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
                        <p style={{ color: '#2563eb', fontWeight: 'bold', margin: 0 }}>
                          S/ {product.price.toFixed(2)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ 
                          fontSize: '14px', 
                          margin: 0,
                          color: product.stock > 10 ? '#16a34a' : product.stock > 0 ? '#ca8a04' : '#dc2626'
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
                    <span>S/ {subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span>IGV (18%):</span>
                    <span>S/ {igv.toFixed(2)}</span>
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
                    <span>S/ {total.toFixed(2)}</span>
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
                  disabled={cart.length === 0}
                  style={{
                    ...styles.button,
                    ...styles.buttonPrimary,
                    opacity: cart.length === 0 ? 0.5 : 1
                  }}
                >
                  🖨️ PROCESAR VENTA (F2)
                </button>
                
                <button
                  onClick={() => {
                    setCart([])
                    setCustomerDoc('')
                    setCustomerName('')
                    searchRef.current?.focus()
                  }}
                  style={{
                    ...styles.button,
                    ...styles.buttonSecondary
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