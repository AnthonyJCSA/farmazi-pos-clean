'use client'

import { useState, useEffect } from 'react'
import { saleService, reportService, productService } from '@/lib/database'
import { Sale, Product } from '@/lib/supabase'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface ReportsModuleProps {
  onBack: () => void
}

export default function ReportsModule({ onBack }: ReportsModuleProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [todaySales, setTodaySales] = useState<Sale[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<any>({})
  const [salesByDay, setSalesByDay] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDashboardData()
    loadSalesData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [statsData, topProductsData, lowStockData] = await Promise.all([
        reportService.getDashboardStats(),
        reportService.getTopProducts(10),
        productService.getLowStock()
      ])

      setStats(statsData)
      setTopProducts(topProductsData)
      setLowStockProducts(lowStockData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSalesData = async () => {
    try {
      const [todayData, last7Days] = await Promise.all([
        saleService.getTodaySales(),
        Promise.all(
          Array.from({ length: 7 }, (_, i) => {
            const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
            return reportService.getDashboardStats().then(data => ({
              date,
              sales: data.todaySales || 0,
              transactions: data.todayTransactions || 0
            }))
          })
        )
      ])

      setTodaySales(todayData)
      setSalesByDay(last7Days.reverse())
    } catch (error) {
      console.error('Error loading sales data:', error)
    }
  }

  const styles = {
    container: { minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '16px' },
    header: { backgroundColor: '#2563eb', color: 'white', padding: '16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    content: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', marginBottom: '16px' },
    tabs: { display: 'flex', borderBottom: '1px solid #d1d5db', marginBottom: '24px' },
    tab: { padding: '12px 24px', cursor: 'pointer', borderBottom: '2px solid transparent' },
    activeTab: { borderBottomColor: '#2563eb', color: '#2563eb', fontWeight: 'bold' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
    statCard: { backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', textAlign: 'center' as const },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { padding: '12px', backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db', textAlign: 'left' as const },
    td: { padding: '12px', borderBottom: '1px solid #d1d5db' },
    button: { padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }
  }

  const renderDashboard = () => (
    <div>
      {/* Estadísticas Principales */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={{ margin: '0 0 8px 0', color: '#16a34a' }}>Ventas Hoy</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>S/ {stats.todaySales?.toFixed(2) || '0.00'}</p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
            {stats.todayTransactions || 0} transacciones
          </p>
        </div>
        <div style={styles.statCard}>
          <h3 style={{ margin: '0 0 8px 0', color: '#2563eb' }}>Total Productos</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.totalProducts || 0}</p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>productos activos</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={{ margin: '0 0 8px 0', color: '#7c3aed' }}>Clientes</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.totalCustomers || 0}</p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>registrados</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>Stock Bajo</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.lowStockCount || 0}</p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>productos</p>
        </div>
      </div>

      {/* Gráfico de Ventas (Simulado) */}
      <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0' }}>📈 Ventas Últimos 7 Días</h3>
        <div style={{ display: 'flex', alignItems: 'end', gap: '8px', height: '200px' }}>
          {salesByDay.map((day, index) => {
            const maxSales = Math.max(...salesByDay.map(d => d.sales))
            const height = maxSales > 0 ? (day.sales / maxSales) * 160 : 20
            return (
              <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>
                  S/ {day.sales.toFixed(0)}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: `${height}px`,
                    backgroundColor: '#2563eb',
                    borderRadius: '4px 4px 0 0',
                    minHeight: '20px'
                  }}
                ></div>
                <div style={{ fontSize: '10px', marginTop: '8px', textAlign: 'center' }}>
                  {format(new Date(day.date), 'dd/MM', { locale: es })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Productos Más Vendidos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <h3 style={{ margin: '0 0 16px 0' }}>🏆 Productos Más Vendidos</h3>
          <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', overflow: 'hidden' }}>
            {topProducts.slice(0, 5).map((product, index) => (
              <div key={product.code} style={{ 
                padding: '12px 16px', 
                borderBottom: index < 4 ? '1px solid #e5e7eb' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Código: {product.code}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#2563eb' }}>{product.total_sold}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>vendidos</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 16px 0' }}>⚠️ Stock Bajo</h3>
          <div style={{ backgroundColor: '#fef3c7', borderRadius: '8px', overflow: 'hidden' }}>
            {lowStockProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} style={{ 
                padding: '12px 16px', 
                borderBottom: index < 4 ? '1px solid #f59e0b' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                  <div style={{ fontSize: '12px', color: '#92400e' }}>Código: {product.code}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#dc2626' }}>{product.stock}</div>
                  <div style={{ fontSize: '12px', color: '#92400e' }}>stock</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderSales = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>🧾 Ventas de Hoy ({todaySales.length})</h3>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>
          Total: S/ {todaySales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Número</th>
              <th style={styles.th}>Cliente</th>
              <th style={styles.th}>Tipo</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Pago</th>
              <th style={styles.th}>Hora</th>
            </tr>
          </thead>
          <tbody>
            {todaySales.map((sale) => (
              <tr key={sale.id}>
                <td style={styles.td}>{sale.sale_number}</td>
                <td style={styles.td}>{sale.customer?.name || 'Cliente General'}</td>
                <td style={styles.td}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: sale.receipt_type === 'FACTURA' ? '#dbeafe' : '#dcfce7',
                    color: sale.receipt_type === 'FACTURA' ? '#1d4ed8' : '#166534'
                  }}>
                    {sale.receipt_type}
                  </span>
                </td>
                <td style={styles.td}>
                  <strong>S/ {sale.total.toFixed(2)}</strong>
                </td>
                <td style={styles.td}>{sale.payment_method}</td>
                <td style={styles.td}>
                  {format(new Date(sale.created_at), 'HH:mm', { locale: es })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {todaySales.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
          No hay ventas registradas hoy
        </div>
      )}
    </div>
  )

  const renderProducts = () => (
    <div>
      <h3 style={{ margin: '0 0 16px 0' }}>📊 Análisis de Productos</h3>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Producto</th>
              <th style={styles.th}>Código</th>
              <th style={styles.th}>Total Vendido</th>
              <th style={styles.th}>Ingresos</th>
              <th style={styles.th}>Ranking</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((product, index) => (
              <tr key={product.code}>
                <td style={styles.td}>
                  <strong>{product.name}</strong>
                </td>
                <td style={styles.td}>{product.code}</td>
                <td style={styles.td}>
                  <strong>{product.total_sold}</strong> unidades
                </td>
                <td style={styles.td}>
                  <strong style={{ color: '#16a34a' }}>S/ {product.total_revenue?.toFixed(2) || '0.00'}</strong>
                </td>
                <td style={styles.td}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '50%',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: index < 3 ? '#fbbf24' : '#e5e7eb',
                    color: index < 3 ? '#92400e' : '#6b7280',
                    minWidth: '24px',
                    display: 'inline-block',
                    textAlign: 'center'
                  }}>
                    {index + 1}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        <div style={styles.header}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>📊 REPORTES Y ANALYTICS</h1>
            <p style={{ fontSize: '14px', margin: '4px 0 0 0' }}>Análisis en tiempo real</p>
          </div>
          <button onClick={onBack} style={{ ...styles.button, backgroundColor: 'white', color: '#2563eb' }}>
            ← Volver al POS
          </button>
        </div>

        <div style={styles.content}>
          {/* Tabs */}
          <div style={styles.tabs}>
            <div
              style={{
                ...styles.tab,
                ...(activeTab === 'dashboard' ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab('dashboard')}
            >
              📈 Dashboard
            </div>
            <div
              style={{
                ...styles.tab,
                ...(activeTab === 'sales' ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab('sales')}
            >
              🧾 Ventas
            </div>
            <div
              style={{
                ...styles.tab,
                ...(activeTab === 'products' ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab('products')}
            >
              📦 Productos
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '18px', color: '#6b7280' }}>Cargando datos...</div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'sales' && renderSales()}
              {activeTab === 'products' && renderProducts()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}