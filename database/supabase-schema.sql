-- 💊 FARMACIA POS - Supabase Schema

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 📦 PRODUCTOS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    category VARCHAR(100),
    laboratory VARCHAR(100),
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 👥 CLIENTES
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type VARCHAR(10) DEFAULT 'DNI',
    document_number VARCHAR(20),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 🧾 VENTAS
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    receipt_type VARCHAR(20) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    igv DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 🛒 DETALLE DE VENTAS
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 📊 MOVIMIENTOS DE INVENTARIO
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    movement_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(20),
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 📈 VISTA DE REPORTES DIARIOS
CREATE VIEW daily_sales AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as total_sales,
    SUM(total) as total_amount,
    AVG(total) as average_sale
FROM sales 
WHERE status = 'COMPLETED'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- 📊 VISTA DE PRODUCTOS MÁS VENDIDOS
CREATE VIEW top_products AS
SELECT 
    p.name,
    p.code,
    SUM(si.quantity) as total_sold,
    SUM(si.subtotal) as total_revenue
FROM products p
JOIN sale_items si ON p.id = si.product_id
JOIN sales s ON si.sale_id = s.id
WHERE s.status = 'COMPLETED'
GROUP BY p.id, p.name, p.code
ORDER BY total_sold DESC;

-- 🔔 VISTA DE STOCK BAJO
CREATE VIEW low_stock_products AS
SELECT 
    id, code, name, stock, min_stock, price
FROM products 
WHERE stock <= min_stock AND is_active = true
ORDER BY stock ASC;

-- 🎯 DATOS INICIALES
INSERT INTO products (code, name, price, cost_price, stock, category, laboratory) VALUES
('001', 'Paracetamol 500mg', 2.50, 1.80, 100, 'Analgésicos', 'Laboratorio A'),
('002', 'Ibuprofeno 400mg', 3.20, 2.40, 50, 'Antiinflamatorios', 'Laboratorio B'),
('003', 'Amoxicilina 500mg', 8.90, 6.50, 25, 'Antibióticos', 'Laboratorio C'),
('004', 'Vitamina C 1000mg', 15.00, 12.00, 80, 'Vitaminas', 'Laboratorio D'),
('005', 'Aspirina 100mg', 1.80, 1.20, 200, 'Analgésicos', 'Laboratorio A');

INSERT INTO customers (document_number, name) VALUES
('00000000', 'Cliente General');