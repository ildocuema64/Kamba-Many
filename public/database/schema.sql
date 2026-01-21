-- ============================================
-- Sistema KAMBA Many - Schema SQLite
-- Conformidade: Decreto 74/19 e 71/25
-- ============================================

-- Tabela de Organizações/Empresas
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nif TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    fiscal_regime TEXT NOT NULL CHECK (fiscal_regime IN ('GERAL', 'SIMPLIFICADO', 'EXCLUSAO')),
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabela de Utilizadores
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'VIEWER')),
    is_active INTEGER DEFAULT 1,
    last_login TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Tabela de Assinaturas/Licenças
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL')),
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_status TEXT CHECK (payment_status IN ('PAID', 'PENDING', 'FAILED')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Tabela de Categorias de Produtos
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    parent_id TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    category_id TEXT,
    code TEXT NOT NULL,
    barcode TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    cost_price REAL DEFAULT 0 CHECK (cost_price >= 0),
    tax_rate REAL DEFAULT 14.0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
    unit_type TEXT DEFAULT 'UNIDADE',
    current_stock REAL DEFAULT 0 CHECK (current_stock >= 0),
    min_stock REAL DEFAULT 0,
    max_stock REAL,
    is_active INTEGER DEFAULT 1,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    UNIQUE(organization_id, code)
);

-- Tabela de Movimentações de Stock
CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('ENTRADA', 'SAIDA', 'AJUSTE', 'VENDA', 'DEVOLUCAO')),
    quantity REAL NOT NULL,
    unit_cost REAL,
    reference_id TEXT,
    reference_type TEXT CHECK (reference_type IN ('VENDA', 'COMPRA', 'AJUSTE', 'TRANSFERENCIA')),
    notes TEXT,
    user_id TEXT NOT NULL,
    movement_date TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    nif TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    is_active INTEGER DEFAULT 1,
    total_purchases REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE(organization_id, nif)
);

-- Tabela de Vendas (POS)
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    sale_number TEXT NOT NULL,
    user_id TEXT NOT NULL,
    customer_name TEXT,
    customer_nif TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    subtotal REAL NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount REAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount REAL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount REAL NOT NULL CHECK (total_amount >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('DINHEIRO', 'TPA', 'TRANSFERENCIA', 'MULTICAIXA', 'OUTRO')),
    payment_status TEXT DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PENDING', 'PARTIAL')),
    sale_date TEXT DEFAULT (datetime('now')),
    notes TEXT,
    is_synced INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(organization_id, sale_number)
);

-- Tabela de Itens de Venda
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_code TEXT NOT NULL,
    quantity REAL NOT NULL CHECK (quantity > 0),
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    tax_rate REAL NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 100),
    tax_amount REAL NOT NULL CHECK (tax_amount >= 0),
    discount_amount REAL DEFAULT 0 CHECK (discount_amount >= 0),
    line_total REAL NOT NULL CHECK (line_total >= 0),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tabela de Facturas (Fiscais e Não Fiscais)
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    sale_id TEXT,
    source_id TEXT, -- AGT Source ID (User Login)
    
    -- Tipo de Documento
    document_type TEXT NOT NULL CHECK (
        document_type IN (
            'FACTURA_PROFORMA',      -- Não Fiscal
            'FACTURA',                -- Fiscal
            'FACTURA_RECIBO',         -- Fiscal
            'FACTURA_SIMPLIFICADA',   -- Fiscal
            'NOTA_CREDITO',           -- Fiscal
            'NOTA_DEBITO'             -- Fiscal
        )
    ),
    is_fiscal INTEGER NOT NULL CHECK (is_fiscal IN (0, 1)),
    
    -- Numeração
    invoice_number TEXT NOT NULL,
    invoice_series TEXT,
    sequence_number INTEGER NOT NULL,
    
    -- Datas
    issue_date TEXT NOT NULL DEFAULT (datetime('now')),
    system_entry_date TEXT NOT NULL DEFAULT (datetime('now')), -- AGT System Entry Date
    due_date TEXT,
    tax_date TEXT NOT NULL DEFAULT (date('now')),
    
    -- Cliente
    customer_name TEXT NOT NULL,
    customer_nif TEXT,
    customer_address TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    
    -- Valores
    subtotal REAL NOT NULL CHECK (subtotal >= 0),
    tax_amount REAL NOT NULL CHECK (tax_amount >= 0),
    discount_amount REAL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount REAL NOT NULL CHECK (total_amount >= 0),
    
    -- Informações Fiscais (apenas para documentos fiscais)
    hash TEXT,
    hash_control TEXT, -- AGT Hash Control
    qr_code TEXT,
    atcud TEXT,  -- Código Único do Documento
    saft_export_date TEXT,
    agt_submission_date TEXT,
    agt_validation_code TEXT,
    
    -- Status
    status TEXT DEFAULT 'EMITIDA' CHECK (status IN ('RASCUNHO', 'EMITIDA', 'CANCELADA', 'ANULADA')),
    cancellation_reason TEXT,
    cancelled_at TEXT,
    
    -- Metadados
    payment_method TEXT,
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PAID', 'PENDING', 'PARTIAL', 'OVERDUE')),
    notes TEXT,
    user_id TEXT NOT NULL,
    is_synced INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(organization_id, invoice_series, sequence_number)
);

