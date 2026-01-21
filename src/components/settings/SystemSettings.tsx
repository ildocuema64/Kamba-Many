'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Database, Download, Upload, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import db from '@/lib/db/sqlite';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const SystemSettings: React.FC = () => {
    const toast = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    // Modal State
    const [showClearModal, setShowClearModal] = useState(false);

    const handleExportDatabase = async () => {
        setIsExporting(true);
        try {
            const blob = await db.exportDatabase();
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `kamba-many-backup-${new Date().toISOString().split('T')[0]}.sqlite`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Backup Exportado', 'A base de dados foi exportada com sucesso.');
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Erro', 'Não foi possível exportar a base de dados.');
        } finally {
            setIsExporting(false);
        }
    };

    const confirmClearData = async () => {
        setIsClearing(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await db.clearDatabase(); // Assuming clearDatabase exists or logic here
            toast.success('Dados Limpos', 'Todos os dados foram removidos. A recarregar...');
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Não foi possível limpar os dados.');
        } finally {
            setIsClearing(false);
            setShowClearModal(false);
        }
    };

    return (
        <div className="space-y-6">
            <ConfirmationModal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                onConfirm={confirmClearData}
                title="Limpar Todos os Dados?"
                message="Esta acção é IRREVERSÍVEL. Todos os dados (clientes, vendas, categorias) serão apagados permanentemente do navegador."
                confirmLabel="Sim, Limpar Tudo"
                variant="danger"
                isLoading={isClearing}
            />

            {/* Database Info */}
            <Card>
                <div className="flex items-center gap-2 mb-6">
                    <Database className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900">Base de Dados</h2>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Estado</p>
                                <Badge variant="success">Online</Badge>
                            </div>
                            <div>
                                <p className="text-gray-500">Tipo</p>
                                <p className="font-medium">SQLite (Local)</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Modo</p>
                                <p className="font-medium">Offline-First</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Sincronização</p>
                                <Badge variant="warning">Pendente</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={handleExportDatabase} isLoading={isExporting}>
                            <Download className="w-4 h-4 mr-2" />
                            Exportar Backup
                        </Button>
                        <Button variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            Importar Dados
                        </Button>
                        <Button variant="outline">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sincronizar
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Danger Zone */}
            <Card>
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h2 className="text-lg font-semibold text-red-600">Zona de Perigo</h2>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700 mb-4">
                        As acções abaixo são <strong>irreversíveis</strong>. Tenha certeza antes de prosseguir.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => setShowClearModal(true)}
                        isLoading={isClearing}
                        className="border-red-300 text-red-600 hover:bg-red-100"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Limpar Todos os Dados
                    </Button>
                </div>
            </Card>

            {/* App Info */}
            <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sobre a Aplicação</h2>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Aplicação</span>
                        <span className="font-medium">POS Angola</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Versão</span>
                        <span className="font-medium">1.0.0</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SystemSettings;
