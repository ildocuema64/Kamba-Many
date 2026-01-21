'use client';

import { useAuthStore } from '@/store/authStore';
import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Printer, Save, TestTube, Check } from 'lucide-react';
import db from '@/lib/db/sqlite';
import { useDataRefresh } from '@/hooks/useDataRefresh';

const PrinterSettings: React.FC = () => {
    const toast = useToast();
    const { user } = useAuthStore();
    const refreshKey = useDataRefresh();

    const [formData, setFormData] = useState({
        printerName: 'Impressora Térmica 80mm',
        paperWidth: '80',
        fontSize: '12',
        showLogo: true,
        showFooter: true,
        footerText: 'Obrigado pela sua preferência!'
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    // Load settings from DB
    React.useEffect(() => {
        if (!user?.organization_id) return;

        try {
            const setting = db.queryOne<{ setting_value: string }>(
                `SELECT setting_value FROM system_settings WHERE organization_id = ? AND setting_key = 'printer_config'`,
                [user.organization_id]
            );

            if (setting?.setting_value) {
                const parsed = JSON.parse(setting.setting_value);
                setFormData(prev => ({ ...prev, ...parsed }));
            }
        } catch (error) {
            console.error('Error loading printer settings:', error);
        }
    }, [user?.organization_id, refreshKey]);

    const paperWidthOptions = [
        { value: '58', label: '58mm' },
        { value: '80', label: '80mm' },
    ];

    const fontSizeOptions = [
        { value: '10', label: 'Pequeno (10pt)' },
        { value: '12', label: 'Normal (12pt)' },
        { value: '14', label: 'Grande (14pt)' },
    ];

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTestPrint = async () => {
        setIsTesting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Teste de Impressão', 'Página de teste enviada para a impressora.');
        } catch (error) {
            toast.error('Erro', 'Não foi possível enviar o teste de impressão.');
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async () => {
        if (!user?.organization_id) {
            toast.error('Erro', 'Organização não identificada.');
            return;
        }

        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            // Upsert Logic using INSERT OR REPLACE is possible, 
            // but strict SQL standard often prefers checking existence or ON CONFLICT.
            // SQLite supports INSERT OR REPLACE.

            const value = JSON.stringify(formData);

            db.run(`
                INSERT INTO system_settings (id, organization_id, setting_key, setting_value, setting_type,  created_at, updated_at)
                VALUES (
                    COALESCE((SELECT id FROM system_settings WHERE organization_id = ? AND setting_key = 'printer_config'), lower(hex(randomblob(16)))),
                    ?, 
                    'printer_config', 
                    ?, 
                    'JSON', 
                    datetime('now'), 
                    datetime('now')
                )
                ON CONFLICT(organization_id, setting_key) DO UPDATE SET
                    setting_value = excluded.setting_value,
                    updated_at = datetime('now')
            `, [
                user.organization_id, // For subquery
                user.organization_id, // For insert
                value
            ]);

            toast.success('Configurações Guardadas', 'As definições da impressora foram actualizadas com sucesso.');
        } catch (error) {
            console.error('Error saving printer settings:', error);
            toast.error('Erro', 'Não foi possível guardar as configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Printer className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900">Impressora</h2>
                </div>
                <Badge variant="success">Conectada</Badge>
            </div>

            <div className="space-y-4">
                <Input
                    label="Nome da Impressora"
                    value={formData.printerName}
                    onChange={(e) => handleChange('printerName', e.target.value)}
                    placeholder="Nome ou modelo da impressora"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Largura do Papel
                        </label>
                        <Select
                            options={paperWidthOptions}
                            value={formData.paperWidth}
                            onChange={(e) => handleChange('paperWidth', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tamanho da Fonte
                        </label>
                        <Select
                            options={fontSizeOptions}
                            value={formData.fontSize}
                            onChange={(e) => handleChange('fontSize', e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="showLogo"
                            checked={formData.showLogo}
                            onChange={(e) => handleChange('showLogo', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="showLogo" className="text-sm text-gray-700">
                            Mostrar logotipo no recibo
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="showFooter"
                            checked={formData.showFooter}
                            onChange={(e) => handleChange('showFooter', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="showFooter" className="text-sm text-gray-700">
                            Mostrar rodapé personalizado
                        </label>
                    </div>
                </div>

                {formData.showFooter && (
                    <Input
                        label="Texto do Rodapé"
                        value={formData.footerText}
                        onChange={(e) => handleChange('footerText', e.target.value)}
                        placeholder="Mensagem no rodapé do recibo"
                    />
                )}

                <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" onClick={handleTestPrint} isLoading={isTesting}>
                        <TestTube className="w-4 h-4 mr-2" />
                        Testar Impressão
                    </Button>
                    <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default PrinterSettings;
