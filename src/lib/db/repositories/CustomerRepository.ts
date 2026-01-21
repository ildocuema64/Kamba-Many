/**
 * Customer Repository
 * Gestão de clientes no SQLite
 */

import db from '../sqlite';
import { Customer } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface CustomerFilters {
    search?: string;
    isActive?: boolean;
}

export interface CustomerStats {
    total: number;
    active: number;
    withNif: number;
    totalPurchases: number;
}

export class CustomerRepository {
    /**
     * Criar cliente
     */
    static async create(customer: Omit<Customer, 'id' | 'total_purchases' | 'created_at' | 'updated_at'>): Promise<Customer> {
        const id = uuidv4();
        const now = new Date().toISOString();

        const sql = `
            INSERT INTO customers (
                id, organization_id, name, nif, email, phone, 
                address, notes, is_active, total_purchases, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(sql, [
            id,
            customer.organization_id,
            customer.name,
            customer.nif || null,
            customer.email || null,
            customer.phone || null,
            customer.address || null,
            customer.notes || null,
            customer.is_active ? 1 : 0,
            0, // total_purchases
            now,
            now
        ]);

        return {
            ...customer,
            id,
            total_purchases: 0,
            created_at: now,
            updated_at: now
        };
    }

    /**
     * Buscar todos os clientes com filtros
     */
    static async findAll(organizationId: string, filters?: CustomerFilters): Promise<Customer[]> {
        let sql = `
            SELECT * FROM customers 
            WHERE organization_id = ?
        `;
        const params: any[] = [organizationId];

        if (filters?.isActive !== undefined) {
            sql += ` AND is_active = ?`;
            params.push(filters.isActive ? 1 : 0);
        }

        if (filters?.search) {
            sql += ` AND (name LIKE ? OR nif LIKE ? OR email LIKE ? OR phone LIKE ?)`;
            const search = `%${filters.search}%`;
            params.push(search, search, search, search);
        }

        sql += ` ORDER BY name ASC LIMIT 100`;

        return db.query<Customer>(sql, params);
    }

    /**
     * Buscar cliente por ID
     */
    static async findById(id: string): Promise<Customer | null> {
        const sql = `SELECT * FROM customers WHERE id = ? LIMIT 1`;
        return db.queryOne<Customer>(sql, [id]);
    }

    /**
     * Buscar cliente por NIF
     */
    static async findByNif(nif: string, organizationId: string): Promise<Customer | null> {
        const sql = `SELECT * FROM customers WHERE nif = ? AND organization_id = ? LIMIT 1`;
        return db.queryOne<Customer>(sql, [nif, organizationId]);
    }

    /**
     * Pesquisar clientes (autocomplete)
     */
    static async search(query: string, organizationId: string): Promise<Customer[]> {
        const sql = `
            SELECT * FROM customers 
            WHERE organization_id = ? 
              AND is_active = 1
              AND (name LIKE ? OR nif LIKE ? OR phone LIKE ?)
            ORDER BY name ASC
            LIMIT 10
        `;
        const search = `%${query}%`;
        return db.query<Customer>(sql, [organizationId, search, search, search]);
    }

    /**
     * Atualizar cliente
     */
    static async update(id: string, updates: Partial<Customer>): Promise<void> {
        const fields: string[] = [];
        const values: any[] = [];

        Object.entries(updates).forEach(([key, value]) => {
            if (key !== 'id' && key !== 'created_at' && key !== 'organization_id') {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        });

        if (fields.length === 0) return;

        values.push(id);

        const sql = `UPDATE customers SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`;
        db.run(sql, values);
    }

    /**
     * Incrementar total de compras
     */
    static async incrementPurchases(id: string, amount: number): Promise<void> {
        const sql = `UPDATE customers SET total_purchases = total_purchases + ?, updated_at = datetime('now') WHERE id = ?`;
        db.run(sql, [amount, id]);
    }

    /**
     * Desativar cliente (soft delete)
     */
    static async delete(id: string): Promise<void> {
        const sql = `UPDATE customers SET is_active = 0, updated_at = datetime('now') WHERE id = ?`;
        db.run(sql, [id]);
    }

    /**
     * Estatísticas de clientes
     */
    static async getStats(organizationId: string): Promise<CustomerStats> {
        // Total
        const totalSql = `SELECT COUNT(*) as count FROM customers WHERE organization_id = ?`;
        const totalResult = await db.queryOne<{ count: number }>(totalSql, [organizationId]);

        // Ativos
        const activeSql = `SELECT COUNT(*) as count FROM customers WHERE organization_id = ? AND is_active = 1`;
        const activeResult = await db.queryOne<{ count: number }>(activeSql, [organizationId]);

        // Com NIF
        const nifSql = `SELECT COUNT(*) as count FROM customers WHERE organization_id = ? AND nif IS NOT NULL AND nif != ''`;
        const nifResult = await db.queryOne<{ count: number }>(nifSql, [organizationId]);

        // Total de compras
        const purchasesSql = `SELECT COALESCE(SUM(total_purchases), 0) as total FROM customers WHERE organization_id = ?`;
        const purchasesResult = await db.queryOne<{ total: number }>(purchasesSql, [organizationId]);

        return {
            total: totalResult?.count || 0,
            active: activeResult?.count || 0,
            withNif: nifResult?.count || 0,
            totalPurchases: purchasesResult?.total || 0
        };
    }
}