-- Tabela de Itens de Factura
CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    product_id TEXT,
    product_code TEXT NOT NULL,
    product_name TEXT NOT NULL,
    description TEXT,
    quantity REAL NOT NULL CHECK (quantity > 0),
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    tax_rate REAL NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 100),
    tax_amount REAL NOT NULL CHECK (tax_amount >= 0),
    discount_amount REAL DEFAULT 0 CHECK (discount_amount >= 0),
    line_total REAL NOT NULL CHECK (line_total >= 0),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Tabela de Notificações (NOVA)
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    user_id TEXT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PRINT', 'SYNC')),
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de Fila de Sincronização
CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
    data TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
    created_at TEXT DEFAULT (datetime('now')),
    attempted_at TEXT,
    completed_at TEXT,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'STRING' CHECK (setting_type IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON')),
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE(organization_id, setting_key)
);

-- ============================================
-- INDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dates ON subscriptions(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_products_organization ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

CREATE INDEX IF NOT EXISTS idx_sales_organization ON sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_number ON sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_sync ON sales(is_synced);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

CREATE INDEX IF NOT EXISTS idx_invoices_organization ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(document_type);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_nif ON invoices(customer_nif);
CREATE INDEX IF NOT EXISTS idx_invoices_sync ON invoices(is_synced);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);

-- ============================================
-- TRIGGERS PARA AUDITORIA E INTEGRIDADE
-- ============================================

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER IF NOT EXISTS update_organizations_timestamp 
AFTER UPDATE ON organizations
BEGIN
    UPDATE organizations SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_products_timestamp 
AFTER UPDATE ON products
BEGIN
    UPDATE products SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_sales_timestamp 
AFTER UPDATE ON sales
BEGIN
    UPDATE sales SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger para atualizar stock após venda
CREATE TRIGGER IF NOT EXISTS update_stock_after_sale 
AFTER INSERT ON sale_items
BEGIN
    UPDATE products 
    SET current_stock = current_stock - NEW.quantity,
        updated_at = datetime('now')
    WHERE id = NEW.product_id;
    
    INSERT INTO stock_movements (
        id, organization_id, product_id, movement_type, 
        quantity, reference_id, reference_type, user_id
    )
    SELECT 
        hex(randomblob(16)),
        s.organization_id,
        NEW.product_id,
        'SAIDA',
        NEW.quantity,
        NEW.sale_id,
        'VENDA',
        s.user_id
    FROM sales s
    WHERE s.id = NEW.sale_id;
END;

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View de produtos com stock baixo
CREATE VIEW IF NOT EXISTS low_stock_products AS
SELECT 
    p.*,
    c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.current_stock <= p.min_stock
  AND p.is_active = 1;

-- View de facturas com totais
CREATE VIEW IF NOT EXISTS invoice_summary AS
SELECT 
    i.id,
    i.organization_id,
    i.document_type,
    i.is_fiscal,
    i.invoice_number,
    i.issue_date,
    i.customer_name,
    i.customer_nif,
    i.total_amount,
    i.status,
    COUNT(ii.id) as item_count
FROM invoices i
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id;
