/**
 * SQLite Database Manager - Offline First
 * Gestão da base de dados local usando sql.js (SQLite WASM)
 */

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

class SQLiteManager {
    private static instance: SQLiteManager;
    private SQL: SqlJsStatic | null = null;
    private db: Database | null = null;
    private isInitialized = false;
    private listeners: (() => void)[] = [];

    private constructor() { }

    static getInstance(): SQLiteManager {
        if (!SQLiteManager.instance) {
            SQLiteManager.instance = new SQLiteManager();
        }
        return SQLiteManager.instance;
    }

    /**
     * Inscreve-se para mudanças na base de dados
     * @param listener Função a ser chamada quando houver mudanças
     * @returns Função para cancelar a inscrição
     */
    subscribe(listener: () => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Notifica todos os ouvintes sobre mudanças
     */
    private notifyChange() {
        this.listeners.forEach(listener => listener());
    }

    /**
     * Inicializa o SQLite WASM e a base de dados
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Carregar sql.js
            this.SQL = await initSqlJs({
                locateFile: (file) => `/sql-wasm/${file}`,
            });

            // Tentar carregar base de dados existente do localStorage
            const savedDb = this.loadFromStorage();

            if (savedDb) {
                this.db = new this.SQL.Database(savedDb);
                console.log('✓ Base de dados carregada do armazenamento local');

                // Migration Check: Ensure new AGT columns exist in invoices (for existing databases)
                try {
                    // 1. Invoices Table Migrations
                    const invoiceCols = this.query("PRAGMA table_info(invoices)");

                    if (!invoiceCols.some((col: any) => col.name === 'source_id')) {
                        console.log('Running migration: Adding source_id to invoices');
                        this.db.run("ALTER TABLE invoices ADD COLUMN source_id TEXT");
                    }

                    if (!invoiceCols.some((col: any) => col.name === 'system_entry_date')) {
                        console.log('Running migration: Adding system_entry_date to invoices');
                        this.db.run("ALTER TABLE invoices ADD COLUMN system_entry_date TEXT");
                    }

                    if (!invoiceCols.some((col: any) => col.name === 'hash_control')) {
                        console.log('Running migration: Adding hash_control to invoices');
                        this.db.run("ALTER TABLE invoices ADD COLUMN hash_control TEXT");
                    }

                    // 2. Invoice Items Table Migrations
                    const itemCols = this.query("PRAGMA table_info(invoice_items)");

                    if (!itemCols.some((col: any) => col.name === 'tax_exemption_code')) {
                        console.log('Running migration: Adding tax_exemption_code to invoice_items');
                        this.db.run("ALTER TABLE invoice_items ADD COLUMN tax_exemption_code TEXT");
                    }


                    if (!itemCols.some((col: any) => col.name === 'tax_exemption_reason')) {
                        console.log('Running migration: Adding tax_exemption_reason to invoice_items');
                        this.db.run("ALTER TABLE invoice_items ADD COLUMN tax_exemption_reason TEXT");
                    }



                    // 4. Subscription Tables Migration - Create if not exist
                    const tables = this.query<{ name: string }>(
                        "SELECT name FROM sqlite_master WHERE type='table'"
                    );
                    const tableNames = tables.map(t => t.name);

                    if (!tableNames.includes('subscriptions')) {
                        console.log('Running migration: Creating subscriptions table');
                        this.db.run(`
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
                                updated_at TEXT DEFAULT (datetime('now'))
                            )
                        `);
                    }

                    if (!tableNames.includes('subscription_requests')) {
                        console.log('Running migration: Creating subscription_requests table');
                        this.db.run(`
                            CREATE TABLE IF NOT EXISTS subscription_requests (
                                id TEXT PRIMARY KEY,
                                organization_id TEXT NOT NULL,
                                plan_type TEXT NOT NULL CHECK (plan_type IN ('MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL')),
                                payment_method TEXT NOT NULL CHECK (payment_method IN ('TRANSFERENCIA', 'MULTICAIXA_EXPRESS')),
                                reference_code TEXT UNIQUE NOT NULL,
                                activation_code_hash TEXT,
                                amount REAL NOT NULL,
                                status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVATED', 'REJECTED', 'EXPIRED')),
                                requested_at TEXT DEFAULT (datetime('now')),
                                activated_at TEXT,
                                activated_by TEXT,
                                subscription_id TEXT,
                                customer_phone TEXT,
                                admin_notes TEXT
                            )
                        `);
                    }

                    if (!tableNames.includes('password_resets')) {
                        console.log('Running migration: Creating password_resets table');
                        this.db.run(`
                            CREATE TABLE IF NOT EXISTS password_resets (
                                id TEXT PRIMARY KEY,
                                user_id TEXT NOT NULL,
                                email TEXT NOT NULL,
                                expires_at TEXT NOT NULL,
                                created_at TEXT DEFAULT (datetime('now'))
                            )
                        `);
                    }

                    // 5. Subscription Requests Column Migrations (Post-Create check)
                    const requestCols = this.query("PRAGMA table_info(subscription_requests)");

                    if (!requestCols.some((col: any) => col.name === 'admin_notes')) {
                        console.log('Running migration: Adding admin_notes to subscription_requests');
                        this.db.run("ALTER TABLE subscription_requests ADD COLUMN admin_notes TEXT");
                    }

                    if (!requestCols.some((col: any) => col.name === 'customer_phone')) {
                        console.log('Running migration: Adding customer_phone to subscription_requests');
                        this.db.run("ALTER TABLE subscription_requests ADD COLUMN customer_phone TEXT");
                    }

                    // Always save after potential schema changes
                    this.save();
                } catch (e) {
                    console.warn('Migration check failed (fresh request likely):', e);
                }
            } else {
                // Criar nova base de dados
                this.db = new this.SQL.Database();
                await this.createSchema();
                console.log('✓ Nova base de dados criada');
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Erro ao inicializar SQLite:', error);
            throw new Error('Falha ao inicializar base de dados local');
        }
    }

    /**
     * Cria o schema da base de dados
     */
    private async createSchema(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            const schemaPath = '/database/schema.sql';
            const response = await fetch(schemaPath);
            const schema = await response.text();

            this.db.run(schema);
            this.save();

            console.log('✓ Schema criado com sucesso');
        } catch (error) {
            console.error('Erro ao criar schema:', error);
            throw error;
        }
    }

