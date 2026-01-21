'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductWithCategory } from '@/types';
import { useProductStore } from '@/store/productStore';
import { useAuthStore } from '@/store/authStore';
import ProductCard from './ProductCard';
import { Search, Package, Loader2 } from 'lucide-react';

interface ProductGridProps {
    onProductSelect: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ onProductSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuthStore();
    const { products, isLoading, fetchProducts, searchProducts } = useProductStore();

    useEffect(() => {
        if (user?.organization_id) {
            fetchProducts(user.organization_id);
        }
    }, [user?.organization_id, fetchProducts]);

    // Filter products based on search
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;

        const query = searchQuery.toLowerCase();
        return products.filter(product =>
            product.name.toLowerCase().includes(query) ||
            product.code.toLowerCase().includes(query) ||
            product.barcode?.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query)
        );
    }, [products, searchQuery]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Pesquisar produto, código ou código de barras..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[var(--primary)] focus:outline-none transition-colors text-sm"
                        autoComplete="off"
                    />
                </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Package className="w-16 h-16 mb-4" />
                        <p className="text-lg font-medium">
                            {searchQuery ? 'Nenhum produto encontrado' : 'Sem produtos'}
                        </p>
                        <p className="text-sm mt-1">
                            {searchQuery
                                ? 'Tente uma pesquisa diferente'
                                : 'Adicione produtos para começar a vender'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onSelect={onProductSelect}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Results Count */}
            {!isLoading && filteredProducts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                        {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProductGrid;
