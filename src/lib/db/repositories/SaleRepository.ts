/**
 * Sale Repository
 * Gestão de vendas no SQLite
 */

import db from '../sqlite';
import { Sale, SaleItem, DocumentType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

import { InvoiceRepository } from './InvoiceRepository';

// Tipos de documento de venda (excluindo Proformas, NC, ND que são criados separadamente)
export type SaleDocumentType = 'FACTURA' | 'FACTURA_RECIBO' | 'FACTURA_SIMPLIFICADA';

export class SaleRepository {
    /**
     * Gerar próximo número de venda
     */
    static async getNextSaleNumber(organizationId: string): Promise<string> {
        const sql = `
            SELECT COUNT(*) + 1 as next_number 
            FROM sales 
            WHERE organization_id = ?
        `;
        const result = await db.queryOne<{ next_number: number }>(sql, [organizationId]);
        const number = result?.next_number || 1;
        const year = new Date().getFullYear();
        return `VND${year}/${String(number).padStart(6, '0')}`;
    }

    /**
     * Criar venda com itens
     * @param documentType - Tipo de documento fiscal a emitir (FT, FR, FS)
     */
    static async create(
        sale: Omit<Sale, 'id' | 'sale_number' | 'created_at' | 'updated_at'>,
        items: Array<{
            product_id: string;
            product_name: string;
            product_code: string;
            quantity: number;
            unit_price: number;
            tax_rate: number;
            discount_amount: number;
        }>,
        documentType: SaleDocumentType = 'FACTURA_RECIBO'
    ): Promise<Sale> {
        const id = uuidv4();
        const now = new Date().toISOString();
        const saleNumber = await this.getNextSaleNumber(sale.organization_id);

        // Insert sale
        const saleSql = `
            INSERT INTO sales (
                id, organization_id, sale_number, user_id,
                customer_name, customer_nif, customer_phone, customer_email,
                subtotal, tax_amount, discount_amount, total_amount,
                payment_method, payment_status, sale_date, notes,
                is_synced, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(saleSql, [
            id,
            sale.organization_id,
            saleNumber,
            sale.user_id,
            sale.customer_name || null,
            sale.customer_nif || null,
            sale.customer_phone || null,
            sale.customer_email || null,
            sale.subtotal,
            sale.tax_amount,
            sale.discount_amount,
            sale.total_amount,
            sale.payment_method,
            sale.payment_status,
            sale.sale_date,
            sale.notes || null,
            0, // is_synced
            now,
            now
        ]);

        // Insert sale items
        for (const item of items) {
            const itemId = uuidv4();
            const taxAmount = (item.unit_price * item.quantity - item.discount_amount) * (item.tax_rate / 100);
            const lineTotal = item.unit_price * item.quantity - item.discount_amount + taxAmount;

            const itemSql = `
                INSERT INTO sale_items (
                    id, sale_id, product_id, product_name, product_code,
                    quantity, unit_price, tax_rate, tax_amount,
                    discount_amount, line_total, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.run(itemSql, [
                itemId,
                id,
                item.product_id,
                item.product_name,
                item.product_code,
                item.quantity,
                item.unit_price,
                item.tax_rate,
                taxAmount,
                item.discount_amount,
                lineTotal,
                now
            ]);
        }



        // Create associated Invoice
        try {
            const invoice = await InvoiceRepository.create({
                organization_id: sale.organization_id,
                sale_id: id,
                document_type: documentType, // Usa o tipo de documento selecionado pelo utilizador
                customer_name: sale.customer_name || 'Consumidor Final',
                customer_nif: sale.customer_nif,
                customer_phone: sale.customer_phone,
                customer_email: sale.customer_email,
                subtotal: sale.subtotal,
                tax_amount: sale.tax_amount,
                discount_amount: sale.discount_amount,
                total_amount: sale.total_amount,
                payment_method: sale.payment_method,
                payment_status: sale.payment_status,
                tax_date: now,
                issue_date: now,
                status: 'EMITIDA',
                user_id: sale.user_id,
                notes: sale.notes,
                is_fiscal: true,
                system_entry_date: now
            }, items.map(item => ({
                product_id: item.product_id,
                product_code: item.product_code,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                discount_amount: item.discount_amount
            })));

            return {
                ...sale,
                id,
                sale_number: saleNumber,
                created_at: now,
                updated_at: now,
                invoice_id: invoice.id // Attach invoice ID
            } as Sale & { invoice_id: string };

        } catch (error) {
            console.error('Error creating invoice for sale:', error);
            // Fallback: return sale without invoice_id if detailed error handling not required yet
            return {
                ...sale,
                id,
                sale_number: saleNumber,
                created_at: now,
                updated_at: now
            } as Sale;
        }
    }

    /**
     * Buscar todas as vendas
     */
    static async findAll(organizationId: string): Promise<Sale[]> {
        const sql = `
            SELECT * FROM sales 
            WHERE organization_id = ? 
            ORDER BY sale_date DESC
        `;
        return db.query<Sale>(sql, [organizationId]);
    }

    /**
     * Buscar venda por ID
     */
    static async findById(id: string): Promise<Sale | null> {
        const sql = `SELECT * FROM sales WHERE id = ? LIMIT 1`;
        return db.queryOne<Sale>(sql, [id]);
    }

    /**
     * Buscar itens de uma venda
     */
    static async findItems(saleId: string): Promise<SaleItem[]> {
        const sql = `SELECT * FROM sale_items WHERE sale_id = ?`;
        return db.query<SaleItem>(sql, [saleId]);
    }

    /**
     * Vendas de hoje
     */
    static async findTodaySales(organizationId: string): Promise<Sale[]> {
        const today = new Date().toISOString().split('T')[0];
        const sql = `
            SELECT * FROM sales 
            WHERE organization_id = ? 
            AND date(sale_date) = date(?)
            ORDER BY sale_date DESC
        `;
        return db.query<Sale>(sql, [organizationId, today]);
    }

    /**
     * Total de vendas hoje
     */
    static async getTodayTotal(organizationId: string): Promise<number> {
        const today = new Date().toISOString().split('T')[0];
        const sql = `
            SELECT COALESCE(SUM(total_amount), 0) as total 
            FROM sales 
            WHERE organization_id = ? 
            AND date(sale_date) = date(?)
            AND payment_status = 'PAID'
        `;
        const result = await db.queryOne<{ total: number }>(sql, [organizationId, today]);
        return result?.total || 0;
    }
}
