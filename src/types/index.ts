/**
 * TypeScript Types - Sistema KAMBA Many
 * Tipos de dados do sistema
 */

// ============================================
// ENUMS
// ============================================

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER';
export type FiscalRegime = 'GERAL' | 'SIMPLIFICADO' | 'EXCLUSAO';
export type PlanType = 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL' | 'FAILED' | 'OVERDUE';
export type PaymentMethod = 'DINHEIRO' | 'TPA' | 'TRANSFERENCIA' | 'MULTICAIXA' | 'OUTRO';
export type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'VENDA' | 'DEVOLUCAO';
export type ReferenceType = 'VENDA' | 'COMPRA' | 'AJUSTE' | 'TRANSFERENCIA';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PRINT' | 'SYNC';

export type DocumentType =
    | 'FACTURA_PROFORMA'       // Não Fiscal
    | 'FACTURA'                // Fiscal
    | 'FACTURA_RECIBO'         // Fiscal
    | 'FACTURA_SIMPLIFICADA'   // Fiscal
    | 'NOTA_CREDITO'           // Fiscal
    | 'NOTA_DEBITO';           // Fiscal

export type InvoiceStatus = 'RASCUNHO' | 'EMITIDA' | 'CANCELADA' | 'ANULADA';

// ============================================
// ENTIDADES PRINCIPAIS
// ============================================

export interface Organization {
    id: string;
    name: string;
    nif: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
    fiscal_regime: FiscalRegime;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    organization_id: string;
    email: string;
    password_hash: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
    last_login?: string;
    created_at: string;
    updated_at: string;
}

export interface Subscription {
    id: string;
    organization_id: string;
    plan_type: PlanType;
    status: SubscriptionStatus;
    start_date: string;
    end_date: string;
    amount: number;
    payment_status?: PaymentStatus;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    organization_id: string;
    name: string;
    description?: string;
    parent_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    organization_id: string;
    category_id?: string;
    code: string;
    barcode?: string;
    name: string;
    description?: string;
    unit_price: number;
    cost_price: number;
    tax_rate: number;
    tax_exemption_code?: string;
    tax_exemption_reason?: string;
    unit_type: string;
    current_stock: number;
    min_stock: number;
    max_stock?: number;
    is_active: boolean;
    image_url?: string;
    created_at: string;
    updated_at: string;
}

export interface StockMovement {
    id: string;
    organization_id: string;
    product_id: string;
    movement_type: MovementType;
    quantity: number;
    unit_cost?: number;
    reference_id?: string;
    reference_type?: ReferenceType;
    notes?: string;
    user_id: string;
    movement_date: string;
    created_at: string;
}

export interface Sale {
    id: string;
    organization_id: string;
    sale_number: string;
    user_id: string;
    customer_name?: string;
    customer_nif?: string;
    customer_phone?: string;
    customer_email?: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    sale_date: string;
    notes?: string;
    is_synced?: boolean;
    created_at: string;
    updated_at: string;
}

export interface SaleItem {
    id: string;
    sale_id: string;
    product_id: string;
    product_name: string;
    product_code: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    tax_amount: number;
    discount_amount: number;
    line_total: number;
    created_at: string;
}

export interface Invoice {
    id: string;
    organization_id: string;
    sale_id?: string;
    source_id?: string;

    // Tipo de Documento
    document_type: DocumentType;
    is_fiscal: boolean;

    // Numeração
    invoice_number: string;
    invoice_series?: string;
    sequence_number: number;

    // Datas
    issue_date: string;
    system_entry_date: string;
    due_date?: string;
    tax_date: string;

    // Cliente
    customer_name: string;
    customer_nif?: string;
    customer_address?: string;
    customer_phone?: string;
    customer_email?: string;

    // Valores
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;

    // Informações Fiscais
    hash?: string;
    hash_control?: string;
    qr_code?: string;
    atcud?: string;
    saft_export_date?: string;
    agt_submission_date?: string;
    agt_validation_code?: string;

    // Status
    status: InvoiceStatus;
    cancellation_reason?: string;
    cancelled_at?: string;

    // Metadados
    payment_method?: PaymentMethod;
    payment_status: PaymentStatus;
    notes?: string;
    user_id: string;
    is_synced?: boolean;
    created_at: string;
    updated_at: string;
}

export interface InvoiceItem {
    id: string;
    invoice_id: string;
    product_id?: string;
    product_code: string;
    product_name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    tax_exemption_code?: string;
    tax_exemption_reason?: string;
    tax_amount: number;
    discount_amount: number;
    line_total: number;
    created_at: string;
}

export interface AuditLog {
    id: string;
    organization_id: string;
    user_id?: string;
    entity_type: string;
    entity_id: string;
    action: AuditAction;
    old_values?: string;
    new_values?: string;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

export interface SyncQueueItem {
    id: string;
    organization_id: string;
    entity_type: string;
    entity_id: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    data: string;
    retry_count: number;
    last_error?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    created_at: string;
    attempted_at?: string;
    completed_at?: string;
}

export interface SystemSetting {
    id: string;
    organization_id: string;
    setting_key: string;
    setting_value?: string;
    setting_type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface Customer {
    id: string;
    organization_id: string;
    name: string;
    nif?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    is_active: boolean;
    total_purchases: number;
    created_at: string;
    updated_at: string;
}

// ============================================
// TIPOS AUXILIARES
// ============================================

export interface CartItem {
    product: Product;
    quantity: number;
    discount: number;
}

export interface InvoiceWithItems extends Invoice {
    items: InvoiceItem[];
}

export interface SaleWithItems extends Sale {
    items: SaleItem[];
}

export interface ProductWithCategory extends Product {
    category_name?: string;
}

export interface LicenseInfo {
    isActive: boolean;
    isExpired: boolean;
    daysRemaining: number;
    subscription?: Subscription;
}

export interface DatabaseStats {
    size: number;
    lastUpdated: string | null;
    tableCount: number;
    productCount?: number;
    saleCount?: number;
    invoiceCount?: number;
}

export interface PrintSettings {
    printerName?: string;
    paperWidth: number;
    fontSize: number;
    showLogo: boolean;
    showFooter: boolean;
}
