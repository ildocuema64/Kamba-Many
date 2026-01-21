/**
 * Product Repository
 * Gestão de produtos no SQLite
 */

import db from '../sqlite';
import { Product, ProductWithCategory } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export class ProductRepository {
  /**
   * Buscar todos os produtos ativos
   */
  static async findAll(organizationId: string): Promise<ProductWithCategory[]> {
    const sql = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.organization_id = ? AND p.is_active = 1
      ORDER BY p.name ASC
    `;

    return db.query<ProductWithCategory>(sql, [organizationId]);
  }

  /**
   * Buscar produto por ID
   */
  static async findById(id: string): Promise<Product | null> {
    const sql = `SELECT * FROM products WHERE id = ? LIMIT 1`;
    return db.queryOne<Product>(sql, [id]);
  }

  /**
   * Buscar produto por código de barras
   */
  static async findByBarcode(barcode: string, organizationId: string): Promise<Product | null> {
    const sql = `
      SELECT * FROM products 
      WHERE barcode = ? AND organization_id = ? AND is_active = 1
      LIMIT 1
    `;
    return db.queryOne<Product>(sql, [barcode, organizationId]);
  }

  /**
   * Buscar produto por código
   */
  static async findByCode(code: string, organizationId: string): Promise<Product | null> {
    const sql = `
      SELECT * FROM products 
      WHERE code = ? AND organization_id = ? 
      LIMIT 1
    `;
    return db.queryOne<Product>(sql, [code, organizationId]);
  }

  /**
   * Pesquisar produtos
   */
  static async search(query: string, organizationId: string): Promise<ProductWithCategory[]> {
    const sql = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.organization_id = ? 
        AND p.is_active = 1
        AND (
          p.name LIKE ? OR 
          p.code LIKE ? OR 
          p.barcode LIKE ? OR
          p.description LIKE ?
        )
      ORDER BY p.name ASC
      LIMIT 50
    `;

    const searchTerm = `%${query}%`;
    return db.query<ProductWithCategory>(sql, [
      organizationId,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
    ]);
  }

  /**
   * Criar produto
   */
  static async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO products (
        id, organization_id, category_id, code, barcode, name, description,
        unit_price, cost_price, tax_rate, unit_type, current_stock, 
        min_stock, max_stock, is_active, image_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
      id,
      product.organization_id,
      product.category_id || null,
      product.code,
      product.barcode || null,
      product.name,
      product.description || null,
      product.unit_price,
      product.cost_price,
      product.tax_rate,
      product.unit_type,
      product.current_stock,
      product.min_stock,
      product.max_stock || null,
      product.is_active ? 1 : 0,
      product.image_url || null,
      now,
      now,
    ]);

    return {
      ...product,
      id,
      created_at: now,
      updated_at: now,
    } as Product;
  }

  /**
   * Atualizar produto
   */
  static async update(id: string, updates: Partial<Product>): Promise<void> {
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

    const sql = `UPDATE products SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`;
    db.run(sql, values);
  }

  /**
   * Atualizar stock
   */
  static async updateStock(productId: string, newStock: number): Promise<void> {
    const sql = `UPDATE products SET current_stock = ?, updated_at = datetime('now') WHERE id = ?`;
    db.run(sql, [newStock, productId]);
  }

  /**
   * Deletar produto (soft delete)
   */
  static async delete(id: string): Promise<void> {
    const sql = `UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?`;
    db.run(sql, [id]);
  }

  /**
   * Produtos com stock baixo
   */
  static async findLowStock(organizationId: string): Promise<ProductWithCategory[]> {
    const sql = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.organization_id = ? 
        AND p.is_active = 1
        AND p.current_stock <= p.min_stock
      ORDER BY p.current_stock ASC
    `;

    return db.query<ProductWithCategory>(sql, [organizationId]);
  }
}
