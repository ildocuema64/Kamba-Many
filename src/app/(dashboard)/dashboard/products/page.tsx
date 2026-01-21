'use client';

import ProductList from '@/components/products/ProductList';

export default function ProductsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Produtos</h1>
                <p className="text-gray-500">Gerencie seu catálogo de produtos e serviços.</p>
            </div>
            <ProductList />
        </div>
    );
}
