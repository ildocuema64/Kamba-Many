'use client';

import React, { useState, useEffect } from 'react';
import { useProductStore } from '@/store/productStore';
import { useStockStore } from '@/store/stockStore';
import { useAuthStore } from '@/store/authStore';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
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

    useEffect(() => {
        if (user?.organization_id && products.length === 0) {
            fetchProducts(user.organization_id);
        }
    }, [user?.organization_id, products.length, fetchProducts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.organization_id) return;

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
            alert('Movimento registado com sucesso!');
            router.push('/dashboard/stock');
        } catch (error) {
            alert('Erro ao registar movimento');
            console.error(error);
        }
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
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Registar Movimento de Stock</h2>

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
    );
};

export default StockEntry;
