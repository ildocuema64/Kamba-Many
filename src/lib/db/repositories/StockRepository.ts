import db from '../sqlite';
import { StockMovement, ProductWithCategory } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { ProductRepository } from './ProductRepository';

export class StockRepository {
    /**
     * Registar movimentação de stock
     */
    static async createMovement(movement: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement> {
        // 1. Validar e buscar produto
        const product = await ProductRepository.findById(movement.product_id);
        if (!product) throw new Error(`Produto ${movement.product_id} não encontrado`);

        // 2. Calcular novo stock
        let newStock = product.current_stock;

        // Entradas aumentam stock
        if (['ENTRADA', 'DEVOLUCAO'].includes(movement.movement_type)) {
            newStock += movement.quantity;
        }
        // Saídas diminuem stock
        else if (['SAIDA', 'VENDA', 'AJUSTE'].includes(movement.movement_type)) {
            // AJUSTE pode ser positivo ou negativo, mas aqui assumo que 'AJUSTE' como tipo de mov é "perda/saída" ou ajuste manual.
            // Para ser preciso, 'AJUSTE' deveria poder ser + ou -.
            // Se o user selecionar "Entrada", aumenta. "Saída", diminui.
            // Vou assumir que o UI passa o tipo correto.
            // Se for 'AJUSTE', verifique se é para adicionar ou remover?
            // Simplificação: AJUSTE aqui considerado como SAIDA (perda/quebra) se não especificado.
            // Mas idealmente, 'AJUSTE' pode ser entrada (sobra) ou saida (falta).
            // Vou tratar apenas pelo tipo de movimento.

            // Se quantity for negativa no input, a lógica inverte?
            // Melhor: movement_type define a operação.
            // ENTRADA: +
            // SAIDA: -
            // DEVOLUCAO: +
            // VENDA: -
            // AJUSTE: Depende. Vamos assumir que AJUSTE subtrai se for "quebra", ou o usuário escolhe "Entrada por Ajuste".

            // HACK: Se o tipo for AJUSTE, vamos checar se a quantidade é negativa (não devia ser).
            // Vamos assumir que AJUSTE remove stock (perda de inventário).
            // Se for "Ajuste de Entrada" deve usar tipo ENTRADA.
            newStock -= movement.quantity;
        }

        // 3. Atualizar Produto
        await ProductRepository.updateStock(movement.product_id, newStock);

        // 4. Inserir Movimento
        const id = uuidv4();
        const now = new Date().toISOString();

        const sql = `
            INSERT INTO stock_movements (
                id, organization_id, product_id, movement_type, quantity,
                unit_cost, reference_id, reference_type, notes, user_id,
                movement_date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(sql, [
            id,
            movement.organization_id,
            movement.product_id,
            movement.movement_type,
            movement.quantity,
            movement.unit_cost || null,
            movement.reference_id || null,
            movement.reference_type || null,
            movement.notes || null,
            movement.user_id,
            movement.movement_date,
            now
        ]);

        return {
            ...movement,
            id,
            created_at: now
        };
    }

    /**
     * Buscar histórico de movimentações
     */
    static async findMovements(organizationId: string, limit = 50): Promise<(StockMovement & { product_name: string })[]> {
        const sql = `
            SELECT 
                m.*,
                p.name as product_name
            FROM stock_movements m
            JOIN products p ON m.product_id = p.id
            WHERE m.organization_id = ?
            ORDER BY m.movement_date DESC
            LIMIT ?
        `;
        return db.query(sql, [organizationId, limit]);
    }

    /**
     * Buscar alertas de stock baixo (Reusando ProductRepository)
     */
    static async findLowStock(organizationId: string): Promise<ProductWithCategory[]> {
        return ProductRepository.findLowStock(organizationId);
    }
}
