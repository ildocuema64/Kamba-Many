'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product } from '@/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import CategorySelector from './CategorySelector';
import ImageUploader from './ImageUploader';
import { useRouter } from 'next/navigation';

const productSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    code: z.string().min(1, "Código é obrigatório"),
    barcode: z.string().optional(),
    category_id: z.string().optional(),
    description: z.string().optional(),
    unit_price: z.coerce.number().min(0, "Preço deve ser positivo"),
    cost_price: z.coerce.number().min(0, "Custo deve ser positivo"),
    tax_rate: z.coerce.number().min(0).max(100),
    unit_type: z.string().min(1, "Unidade é obrigatória"),
    current_stock: z.coerce.number().int().min(0),
    min_stock: z.coerce.number().int().min(0),
    image_url: z.string().optional(),
    is_active: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
    initialData?: Product;
    onSubmit: (data: ProductFormData) => Promise<void>;
    isLoading?: boolean;
    title?: string;
}

import { generateProductCode } from '@/utils/generators';

const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, isLoading, title }) => {
    const router = useRouter();

    const { register, handleSubmit, control, formState: { errors } } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: initialData ? {
            name: initialData.name,
            code: initialData.code,
            barcode: initialData.barcode || '',
            category_id: initialData.category_id || '',
            description: initialData.description || '',
            unit_price: initialData.unit_price,
            cost_price: initialData.cost_price,
            tax_rate: initialData.tax_rate || 14,
            unit_type: initialData.unit_type || 'UNI',
            current_stock: initialData.current_stock || 0,
            min_stock: initialData.min_stock || 5,
            image_url: initialData.image_url || '',
            is_active: initialData.is_active,
        } : {
            code: generateProductCode(),
            tax_rate: 14,
            unit_type: 'UNI',
            current_stock: 0,
            min_stock: 5,
            is_active: true,
        }
    });

    const unitOptions = [
        { value: 'UNI', label: 'Unidade (UNI)' },
        { value: 'KG', label: 'Quilograma (KG)' },
        { value: 'LT', label: 'Litro (LT)' },
        { value: 'MT', label: 'Metro (MT)' },
        { value: 'CX', label: 'Caixa (CX)' },
    ];

    const taxOptions = [
        { value: '14', label: 'IVA Geral (14%)' },
        { value: '7', label: 'IVA Simplificado (7%)' },
        { value: '5', label: 'IVA Agrícola (5%)' },
        { value: '0', label: 'Isento (0%)' },
    ];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">{title || 'Dados do Produto'}</h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Estado:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" {...register('is_active')} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900">{initialData?.is_active ? 'Ativo' : 'Ativo'}</span>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Image and Basic Info */}
                <div className="md:col-span-1 space-y-6">
                    <Controller
                        name="image_url"
                        control={control}
                        render={({ field }) => (
                            <ImageUploader
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />

                    <Controller
                        name="tax_rate"
                        control={control}
                        render={({ field }) => (
                            <Select
                                label="Taxa de IVA"
                                options={taxOptions}
                                error={errors.tax_rate?.message}
                                {...field}
                                value={field.value?.toString()} // Ensure string for select
                                onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                        )}
                    />

                    <Controller
                        name="unit_type"
                        control={control}
                        render={({ field }) => (
                            <Select
                                label="Unidade"
                                options={unitOptions}
                                error={errors.unit_type?.message}
                                {...field}
                            />
                        )}
                    />
                </div>

                {/* Right Column: Detailed Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nome do Produto"
                            {...register('name')}
                            error={errors.name?.message}
                            placeholder="Ex: Água Mineral 1.5L"
                        />
                        <Controller
                            name="category_id"
                            control={control}
                            render={({ field }) => (
                                <CategorySelector
                                    label="Categoria"
                                    error={errors.category_id?.message}
                                    {...field}
                                    value={field.value || ''}
                                />
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Código Interno"
                            {...register('code')}
                            error={errors.code?.message}
                            placeholder="Gerado automaticamente"
                            readOnly
                            className="bg-gray-100 cursor-not-allowed"
                        />
                        <Input
                            label="Código de Barras (EAN)"
                            {...register('barcode')}
                            error={errors.barcode?.message}
                            placeholder="Scan ou digite..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Preço de Custo (AKZ)"
                            type="number"
                            step="0.01"
                            {...register('cost_price')}
                            error={errors.cost_price?.message}
                        />
                        <Input
                            label="Preço de Venda (AKZ)"
                            type="number"
                            step="0.01"
                            {...register('unit_price')}
                            error={errors.unit_price?.message}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Stock Atual"
                            type="number"
                            {...register('current_stock')}
                            error={errors.current_stock?.message}
                            disabled={!!initialData} // Usually stock is adjusted via movements, but initial set is ok
                        />
                        <Input
                            label="Stock Mínimo (Alerta)"
                            type="number"
                            {...register('min_stock')}
                            error={errors.min_stock?.message}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                            placeholder="Detalhes do produto..."
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    isLoading={isLoading}
                    variant="primary"
                >
                    {initialData ? 'Atualizar Produto' : 'Criar Produto'}
                </Button>
            </div>
        </form>
    );
};

export default ProductForm;