    /**
     * Executa uma query SQL
     */
    exec(sql: string, params?: any[]): any[] {
        if (!this.db) throw new Error('Database not initialized');

        try {
            const results = this.db.exec(sql, params);
            return results;
        } catch (error) {
            console.error('Erro ao executar query:', error, sql);
            throw error;
        }
    }

    /**
     * Executa uma query e retorna os resultados como objetos
     */
    query<T = any>(sql: string, params?: any[]): T[] {
        if (!this.db) throw new Error('Database not initialized');

        try {
            const results = this.db.exec(sql, params);

            if (results.length === 0) {
                return [];
            }

            const { columns, values } = results[0];

            return values.map(row => {
                const obj: any = {};
                columns.forEach((col, idx) => {
                    obj[col] = row[idx];
                });
                return obj as T;
            });
        } catch (error) {
            console.error('Erro ao executar query:', error, sql);
            throw error;
        }
    }

    /**
     * Executa uma query e retorna o primeiro resultado
     */
    queryOne<T = any>(sql: string, params?: any[]): T | null {
        const results = this.query<T>(sql, params);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Executa um comando SQL (INSERT, UPDATE, DELETE)
     */
    run(sql: string, params?: any[]): void {
        if (!this.db) throw new Error('Database not initialized');

        try {
            this.db.run(sql, params);
            this.save(); // Auto-save após mudanças
        } catch (error) {
            console.error('Erro ao executar comando:', error, sql);
            throw error;
        }
    }

    /**
     * Executa uma transação
     */
    transaction(callback: () => void): void {
        if (!this.db) throw new Error('Database not initialized');

        try {
            this.db.run('BEGIN TRANSACTION');
            callback();
            this.db.run('COMMIT');
            this.save();
        } catch (error) {
            this.db.run('ROLLBACK');
            console.error('Erro na transação:', error);
            throw error;
        }
    }

    /**
     * Helper to convert Uint8Array to Base64
     */
    private toBase64(u8: Uint8Array): string {
        let binary = '';
        const len = u8.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(u8[i]);
        }
        return window.btoa(binary);
    }

