import db from '../sqlite';
import { Category } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export class CategoryRepository {
    static async findAll(organizationId: string): Promise<Category[]> {
        const sql = `
            SELECT * FROM categories 
            WHERE organization_id = ? AND is_active = 1 
            ORDER BY name ASC
        `;
        return db.query<Category>(sql, [organizationId]);
    }

    static async findById(id: string): Promise<Category | null> {
        const sql = `SELECT * FROM categories WHERE id = ?`;
        return db.queryOne<Category>(sql, [id]);
    }

    static async create(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
        const id = uuidv4();
        const now = new Date().toISOString();

        const sql = `
            INSERT INTO categories (
                id, organization_id, name, description, parent_id,
                is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(sql, [
            id,
            category.organization_id,
            category.name,
            category.description || null,
            category.parent_id || null,
            category.is_active ? 1 : 0,
            now,
            now
        ]);

        return {
            ...category,
            id,
            created_at: now,
            updated_at: now
        } as Category;
    }

    static async update(id: string, updates: Partial<Category>): Promise<void> {
        const fields: string[] = [];
        const values: any[] = [];

        Object.entries(updates).forEach(([key, value]) => {
            if (key !== 'id' && key !== 'created_at') {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        });

        if (fields.length === 0) return;

        values.push(id);

        const sql = `UPDATE categories SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`;
        db.run(sql, values);
    }

    static async delete(id: string): Promise<void> {
        const sql = `UPDATE categories SET is_active = 0, updated_at = datetime('now') WHERE id = ?`;
        db.run(sql, [id]);
    }
}
