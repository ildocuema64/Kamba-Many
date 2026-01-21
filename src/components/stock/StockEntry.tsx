'use client';

import React, { useState, useEffect } from 'react';
import { useProductStore } from '@/store/productStore';
import { useStockStore } from '@/store/stockStore';
import { useAuthStore } from '@/store/authStore';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SuccessModal from '@/components/ui/SuccessModal';
import { useRouter } from 'next/navigation';
import { MovementType } from '@/types';

const StockEntry: React.FC = () => {
    const router = useRouter();
    const { user } = useAuthStore();
    const { products, fetchProducts, isLoading: productsLoading } = useProductStore();
    const { createMovement, isLoading: stockLoading } = useStockStore();

    const [formData, setFormData] = useState({
        product_id: '',
        movement_type: 'ENTRADA' as MovementType,
        quantity: 0,
        unit_cost: 0,
        notes: ''
    });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (user?.organization_id && products.length === 0) {
            fetchProducts(user.organization_id);
        }
    }, [user?.organization_id, products.length, fetchProducts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.organization_id) return;
        setErrorMessage(null);

        try {
            await createMovement({
                organization_id: user.organization_id,
                product_id: formData.product_id,
                movement_type: formData.movement_type,
                quantity: Number(formData.quantity),
                unit_cost: formData.movement_type === 'ENTRADA' ? Number(formData.unit_cost) : undefined,
                notes: formData.notes,
                user_id: user.id,
                movement_date: new Date().toISOString()
            });
            setShowSuccessModal(true);
        } catch (error) {
            setErrorMessage('Erro ao registar movimento. Por favor, tente novamente.');
            console.error(error);
        }
    };

    const handleSuccessAction = () => {
        setShowSuccessModal(false);
        router.push('/dashboard/stock');
    };

    const productOptions = [
        { value: '', label: 'Selecione um produto...' },
        ...products.map(p => ({ value: p.id, label: `${p.name} (Atual: ${p.current_stock})` }))
    ];

    const typeOptions = [
        { value: 'ENTRADA', label: 'Entrada (Compra)' },
        { value: 'SAIDA', label: 'Saída (Perda/Consumo)' },
        { value: 'AJUSTE', label: 'Ajuste de Inventário' },
        { value: 'DEVOLUCAO', label: 'Devolução de Cliente' },
    ];

    return (
        <>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm max-w-2xl mx-auto space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Registar Movimento de Stock</h2>

                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{errorMessage}</span>
                    </div>
                )}

                <Select
                    label="Produto"
                    options={productOptions}
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Tipo de Movimento"
                        options={typeOptions}
                        value={formData.movement_type}
                        onChange={(e) => setFormData({ ...formData, movement_type: e.target.value as MovementType })}
                        required
                    />

                    <Input
                        label="Quantidade"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        required
                    />
                </div>

                {formData.movement_type === 'ENTRADA' && (
                    <Input
                        label="Custo Unitário (AKZ)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.unit_cost}
                        onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
                    />
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                    <textarea
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Número da factura, motivo do ajuste, etc."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={stockLoading} variant="primary">
                        Confirmar Movimento
                    </Button>
                </div>
            </form>

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Movimento Registado!"
                message="O movimento de stock foi registado com sucesso no sistema."
                onAction={handleSuccessAction}
                actionLabel="Ver Stock"
                showSecondaryAction={true}
                secondaryActionLabel="Registar Outro"
                onSecondaryAction={() => {
                    setShowSuccessModal(false);
                    setFormData({
                        product_id: '',
                        movement_type: 'ENTRADA',
                        quantity: 0,
                        unit_cost: 0,
                        notes: ''
                    });
                }}
            />
        </>
    );
};

export default StockEntry;
