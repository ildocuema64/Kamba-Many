import db from '../sqlite';
import { v4 as uuidv4 } from 'uuid';
import { NotificationType } from '@/store/notificationStore';

export interface NotificationEntity {
    id: string;
    organization_id: string;
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    is_read: number; // 0 ou 1
    created_at: string;
}

export class NotificationRepository {
    /**
     * Garante que a tabela existe
     */
    static async ensureTableExists(): Promise<void> {
        const sql = `
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                organization_id TEXT,
                user_id TEXT,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT NOT NULL,
                is_read INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            );
        `;
        // Nota: Removi foreign keys estritas por enquanto para evitar erros se organizations/users estiverem vazios no ambiente de dev inicial
        try {
            db.run(sql);
        } catch (error) {
            console.error('Erro ao criar tabela de notificações:', error);
        }
    }

    /**
     * Criar notificação
     */
    static async create(notification: Omit<NotificationEntity, 'id' | 'created_at' | 'is_read'>): Promise<NotificationEntity> {
        await this.ensureTableExists();

        const id = uuidv4();
        const now = new Date().toISOString();

        const sql = `
            INSERT INTO notifications (
                id, organization_id, user_id, title, message, type, is_read, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(sql, [
            id,
            notification.organization_id || null,
            notification.user_id || null,
            notification.title,
            notification.message,
            notification.type,
            0, // is_read false
            now
        ]);

        return {
            ...notification,
            id,
            is_read: 0,
            created_at: now
        };
    }

    /**
     * Buscar notificações de um usuário
     */
    static async getByUser(userId?: string): Promise<NotificationEntity[]> {
        await this.ensureTableExists();

        // Se não houver userId (ex: superadmin global ou dev), traz tudo ou filtra por null
        // Aqui assumimos que queremos ver todos por enquanto se userId for undefined, 
        // ou adaptar conforme a lógica de auth. 
        // Vamos buscar as últimas 50.

        let sql = `SELECT * FROM notifications`;
        const params: any[] = [];

        if (userId) {
            sql += ` WHERE user_id = ? OR user_id IS NULL`; // user_id NULL para notificações globais
            params.push(userId);
        }

        sql += ` ORDER BY created_at DESC LIMIT 50`;

        return db.query<NotificationEntity>(sql, params);
    }

    /**
     * Contar não lidas
     */
    static async getUnreadCount(userId?: string): Promise<number> {
        await this.ensureTableExists();

        let sql = `SELECT COUNT(*) as count FROM notifications WHERE is_read = 0`;
        const params: any[] = [];

        if (userId) {
            sql += ` AND (user_id = ? OR user_id IS NULL)`;
            params.push(userId);
        }

        const result = db.queryOne<{ count: number }>(sql, params);
        return result?.count || 0;
    }

    /**
     * Marcar como lida
     */
    static async markAsRead(id: string): Promise<void> {
        await this.ensureTableExists();
        const sql = `UPDATE notifications SET is_read = 1 WHERE id = ?`;
        db.run(sql, [id]);
    }

    /**
     * Marcar todas como lidas
     */
    static async markAllAsRead(userId?: string): Promise<void> {
        await this.ensureTableExists();
        let sql = `UPDATE notifications SET is_read = 1`;
        const params: any[] = [];

        if (userId) {
            sql += ` WHERE user_id = ? OR user_id IS NULL`;
            params.push(userId);
        }

        db.run(sql, params);
    }

    /**
     * Remover notificação
     */
    static async delete(id: string): Promise<void> {
        await this.ensureTableExists();
        const sql = `DELETE FROM notifications WHERE id = ?`;
        db.run(sql, [id]);
    }

    /**
     * Limpar todas
     */
    static async clearAll(userId?: string): Promise<void> {
        await this.ensureTableExists();
        let sql = `DELETE FROM notifications`;
        const params: any[] = [];

        if (userId) {
            sql += ` WHERE user_id = ?`; // Não deleta globais (NULL) por segurança, ou deleta? Vamos deletar só do user.
            params.push(userId);
        }

        db.run(sql, params);
    }
}
