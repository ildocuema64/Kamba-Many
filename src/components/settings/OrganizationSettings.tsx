'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Building, Save, Upload, X } from 'lucide-react';
import { FiscalRegime } from '@/types';
import db from '@/lib/db/sqlite';
import { useDataRefresh } from '@/hooks/useDataRefresh';

const OrganizationSettings: React.FC = () => {
    const toast = useToast();
    const { user } = useAuthStore();
    const refreshKey = useDataRefresh();

    const [formData, setFormData] = useState({
        name: '',
        nif: '',
        address: '',
        phone: '',
        email: '',
        fiscalRegime: 'GERAL' as FiscalRegime
    });

    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fiscalRegimeOptions = [
        { value: 'GERAL', label: 'Regime Geral' },
        { value: 'SIMPLIFICADO', label: 'Regime Simplificado' },
        { value: 'EXCLUSAO', label: 'Regime de Exclusão' },
    ];

    React.useEffect(() => {
        const loadOrganization = () => {
            if (!user?.organization_id) return;

            try {
                const org = db.queryOne<{
                    name: string;
                    nif: string;
                    address: string;
                    phone: string;
                    email: string;
                    fiscal_regime: FiscalRegime;
                    logo_url: string;
                }>(`SELECT * FROM organizations WHERE id = ?`, [user.organization_id]);

                if (org) {
                    setFormData({
                        name: org.name || '',
                        nif: org.nif || '',
                        address: org.address || '',
                        phone: org.phone || '',
                        email: org.email || '',
                        fiscalRegime: org.fiscal_regime || 'GERAL'
                    });
                    setLogoUrl(org.logo_url || null);
                }
            } catch (error) {
                console.error('Error loading organization:', error);
                toast.error('Erro', 'Falha ao carregar dados da empresa.');
            } finally {
                setIsLoading(false);
            }
        };

        loadOrganization();
    }, [user?.organization_id, refreshKey]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validations
        if (file.size > 500 * 1024) { // 500KB limit
            toast.error('Arquivo muito grande', 'O logo deve ter no máximo 500KB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setLogoUrl(base64String);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setLogoUrl(null);
    };

    const handleSave = async () => {
        if (!user?.organization_id) {
            toast.error('Erro', 'Organização não identificada.');
            return;
        }

        if (!formData.name || !formData.nif) {
            toast.error('Atenção', 'Nome e NIF são obrigatórios.');
            return;
        }

        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // UX delay

            // Check if organization exists first
            const existingOrg = db.queryOne<{ id: string }>(`SELECT id FROM organizations WHERE id = ?`, [user.organization_id]);

            if (!existingOrg) {
                // INSERT if not exists
                db.run(`
                    INSERT INTO organizations (id, name, nif, address, phone, email, fiscal_regime, logo_url, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                `, [
                    user.organization_id,
                    formData.name,
                    formData.nif,
                    formData.address,
                    formData.phone,
                    formData.email,
                    formData.fiscalRegime,
                    logoUrl
                ]);
            } else {
                // UPDATE if exists
                db.run(`
                    UPDATE organizations 
                    SET name = ?, nif = ?, address = ?, phone = ?, email = ?, fiscal_regime = ?, logo_url = ?, updated_at = datetime('now')
                    WHERE id = ?
                `, [
                    formData.name,
                    formData.nif,
                    formData.address,
                    formData.phone,
                    formData.email,
                    formData.fiscalRegime,
                    logoUrl,
                    user.organization_id
                ]);
            }

            toast.success('Organização actualzada', 'Os dados da empresa foram guardados com sucesso.');
        } catch (error) {
            console.error('Error saving organization:', error);
            toast.error('Erro', 'Não foi possível guardar os dados da organização.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <div className="flex items-center gap-2 mb-6">
                <Building className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Dados da Organização</h2>
            </div>

            <div className="space-y-4">
                {/* Logo Section */}
                <div className="flex flex-col items-center sm:items-start mb-6 pb-6 border-b border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logótipo da Empresa
                    </label>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                            {logoUrl ? (
                                <>
                                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                    <button
                                        onClick={handleRemoveLogo}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        title="Remover Logo"
                                        type="button"
                                    >
                                        <X size={12} />
                                    </button>
                                </>
                            ) : (
                                <Building className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <Upload className="w-4 h-4 mr-2" />
                                Carregar Logo
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                />
                            </label>
                            <p className="text-xs text-gray-500">
                                PNG, JPG ou GIF até 500KB.
                            </p>
                        </div>
                    </div>
                </div>

                <Input
                    label="Nome da Empresa"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Nome da empresa"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="NIF"
                        value={formData.nif}
                        onChange={(e) => handleChange('nif', e.target.value)}
                        placeholder="Número de Identificação Fiscal"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Regime Fiscal
                        </label>
                        <Select
                            options={fiscalRegimeOptions}
                            value={formData.fiscalRegime}
                            onChange={(e) => handleChange('fiscalRegime', e.target.value)}
                        />
                    </div>
                </div>

                <Input
                    label="Morada"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Endereço completo"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Telefone"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+244 9XX XXX XXX"
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="email@empresa.ao"
                    />
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Alterações
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default OrganizationSettings;
