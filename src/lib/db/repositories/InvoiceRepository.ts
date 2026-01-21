/**
 * Invoice Repository
 * Gestão de facturas no SQLite
 */

import db from '../sqlite';
import { Invoice, InvoiceItem, InvoiceWithItems, DocumentType, InvoiceStatus } from '@/types';
import { InvoiceSigner } from '@/lib/security/signer';
import { v4 as uuidv4 } from 'uuid';

// TODO: Move to environment variable or secure config
const MOCK_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCYQ6yvKCwz9h1f
BHz+s3OcbA3vSGgMZwyYSsP/NBu4r68h73jiJ8RzULS0yLcV/1FrxW4FU3KynFU6
5at95Z7lZpcUBeItCgnky2vNfA7jnNtAHTztDD1JG6uKUzcvRavxns6rYckF5pCY
A3FPZtfnAQh0qBMLGrWBmHlYR+Jk1EAJddWF/hqIzokJlmyibvrMrEcAw9fDZ453
i5q96J/cDud3yXaJoCGW0PDhx6qDE5iiLRye/M6B0S4GZMvu//NDrpqxF6+ua4s1
gcX97JMM1tn6uqzgEUqU1yq1AcZ42grJAzSrMwyktpOnCJvhGcu082ssTyteBq6Y
OlWOCuSbAgMBAAECggEATAVJw7/SZfUEkAqNH5tX5uqaAHRNopeWlbiKZ7HL/2cT
kOVfnMZPEmXievpVUrHBJIYTWqxhsSRVd0zw1LAep5kTZ+dSF7uR2f3oKlU8l86a
NsYCQ7XfKU+b0zmd7UejQ8TOmYl+VKhbW9IoMgT+WXLOFnRN4bbplTUbrIRjV4RN
99sR6B0rVxOTMnJUn5pak0Yoafuf0KfFb3FMUsPhHDr7nJM7L8Als6vrBAB90MH9
73PgE9OPF9aohBbzspzc4pWYrCRaT25zinEhLZuWlNC1AVu6huoGZ5Fm8V+O8WWT
jkgwzhmrM4BsFjxtWiHYkouC5Rtl9nB3bzi9JAlcYQKBgQDGyai3HDSrqUmMM6G7
iyalwfZFhyfMkfnsIjhXeVizDJmKOcqAVbxbrnUfvVx0Fcsr3RZdZiS4yhtn8RC4
wgX1upm71uvRJV9cItYCgedqFUaldEQdDY/gokOL6zf0N0XWQkndTPkA1TcSGZqG
UfUiZQAB/nNhmhqG/IdzaEu/4QKBgQDEFkCfwGpttZiZkRMTOdUy9c7ISxu1+T6c
s87bmfc2Y4shosKrTiHYCXLbUVrfupyBleyfh64RSUVJoaY2FMzlzmGf0k3mQlhs
a6ZxRQk5GL3w2ziMCdDVyGhbtlianAS6YK264pM2S+xuzCdVIJ0/pvWIFhdhvaT3
cXLbqcoj+wKBgFF0+wylozOgeAHaenCmUZzkwSy2eGmMe7P2Rc4abG1aQWRxz/gM
qdWLxHTQHJ14/Lspqmt1WqDaOKa8EpUS9GxAHZTqOdGHFe9kWvvGDXTb6QoNfYfG
Menjs/gW1+Pb7mMg4LGtQ+/CbwGcukRGO0PvzTQD93XMNwiPXFW/LCMhAoGBAJQf
Qx3qGftZ7DZE8qXZUAW4zUVcB0jFSNjSsvYMLkR1mYoFCwygbsxlBtBJel3693Kk
MCSqN4FzWdWvOIEt4UHPTsuN7656e5UbFJYH0lnBKOoij2qpl4mGY96ztebE6IVp
tpKvyQiA/c8MhMG3a1HD60Grfmok+dK5bkwkzD+1AoGAeuGstQABXkneh/eAMVn1
u+XEP9JT9hpvSySfTOZUvmnA4fMRkmUEd15Tj/HMNj/XGAKsBCMs3EvMkwrWXJ+5
Zj1KLma9hjA7+m04NmOwrpZOrMEBW7V9CmOHHFfgDvvAkte4i68IpIiN3tSS1uEO
CK6Ep9FKoUVq2aLvai7/tGw=
-----END PRIVATE KEY-----`; // Valid PKCS#8 Key

export interface InvoiceFilters {
    documentType?: DocumentType;
    status?: InvoiceStatus;
    startDate?: string;
    endDate?: string;
    customerSearch?: string;
}

export interface InvoiceStats {
    total: number;
    emitidas: number;
    canceladas: number;
    pendingPayment: number;
    todayTotal: number;
    monthTotal: number;
}

export class InvoiceRepository {
    /**
     * Gerar próximo número de factura
     */
    static async getNextInvoiceNumber(
        organizationId: string,
        documentType: DocumentType
    ): Promise<{ number: string; sequence: number; series: string }> {
        const year = new Date().getFullYear();
        const typePrefix = this.getDocTypePrefix(documentType);
        const series = `${typePrefix}${year}`;

        const sql = `
            SELECT COALESCE(MAX(sequence_number), 0) + 1 as next_sequence 
            FROM invoices 
            WHERE organization_id = ? AND invoice_series = ?
        `;

        const result = await db.queryOne<{ next_sequence: number }>(sql, [organizationId, series]);
        const sequence = result?.next_sequence || 1;
        const number = `${series}/${String(sequence).padStart(6, '0')}`;

        return { number, sequence, series };
    }

    /**
     * Prefixo por tipo de documento
     */
    private static getDocTypePrefix(type: DocumentType): string {
        const prefixes: Record<DocumentType, string> = {
            'FACTURA': 'FT',
            'FACTURA_RECIBO': 'FR',
            'FACTURA_SIMPLIFICADA': 'FS',
            'FACTURA_PROFORMA': 'PF',
            'NOTA_CREDITO': 'NC',
            'NOTA_DEBITO': 'ND'
        };
        return prefixes[type] || 'FT';
    }

    /**
     * Criar factura com itens
     */
    static async create(
        invoice: Omit<Invoice, 'id' | 'invoice_number' | 'invoice_series' | 'sequence_number' | 'created_at' | 'updated_at'>,
        items: Array<{
            product_id?: string;
            product_code: string;
            product_name: string;
            description?: string;
            quantity: number;
            unit_price: number;
            tax_rate: number;
            discount_amount: number;
            tax_exemption_code?: string;
            tax_exemption_reason?: string;
        }>
    ): Promise<Invoice> {
        const id = uuidv4();
        const now = new Date().toISOString();
        const { number, sequence, series } = await this.getNextInvoiceNumber(
            invoice.organization_id,
            invoice.document_type
        );

        // Determinar se é fiscal
        const isFiscal = invoice.document_type !== 'FACTURA_PROFORMA';

        // 1. Get Previous Hash
        const previousInvoiceSql = `
            SELECT hash FROM invoices 
            WHERE organization_id = ? AND invoice_series = ? AND document_type = ?
            ORDER BY sequence_number DESC LIMIT 1
        `;
        const previousInvoice = await db.queryOne<{ hash: string }>(previousInvoiceSql, [
            invoice.organization_id,
            series,
            invoice.document_type
        ]);
        const previousHash = previousInvoice?.hash || '';

        // 2. Prepare Data for Signing
        const incompleteInvoice = {
            ...invoice,
            id,
            invoice_number: number,
            invoice_series: series,
            sequence_number: sequence,
            is_fiscal: isFiscal,
            issue_date: invoice.issue_date,
            system_entry_date: now,
            total_amount: invoice.total_amount
        } as Invoice;

        // 3. Generate Hash if Fiscal
        let hash = '';
        let hashControl = '';

        if (isFiscal) {
            try {
                // In production, load this from secure storage
                const privateKey = process.env.AGT_PRIVATE_KEY || MOCK_PRIVATE_KEY;
                hash = await InvoiceSigner.generateHash(incompleteInvoice, previousHash, privateKey);
                hashControl = '1'; // Key Version
            } catch (err) {
                console.error('Failed to sign invoice:', err);
                throw new Error('Erro ao assinar documento fiscal. Verifique a configuração de chaves.');
            }
        }

        // 4. Insert Invoice
        const invoiceSql = `
            INSERT INTO invoices (
                id, organization_id, sale_id, source_id, document_type, is_fiscal,
                invoice_number, invoice_series, sequence_number,
                issue_date, system_entry_date, due_date, tax_date,
                customer_name, customer_nif, customer_address, customer_phone, customer_email,
                subtotal, tax_amount, discount_amount, total_amount,
                hash, hash_control, qr_code, atcud,
                status, payment_method, payment_status, notes, user_id,
                is_synced, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(invoiceSql, [
            id,
            invoice.organization_id,
            invoice.sale_id || null,
            invoice.source_id || null, // New field
            invoice.document_type,
            isFiscal ? 1 : 0,
            number,
            series,
            sequence,
            invoice.issue_date,
            now, // system_entry_date
            invoice.due_date || null,
            invoice.tax_date,
            invoice.customer_name,
            invoice.customer_nif || null,
            invoice.customer_address || null,
            invoice.customer_phone || null,
            invoice.customer_email || null,
            invoice.subtotal,
            invoice.tax_amount,
            invoice.discount_amount,
            invoice.total_amount,
            hash || null,
            hashControl || null,
            invoice.qr_code || null,
            invoice.atcud || null,
            invoice.status || 'EMITIDA',
            invoice.payment_method || null,
            invoice.payment_status,
            invoice.notes || null,
            invoice.user_id,
            0, // is_synced
            now,
            now
        ]);

        // 5. Insert invoice items
        for (const item of items) {
            const itemId = uuidv4();
            const taxAmount = (item.unit_price * item.quantity - item.discount_amount) * (item.tax_rate / 100);
            const lineTotal = item.unit_price * item.quantity - item.discount_amount + taxAmount;

            const itemSql = `
                INSERT INTO invoice_items (
                    id, invoice_id, product_id, product_code, product_name,
                    description, quantity, unit_price, tax_rate, tax_exemption_code, tax_exemption_reason,
                    tax_amount, discount_amount, line_total, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             `;

            db.run(itemSql, [
                itemId,
                id,
                item.product_id || null,
                item.product_code,
                item.product_name,
                item.description || null,
                item.quantity,
                item.unit_price,
                item.tax_rate,
                item.tax_exemption_code || null,
                item.tax_exemption_reason || null,
                taxAmount,
                item.discount_amount,
                lineTotal,
                now
            ]);
        }

        return {
            ...invoice,
            id,
            invoice_number: number,
            invoice_series: series,
            sequence_number: sequence,
            is_fiscal: isFiscal,
            created_at: now,
            updated_at: now
        } as Invoice;
    }

    /**
     * Buscar todas as facturas com filtros
     */
    static async findAll(organizationId: string, filters?: InvoiceFilters): Promise<Invoice[]> {
        let sql = `
            SELECT * FROM invoices 
            WHERE organization_id = ?
        `;
        const params: any[] = [organizationId];

        if (filters?.documentType) {
            sql += ` AND document_type = ?`;
            params.push(filters.documentType);
        }

        if (filters?.status) {
            sql += ` AND status = ?`;
            params.push(filters.status);
        }

        if (filters?.startDate) {
            sql += ` AND date(issue_date) >= date(?)`;
            params.push(filters.startDate);
        }

        if (filters?.endDate) {
            sql += ` AND date(issue_date) <= date(?)`;
            params.push(filters.endDate);
        }

        if (filters?.customerSearch) {
            sql += ` AND (customer_name LIKE ? OR customer_nif LIKE ?)`;
            const search = `%${filters.customerSearch}%`;
            params.push(search, search);
        }

        sql += ` ORDER BY issue_date DESC LIMIT 100`;

        return db.query<Invoice>(sql, params);
    }

    /**
     * Buscar factura por ID
     */
    static async findById(id: string): Promise<Invoice | null> {
        const sql = `SELECT * FROM invoices WHERE id = ? LIMIT 1`;
        return db.queryOne<Invoice>(sql, [id]);
    }

    /**
     * Buscar factura com itens
     */
    static async findByIdWithItems(id: string): Promise<InvoiceWithItems | null> {
        const invoice = await this.findById(id);
        if (!invoice) return null;

        const items = await this.findItems(id);
        return { ...invoice, items };
    }

    /**
     * Buscar itens de uma factura
     */
    static async findItems(invoiceId: string): Promise<InvoiceItem[]> {
        const sql = `SELECT * FROM invoice_items WHERE invoice_id = ?`;
        return db.query<InvoiceItem>(sql, [invoiceId]);
    }

    /**
     * Anular factura
     */
    static async cancel(id: string, reason: string, userId: string, organizationId: string): Promise<void> {
        const now = new Date().toISOString();

        // 1. Get invoice items to restore stock
        const items = await this.findItems(id);

        // 2. Restore stock for each item
        const { StockRepository } = await import('./StockRepository'); // Dynamic import to avoid circular dependency if any

        for (const item of items) {
            if (item.product_id) {
                await StockRepository.createMovement({
                    organization_id: organizationId,
                    product_id: item.product_id,
                    movement_type: 'DEVOLUCAO', // Restores stock
                    quantity: item.quantity,
                    user_id: userId,
                    movement_date: now,
                    notes: `Anulação da factura ${id}: ${reason}`,
                    reference_id: id,
                    reference_type: 'VENDA'
                });
            }
        }

        // 3. Update invoice status
        const sql = `
            UPDATE invoices 
            SET status = 'ANULADA', 
                cancellation_reason = ?, 
                cancelled_at = ?,
                updated_at = ?
            WHERE id = ?
        `;
        db.run(sql, [reason, now, now, id]);
    }

    /**
     * Estatísticas de facturas
     */
    static async getStats(organizationId: string): Promise<InvoiceStats> {
        const today = new Date().toISOString().split('T')[0];
        const firstDayOfMonth = today.substring(0, 8) + '01';

        // Total de facturas
        const totalSql = `SELECT COUNT(*) as count FROM invoices WHERE organization_id = ?`;
        const totalResult = await db.queryOne<{ count: number }>(totalSql, [organizationId]);

        // Emitidas
        const emitidasSql = `SELECT COUNT(*) as count FROM invoices WHERE organization_id = ? AND status = 'EMITIDA'`;
        const emitidasResult = await db.queryOne<{ count: number }>(emitidasSql, [organizationId]);

        // Canceladas
        const canceladasSql = `SELECT COUNT(*) as count FROM invoices WHERE organization_id = ? AND status = 'CANCELADA'`;
        const canceladasResult = await db.queryOne<{ count: number }>(canceladasSql, [organizationId]);

        // Pendentes de pagamento
        const pendingSql = `SELECT COUNT(*) as count FROM invoices WHERE organization_id = ? AND payment_status = 'PENDING'`;
        const pendingResult = await db.queryOne<{ count: number }>(pendingSql, [organizationId]);

        // Total hoje
        const todaySql = `
            SELECT COALESCE(SUM(total_amount), 0) as total 
            FROM invoices 
            WHERE organization_id = ? AND date(issue_date) = date(?) AND status = 'EMITIDA'
        `;
        const todayResult = await db.queryOne<{ total: number }>(todaySql, [organizationId, today]);

        // Total do mês
        const monthSql = `
            SELECT COALESCE(SUM(total_amount), 0) as total 
            FROM invoices 
            WHERE organization_id = ? AND date(issue_date) >= date(?) AND status = 'EMITIDA'
        `;
        const monthResult = await db.queryOne<{ total: number }>(monthSql, [organizationId, firstDayOfMonth]);

        return {
            total: totalResult?.count || 0,
            emitidas: emitidasResult?.count || 0,
            canceladas: canceladasResult?.count || 0,
            pendingPayment: pendingResult?.count || 0,
            todayTotal: todayResult?.total || 0,
            monthTotal: monthResult?.total || 0
        };
    }
}
