'use client';

import React, { useState } from 'react';
import { Customer } from '@/types';
import { useRouter } from 'next/navigation';
import { useCustomerStore } from '@/store/customerStore';
import { useAuthStore } from '@/store/authStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SuccessModal from '@/components/ui/SuccessModal';

interface CustomerFormProps {
    customer?: Customer;
    isEdit?: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, isEdit = false }) => {
    const router = useRouter();
    const { user } = useAuthStore();
    const { createCustomer, updateCustomer, isLoading } = useCustomerStore();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        name: customer?.name || '',
        nif: customer?.nif || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        notes: customer?.notes || '',
        is_active: customer?.is_active ?? true
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate() || !user?.organization_id) return;

        try {
            if (isEdit && customer) {
                await updateCustomer(customer.id, formData);
                setSuccessMessage('Cliente atualizado com sucesso!');
                setShowSuccessModal(true);
            } else {
                await createCustomer({
                    ...formData,
                    organization_id: user.organization_id
                });
                setSuccessMessage('Cliente criado com sucesso!');
                setShowSuccessModal(true);
            }
            // Router push is now handled by modal actions for create, but for edit maybe we still want it?
            // If edit, maybe just go back? Let's keep modal for both.
        } catch (error) {
            alert('Erro ao salvar cliente');
            console.error(error);
        }
    };

    const handleReset = () => {
        setFormData({
            name: '',
            nif: '',
            email: '',
            phone: '',
            address: '',
            notes: '',
            is_active: true
        });
        setShowSuccessModal(false);
        // If edit mode, maybe we should switch to create mode?
        // But the component props control that.
        // If "Novo Cliente" is clicked in Edit mode, it might be weird if we are firmly in edit page.
        // But user asked for "Modal Cliente criado com sucesso", implying creation.
        // For edit, I will make the action "Voltar à lista".
        if (isEdit) {
            router.push('/dashboard/customers');
        }
    };

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <Card>
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
                    </h2>

                    <Input
                        label="Nome *"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        error={errors.name}
                        placeholder="Nome do cliente"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="NIF"
                            value={formData.nif}
                            onChange={(e) => handleChange('nif', e.target.value)}
                            placeholder="Número de Identificação Fiscal"
                        />

                        <Input
                            label="Telefone"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="+244 9XX XXX XXX"
                        />
                    </div>

                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        error={errors.email}
                        placeholder="email@exemplo.com"
                    />

                    <Input
                        label="Morada"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="Endereço completo"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Observações
                        </label>
                        <textarea
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Notas adicionais sobre o cliente"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => handleChange('is_active', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_active" className="text-sm text-gray-700">
                            Cliente activo
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                        >
                            {isEdit ? 'Atualizar' : 'Criar Cliente'}
                        </Button>
                    </div>
                </div>
            </Card>

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Cliente Criado!"
                message={successMessage}
                actionLabel="Novo Cliente"
                onAction={handleReset}
                showSecondaryAction
                secondaryActionLabel="Ver Lista de Clientes"
                onSecondaryAction={() => router.push('/dashboard/customers')}
            />
        </form >
    );
};

export default CustomerForm;
