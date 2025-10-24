'use client'

import { useState, useEffect } from 'react'
import { productService } from '@/lib/database'
import { Product } from '@/lib/supabase'

interface InventoryModuleProps {
  onBack: () => void
  onProductsChange: () => void
}

export default function InventoryModule({ onBack, onProductsChange }: InventoryModuleProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    price: '',
    cost_price: '',
    stock: '',
    min_stock: '',
    category: '',
    laboratory: ''
  })

  useEffect(() => {
    loadProducts()
    loadLowStock()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await productService.getAll()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const loadLowStock = async () => {
    try {
      const data = await productService.getLowStock()
      setLowStockProducts(data)
    } catch (error) {
      console.error('Error loading low stock:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Verificar si Supabase está configurado
      const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                          process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
      
      if (!isConfigured) {
        alert('⚠️ Supabase no configurado. Agregue las variables de entorno en Vercel:\n\nNEXT_PUBLIC_SUPABASE_URL\nNEXT_PUBLIC_SUPABASE_ANON_KEY')
        setLoading(false)
        return
      }

      const productData = {
        code: formData.code,
        name: formData.name,
        price: parseFloat(formData.price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        stock: parseInt(formData.stock),
        min_stock: parseInt(formData.min_stock),
        category: formData.category || undefined,
        laboratory: formData.laboratory || undefined,
        is_active: true
      }

      if (editingProduct) {
        await productService.update(editingProduct.id, productData)
        alert('✅ Producto actualizado exitosamente')
      } else {
        await productService.create(productData as any)
        alert('✅ Producto creado exitosamente')
      }

      setFormData({
        code: '', name: '', price: '', cost_price: '', stock: '', min_stock: '', category: '', laboratory: ''
      })
      setShowForm(false)
      setEditingProduct(null)
      await loadProducts()
      await loadLowStock()
      onProductsChange()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('❌ Error al guardar producto: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      code: product.code,
      name: product.name,
      price: product.price.toString(),
      cost_price: product.cost_price?.toString() || '',
      stock: product.stock.toString(),
      min_stock: product.min_stock.toString(),
      category: product.category || '',
      laboratory: product.laboratory || ''
    })
    setShowForm(true)
  }

  const handleStockUpdate = async (productId: string, newStock: number) => {
    try {
      const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                          process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
      
      if (!isConfigured) {
        alert('⚠️ Supabase no configurado para actualizar stock')
        return
      }

      await productService.updateStock(productId, newStock)
      await loadProducts()
      await loadLowStock()
      onProductsChange()
      alert('✅ Stock actualizado')
    } catch (error) {
      console.error('Error updating stock:', error)
      alert('❌ Error al actualizar stock')
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const styles = {
    container: { minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '16px' },
    header: { backgroundColor: '#2563eb', color: 'white', padding: '16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    content: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', marginBottom: '16px' },
    button: { padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
    buttonPrimary: { backgroundColor: '#2563eb', color: 'white' },
    buttonSuccess: { backgroundColor: '#16a34a', color: 'white' },
    buttonDanger: { backgroundColor: '#dc2626', color: 'white' },
    input: { width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '8px' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { padding: '12px', backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db', textAlign: 'left' as const },
    td: { padding: '12px', borderBottom: '1px solid #d1d5db' }
  }

  return (
    <div style={styles.container}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        <div style={styles.header}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>📦 GESTIÓN DE INVENTARIO</h1>
            <p style={{ fontSize: '14px', margin: '4px 0 0 0' }}>Administrar productos y stock</p>
          </div>
          <button onClick={onBack} style={{ ...styles.button, backgroundColor: 'white', color: '#2563eb' }}>
            ← Volver al POS
          </button>
        </div>

        {/* Alertas de Stock Bajo */}
        {lowStockProducts.length > 0 && (
          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <h3 style={{ color: '#92400e', margin: '0 0 8px 0' }}>⚠️ PRODUCTOS CON STOCK BAJO</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {lowStockProducts.map(product => (
                <div key={product.id} style={{ fontSize: '14px' }}>
                  <strong>{product.name}</strong> - Stock: {product.stock} (Mín: {product.min_stock})
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={styles.content}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ flex: 1, marginRight: '16px' }}>
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.input}
              />
            </div>
            <button
              onClick={() => {
                setShowForm(true)
                setEditingProduct(null)
                setFormData({
                  code: '', name: '', price: '', cost_price: '', stock: '', min_stock: '', category: '', laboratory: ''
                })
              }}
              style={{ ...styles.button, ...styles.buttonSuccess }}
            >
              + Nuevo Producto
            </button>
          </div>

          {showForm && (
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0' }}>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Código *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      style={styles.input}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Nombre *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={styles.input}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Precio Venta *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      style={styles.input}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Precio Costo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Stock *</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      style={styles.input}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Stock Mínimo *</label>
                    <input
                      type="number"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                      style={styles.input}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Categoría</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Laboratorio</label>
                    <input
                      type="text"
                      value={formData.laboratory}
                      onChange={(e) => setFormData({ ...formData, laboratory: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ ...styles.button, ...styles.buttonSuccess }}
                  >
                    {loading ? 'Guardando...' : (editingProduct ? 'Actualizar' : 'Crear')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingProduct(null)
                    }}
                    style={{ ...styles.button, backgroundColor: '#6b7280', color: 'white' }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Código</th>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Categoría</th>
                  <th style={styles.th}>Stock</th>
                  <th style={styles.th}>Precio</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={styles.td}>{product.code}</td>
                    <td style={styles.td}>
                      <div>
                        <strong>{product.name}</strong>
                        {product.laboratory && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{product.laboratory}</div>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>{product.category || '-'}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          color: product.stock > product.min_stock ? '#16a34a' : 
                                 product.stock > 0 ? '#ca8a04' : '#dc2626',
                          fontWeight: 'bold'
                        }}>
                          {product.stock}
                        </span>
                        <input
                          type="number"
                          defaultValue={product.stock}
                          onBlur={(e) => {
                            const newStock = parseInt(e.target.value)
                            if (newStock !== product.stock && newStock >= 0) {
                              handleStockUpdate(product.id, newStock)
                            }
                          }}
                          style={{ width: '60px', padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                        />
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <strong>S/ {product.price.toFixed(2)}</strong>
                        {product.cost_price && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Costo: S/ {product.cost_price.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: product.stock > product.min_stock ? '#dcfce7' : 
                                        product.stock > 0 ? '#fef3c7' : '#fecaca',
                        color: product.stock > product.min_stock ? '#166534' : 
                               product.stock > 0 ? '#92400e' : '#991b1b'
                      }}>
                        {product.stock > product.min_stock ? 'Normal' : 
                         product.stock > 0 ? 'Stock Bajo' : 'Agotado'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleEdit(product)}
                        style={{ ...styles.button, ...styles.buttonPrimary, marginRight: '8px' }}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
              No se encontraron productos
            </div>
          )}
        </div>
      </div>
    </div>
  )
}