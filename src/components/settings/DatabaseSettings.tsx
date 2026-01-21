'use client';

import React, { useEffect, useState } from 'react';
import db from '@/lib/db/sqlite';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Database, Download, RefreshCw, Trash2, Save, HardDrive } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useDataRefresh } from '@/hooks/useDataRefresh';

const DatabaseSettings: React.FC = () => {
    const toast = useToast();
    const [stats, setStats] = useState<{ size: number; lastUpdated: string | null; tableCount: number; rowCount: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [tableInspectorRefreshKey, setTableInspectorRefreshKey] = useState(0);

    // Modal State
    const [showSeedModal, setShowSeedModal] = useState(false);

    const refreshStats = () => {
        try {
            const currentStats = db.getStats();
            setStats(currentStats);
        } catch (error) {
            console.error('Failed to get stats:', error);
        }
    };

    const confirmSeed = async () => {
        setIsSeeding(true);
        try {
            // Get current org id from local storage
            let orgId = '';
            try {
                // Correct key from authStore
                const storage = localStorage.getItem('pos-angola-auth');
                if (storage) {
                    const parsed = JSON.parse(storage);
                    orgId = parsed.state?.user?.organization_id;
                }
            } catch (e) {
                console.error(e);
            }

            // If no org ID found, use the default one used in AuthStore validation
            if (!orgId) {
                const defaultId = 'default-org-001';

                // Check if default org exists
                const existingOrg = db.queryOne<{ id: string }>('SELECT id FROM organizations WHERE id = ?', [defaultId]);

                if (existingOrg) {
                    orgId = defaultId;
                } else {
                    // Create default organization
                    orgId = defaultId;
                    const now = new Date().toISOString();

                    db.run(`
                        INSERT INTO organizations (id, name, nif, fiscal_regime, is_active, created_at, updated_at)
                        VALUES (?, 'Minha Empresa Demo', '999999999', 'GERAL', 1, ?, ?)
                    `, [orgId, now, now]);

                    toast.success('Info', 'Organização padrão criada.');
                }
            }

            const now = new Date().toISOString();

            // Seed Categories
            const catId = crypto.randomUUID();
            db.run(`
                INSERT INTO categories (id, organization_id, name, description, is_active, created_at, updated_at)
                VALUES (?, ?, 'Categoria Teste Seed', 'Gerada automaticamente', 1, ?, ?)
            `, [catId, orgId, now, now]);

            // Seed Product
            db.run(`
                INSERT INTO products (id, organization_id, category_id, code, name, unit_price, tax_rate, is_active, created_at, updated_at)
                VALUES (?, ?, ?, 'SEED-001', 'Produto Teste Seed', 1000, 14, 1, ?, ?)
            `, [crypto.randomUUID(), orgId, catId, now, now]);

            await db.save();
            toast.success('Sucesso', 'Dados de teste gerados!');
            refreshStats();
            setTableInspectorRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Falha ao gerar dados.');
        } finally {
            setIsSeeding(false);
            setShowSeedModal(false);
        }
    };

    const handleSeed = () => setShowSeedModal(true);
    const refreshKey = useDataRefresh();

    useEffect(() => {
        refreshStats();
        // Update stats every 5 seconds to show real-time changes
        // Also update when refreshKey changes
        const interval = setInterval(refreshStats, 5000);
        return () => clearInterval(interval);
    }, [refreshKey]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const blob = await db.exportDatabase();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pos-angola-backup-${new Date().toISOString().split('T')[0]}.sqlite`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Sucesso', 'Base de dados exportada com sucesso.');
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Falha ao exportar base de dados.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleForceSave = () => {
        try {
            db.save();
            toast.success('Sucesso', 'Base de dados salva no armazenamento local.');
            refreshStats();
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Falha ao salvar. O armazenamento pode estar cheio.');
        }
    };

    // Helper to format bytes
    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const storageUsagePercent = stats ? Math.min((stats.size / (5 * 1024 * 1024)) * 100, 100) : 0;
    const isHighUsage = storageUsagePercent > 80;

    return (
        <div className="space-y-6">
            <ConfirmationModal
                isOpen={showSeedModal}
                onClose={() => setShowSeedModal(false)}
                onConfirm={confirmSeed}
                title="Gerar Dados de Teste?"
                message="Isso adicionará categorias e produtos fictícios à sua base de dados. Isso pode misturar com seus dados reais."
                confirmLabel="Gerar Dados"
                variant="warning"
                isLoading={isSeeding}
            />
            <Card>
                <div className="flex items-center gap-2 mb-6">
                    <Database className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900">Diagnóstico da Base de Dados</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                        <div className="text-sm text-gray-500 mb-1">Status</div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                            <span className="font-medium text-gray-900">Operacional</span>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                        <div className="text-sm text-gray-500 mb-1">Tamanho (LocalStorage)</div>
                        <div className="font-medium text-gray-900">
                            {stats ? formatBytes(stats.size) : 'Calculando...'}
                        </div>
                        {stats && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div
                                    className={`h-1.5 rounded-full ${isHighUsage ? 'bg-red-500' : 'bg-blue-600'}`}
                                    style={{ width: `${storageUsagePercent}%` }}
                                ></div>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Limite aprox: 5MB</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border">
                        <div className="text-sm text-gray-500 mb-1">Total Registros</div>
                        <div className="font-medium text-gray-900">
                            {stats?.rowCount || 0}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            Linhas totais
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border">
                        <div className="text-sm text-gray-500 mb-1">Última Sincronização</div>
                        <div className="font-medium text-gray-900">
                            {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'Nunca'}
                        </div>
                    </div>
                </div>

                {isHighUsage && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <HardDrive className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-red-800">Espaço de Armazenamento Crítico</h4>
                            <p className="text-sm text-red-600 mt-1">
                                O seu navegador está ficando sem espaço para salvar dados.
                                Recomendamos exportar o backup e limpar dados antigos.
                            </p>
                        </div>
                    </div>
                )}

                <div className="prose prose-sm text-gray-500 mb-6">
                    <p>
                        O sistema utiliza uma base de dados local (SQLite) que é salva no seu navegador.
                        Nenhum dado é enviado para a nuvem automaticamente.
                        É importante fazer backups regulares.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        onClick={handleForceSave}
                        variant="outline"
                        isLoading={isLoading}
                    >
                        <Save size={18} className="mr-2" />
                        Forçar Salvamento
                    </Button>
                    <Button
                        onClick={handleExport}
                        variant="primary"
                        isLoading={isExporting}
                    >
                        <Download size={18} className="mr-2" />
                        Baixar Backup (.sqlite)
                    </Button>
                    <Button
                        onClick={handleSeed}
                        variant="outline"
                        isLoading={isSeeding}
                        className="text-green-600 hover:bg-green-50 border-green-200"
                    >
                        <Database size={18} className="mr-2" />
                        Gerar Dados de Teste
                    </Button>
                </div>
            </Card>

            <TableInspector key={tableInspectorRefreshKey} />
        </div>
    );
};

const TableInspector: React.FC = () => {
    const [tables, setTables] = useState<{ name: string; count: number }[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [tableData, setTableData] = useState<any[]>([]);

    // Get current org ID context
    const [currentOrgId, setCurrentOrgId] = useState<string>('');

    useEffect(() => {
        // Safe check for localStorage to avoid hydration mismatch
        if (typeof window !== 'undefined') {
            try {
                // Correct key from authStore
                const storage = localStorage.getItem('pos-angola-auth');
                if (storage) {
                    const parsed = JSON.parse(storage);
                    setCurrentOrgId(parsed.state?.user?.organization_id || 'Não encontrado');
                }
            } catch (e) {
                setCurrentOrgId('Erro ao ler auth store');
            }
        }

        loadTables();
    }, []);

    const loadTables = () => {
        try {
            const result = db.query<{ name: string }>(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
            );

            const tablesWithCounts = result.map(t => {
                const countResult = db.queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM ${t.name}`);
                return {
                    name: t.name,
                    count: countResult?.count || 0
                };
            });

            setTables(tablesWithCounts);
        } catch (error) {
            console.error('Erro ao carregar tabelas', error);
        }
    };

    const handleSelectTable = (tableName: string) => {
        setSelectedTable(tableName);
        try {
            const data = db.query(`SELECT * FROM ${tableName} LIMIT 5`);
            setTableData(data);
        } catch (error) {
            console.error(`Erro ao ler tabela ${tableName}`, error);
        }
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900">Inspecionar Tabelas</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={loadTables} size="sm" variant="outline">
                        Atualizar
                    </Button>
                    <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        Org ID: {currentOrgId.substring(0, 8)}...
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b font-medium text-sm text-gray-700">
                        Tabelas ({tables.length})
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                            <tbody>
                                {tables.map(table => (
                                    <tr
                                        key={table.name}
                                        onClick={() => handleSelectTable(table.name)}
                                        className={`cursor-pointer hover:bg-gray-50 border-b last:border-0 ${selectedTable === table.name ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="px-4 py-2 text-gray-900">{table.name}</td>
                                        <td className="px-4 py-2 text-right text-gray-500 font-mono">{table.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="md:col-span-2 border rounded-lg overflow-hidden flex flex-col">
                    <div className="bg-gray-50 px-4 py-2 border-b font-medium text-sm text-gray-700 flex justify-between">
                        <span>Dados: {selectedTable || 'Selecione uma tabela'}</span>
                        {selectedTable && <span className="text-xs text-gray-500">Mostrando 5 primeiros registros</span>}
                    </div>

                    <div className="flex-1 max-h-60 overflow-auto p-0 bg-white">
                        {selectedTable ? (
                            tableData.length > 0 ? (
                                <pre className="text-xs p-4 font-mono text-gray-800 whitespace-pre-wrap">
                                    {JSON.stringify(tableData, null, 2)}
                                </pre>
                            ) : (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    Tabela vazia
                                </div>
                            )
                        ) : (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                Selecione uma tabela à esquerda para visualizar os dados
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default DatabaseSettings;
