# 💊 FarmaZi POS - Sistema Completo de Farmacia

Sistema profesional de punto de venta para farmacias con gestión completa de inventario y reportes en tiempo real.

## 🚀 Características Completas

### ⚡ POS (Punto de Venta)
- Venta ultra-rápida con atajos de teclado (F1, F2, ESC)
- Búsqueda instantánea por código o nombre
- Control automático de stock en tiempo real
- Emisión de comprobantes (Boleta, Factura, Ticket)
- Gestión de clientes integrada
- Múltiples métodos de pago

### 📦 Gestión de Inventario
- CRUD completo de productos
- Control de stock con alertas automáticas
- Gestión de categorías y laboratorios
- Actualización de precios en tiempo real
- Alertas de productos por vencer
- Trazabilidad completa de movimientos

### 📊 Reportes y Analytics
- Dashboard en tiempo real con métricas clave
- Análisis de ventas diarias
- Productos más vendidos
- Control de stock bajo
- Gráficos de tendencias
- Reportes exportables

### 👥 Gestión de Clientes
- Base de datos completa de clientes
- Historial de compras
- Búsqueda por documento
- Creación automática en ventas

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 + TypeScript
- **Base de Datos**: Supabase (PostgreSQL)
- **Tiempo Real**: Supabase Realtime
- **Despliegue**: Vercel
- **UI**: Estilos inline optimizados

## 🚀 Instalación

### 1. Clonar repositorio
```bash
git clone <repo-url>
cd farmazi-clean
```

### 2. Configurar Supabase
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar el esquema: `database/supabase-schema.sql`
3. Copiar URL y API Key

### 3. Variables de entorno
```bash
cp .env.example .env.local
```

Editar `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_key
```

### 4. Instalar y ejecutar
```bash
npm install
npm run dev
```

## ⌨️ Atajos de Teclado

- **F1**: Nueva venta (limpiar todo)
- **F2**: Procesar venta e imprimir
- **ESC**: Limpiar búsqueda y enfocar
- **ENTER**: Agregar producto al carrito

## 📱 Uso Rápido

### Venta en 3 pasos:
1. **Buscar**: Escribir código/nombre → ENTER
2. **Revisar**: Producto se agrega automáticamente
3. **Procesar**: F2 → Imprime comprobante automáticamente

### Gestión de Inventario:
1. **Crear productos**: Formulario completo con validaciones
2. **Actualizar stock**: Click directo en la tabla
3. **Alertas automáticas**: Stock bajo destacado
4. **Edición rápida**: Click en "Editar" para modificar

### Reportes en Tiempo Real:
1. **Dashboard**: Métricas actualizadas automáticamente
2. **Análisis de ventas**: Gráficos de últimos 7 días
3. **Top productos**: Ranking de más vendidos
4. **Control de stock**: Alertas de productos críticos

## 🗄️ Base de Datos

### Tablas principales:
- `products` - Productos con stock y categorías
- `customers` - Clientes con historial
- `sales` - Ventas con numeración automática
- `sale_items` - Detalle de cada venta
- `inventory_movements` - Trazabilidad completa

### Vistas automáticas:
- `daily_sales` - Resumen diario de ventas
- `top_products` - Productos más vendidos
- `low_stock_products` - Alertas de stock bajo

## 🚀 Despliegue en Vercel

### Variables de entorno requeridas:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Deploy automático:
```bash
git push origin main
```

## 📊 Funcionalidades Implementadas

### ✅ Completado
- [x] POS completo con base de datos real
- [x] Gestión completa de inventario (CRUD)
- [x] Reportes en tiempo real con gráficos
- [x] Control automático de stock
- [x] Emisión de comprobantes profesionales
- [x] Gestión de clientes integrada
- [x] Dashboard con métricas en vivo
- [x] Alertas de stock bajo automáticas
- [x] Búsqueda instantánea optimizada
- [x] Atajos de teclado para velocidad
- [x] Trazabilidad completa de movimientos

### 🚧 Próximas mejoras
- [ ] Códigos de barras
- [ ] Integración SUNAT
- [ ] Notificaciones push
- [ ] Gestión de proveedores
- [ ] Módulo de compras
- [ ] Reportes avanzados PDF

## 💡 Características Técnicas

### Optimizaciones:
- **Búsqueda instantánea** sin lag
- **Updates en tiempo real** de stock
- **Interfaz responsive** para todos los dispositivos
- **Carga rápida** con Next.js 14
- **Base de datos optimizada** con índices

### Seguridad:
- **Validaciones** en frontend y backend
- **Transacciones atómicas** para ventas
- **Control de stock** para evitar sobreventa
- **Trazabilidad completa** de todas las operaciones

---

**Sistema profesional desarrollado para farmacias modernas** 💊