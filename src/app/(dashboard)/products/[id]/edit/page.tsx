'use client';

import React, { useEffect, useState } from 'react';
import ProductForm from '@/components/products/ProductForm';
import { useProductStore } from '@/store/productStore';
import { useRouter, useParams } from 'next/navigation';
import { Product } from '@/types';
import Spinner from '@/components/ui/Spinner';

export default function EditProductPage() {
    const { updateProduct, fetchProduct } = useProductStore();
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (id) {
                const p = await fetchProduct(id);
                setProduct(p);
                setLoading(false);
            }
        };
        load();
    }, [id, fetchProduct]);

    const handleSubmit = async (data: any) => {
        try {
            await updateProduct(id, data);
            router.push('/products');
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar produto');
        }
    };

    if (loading) return <div className="flex justify-center py-10"><Spinner size="lg" /></div>;
    if (!product) return <div className="p-6 text-center text-red-600">Produto não encontrado</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Editar Produto</h1>
                <p className="text-gray-500">Atualize as informações do produto.</p>
            </div>
            <ProductForm
                onSubmit={handleSubmit}
                initialData={product}
                title={`Editar: ${product.name}`}
            />
        </div>
    );
}
