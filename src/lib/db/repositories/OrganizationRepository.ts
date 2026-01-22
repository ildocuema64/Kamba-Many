/**
 * Organization Repository
 * Gestão de organizações/empresas no SQLite
 */

import db from '../sqlite';

export interface Organization {
    id: string;
    name: string;
    nif: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
    fiscal_regime: 'GERAL' | 'SIMPLIFICADO' | 'EXCLUSAO';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export class OrganizationRepository {
    /**
     * Buscar organização por ID
     */
    static findById(id: string): Organization | null {
        const sql = `SELECT * FROM organizations WHERE id = ? LIMIT 1`;
        const result = db.queryOne<any>(sql, [id]);

        if (!result) return null;

        return {
            ...result,
            is_active: result.is_active === 1
        };
    }

    /**
     * Buscar organização do utilizador atual
     * Útil para obter dados da empresa para facturas e SAF-T
     */
    static findByUserId(userId: string): Organization | null {
        const sql = `
            SELECT o.* FROM organizations o
            INNER JOIN users u ON u.organization_id = o.id
            WHERE u.id = ? LIMIT 1
        `;
        const result = db.queryOne<any>(sql, [userId]);

        if (!result) return null;

        return {
            ...result,
            is_active: result.is_active === 1
        };
    }

    /**
     * Atualizar dados da organização
     */
    static update(id: string, data: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>): void {
        const fields: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) {
            fields.push('name = ?');
            values.push(data.name);
        }
        if (data.nif !== undefined) {
            fields.push('nif = ?');
            values.push(data.nif);
        }
        if (data.address !== undefined) {
            fields.push('address = ?');
            values.push(data.address);
        }
        if (data.phone !== undefined) {
            fields.push('phone = ?');
            values.push(data.phone);
        }
        if (data.email !== undefined) {
            fields.push('email = ?');
            values.push(data.email);
        }
        if (data.logo_url !== undefined) {
            fields.push('logo_url = ?');
            values.push(data.logo_url);
        }
        if (data.fiscal_regime !== undefined) {
            fields.push('fiscal_regime = ?');
            values.push(data.fiscal_regime);
        }
        if (data.is_active !== undefined) {
            fields.push('is_active = ?');
            values.push(data.is_active ? 1 : 0);
        }

        if (fields.length === 0) return;

        fields.push("updated_at = datetime('now')");
        values.push(id);

        const sql = `UPDATE organizations SET ${fields.join(', ')} WHERE id = ?`;
        db.run(sql, values);
    }
}