    /**
     * Helper to convert Base64 to Uint8Array
     */
    private fromBase64(base64: string): Uint8Array {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Salva a base de dados no localStorage
     */
    save(): void {
        if (!this.db) return;

        try {
            const data = this.db.export();
            const base64 = this.toBase64(data);

            localStorage.setItem('pos_angola_db', base64);
            localStorage.setItem('pos_angola_db_updated', new Date().toISOString());

            // Notify listeners about the update
            this.notifyChange();
        } catch (error) {
            console.error('Erro ao salvar base de dados:', error);
            throw new Error('Falha ao persistir dados. Armazenamento pode estar cheio.');
        }
    }

    /**
     * Carrega a base de dados do localStorage
     */
    private loadFromStorage(): Uint8Array | null {
        try {
            const base64 = localStorage.getItem('pos_angola_db');
            if (!base64) return null;

            return this.fromBase64(base64);
        } catch (error) {
            console.error('Erro ao carregar base de dados:', error);
            return null;
        }
    }

    /**
     * Exporta a base de dados como Blob para download
     */
    async exportDatabase(): Promise<Blob> {
        if (!this.db) throw new Error('Database not initialized');

        const data = this.db.export();
        // Create a new Uint8Array to ensure proper typing for Blob constructor
        const uint8Array = new Uint8Array(data);
        return new Blob([uint8Array], { type: 'application/x-sqlite3' });
    }

    /**
     * Importa uma base de dados de um arquivo
     */
    async importDatabase(file: File): Promise<void> {
        if (!this.SQL) throw new Error('SQLite not initialized');

        try {
            const buffer = await file.arrayBuffer();
            const data = new Uint8Array(buffer);

            // Fechar base de dados atual
            if (this.db) {
                this.db.close();
            }

            // Abrir nova base de dados
            this.db = new this.SQL.Database(data);
            this.save();

            console.log('✓ Base de dados importada com sucesso');
        } catch (error) {
            console.error('Erro ao importar base de dados:', error);
            throw error;
        }
    }

    /**
     * Limpa completamente a base de dados
     */
    async clearDatabase(): Promise<void> {
        if (!this.SQL) throw new Error('SQLite not initialized');

        try {
            if (this.db) {
                this.db.close();
            }

            this.db = new this.SQL.Database();
            await this.createSchema();

            localStorage.removeItem('pos_angola_db');
            localStorage.removeItem('pos_angola_db_updated');

            console.log('✓ Base de dados limpa');
            this.notifyChange();
        } catch (error) {
            console.error('Erro ao limpar base de dados:', error);
            throw error;
        }
    }

    /**
     * Retorna estatísticas da base de dados
     */
    getStats(): {
        size: number;
        lastUpdated: string | null;
        tableCount: number;
        rowCount: number;
    } {
        const dbString = localStorage.getItem('pos_angola_db') || '';
        const size = new Blob([dbString]).size;
        const lastUpdated = localStorage.getItem('pos_angola_db_updated');

        let tableCount = 0;
        let rowCount = 0;

        try {
            const tables = this.query<{ name: string }>(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            );
            tableCount = tables.length;

            // Calculate total rows
            for (const table of tables) {
                try {
                    const result = this.queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM ${table.name}`);
                    if (result) {
                        rowCount += result.count;
                    }
                } catch (e) {
                    // Ignore errors for specific tables
                }
            }
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
        }

        return {
            size,
            lastUpdated,
            tableCount,
            rowCount,
        };
    }
}

// Exportação singleton
export const db = SQLiteManager.getInstance();
export default db;
