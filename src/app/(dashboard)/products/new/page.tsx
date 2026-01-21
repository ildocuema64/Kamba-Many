'use client';

import ProductForm from '@/components/products/ProductForm';
import { useProductStore } from '@/store/productStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
    const { createProduct } = useProductStore();
    const { user } = useAuthStore();
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        if (!user?.organization_id) {
            alert('Erro: Sessão inválida (Organization ID missing)');
            return;
        }

        try {
            await createProduct({
                ...data,
                organization_id: user.organization_id,
            });
            router.push('/products');
        } catch (error) {
            console.error(error);
            alert('Erro ao criar produto');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
                <p className="text-gray-500">Adicione um novo produto ao seu catálogo.</p>
            </div>
            <ProductForm onSubmit={handleSubmit} />
        </div>
    );
}
