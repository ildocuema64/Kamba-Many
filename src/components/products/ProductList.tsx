'use client';

import React, { useEffect, useState } from 'react';
import { useProductStore } from '@/store/productStore';
import { useAuthStore } from '@/store/authStore';
import { Table } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import { ProductWithCategory } from '@/types';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useDataRefresh } from '@/hooks/useDataRefresh';

const ProductList: React.FC = () => {
    const { products, isLoading, fetchProducts, deleteProduct, searchProducts } = useProductStore();
    const { user } = useAuthStore();
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [search, setSearch] = useState('');
    const refreshKey = useDataRefresh();

    useEffect(() => {
        if (user?.organization_id) {
            fetchProducts(user.organization_id);
        }
    }, [user?.organization_id, fetchProducts, refreshKey]);

    const handleSearch = React.useCallback((value: string) => {
        setSearch(value);
        if (value && user?.organization_id) {
            searchProducts(value, user.organization_id);
        } else if (user?.organization_id) {
            fetchProducts(user.organization_id);
        }
    }, [user?.organization_id, searchProducts, fetchProducts]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        if (confirm('Tem certeza que deseja eliminar este produto?')) {
            await deleteProduct(id);
        }
    };

    const handleEdit = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/dashboard/products/${id}/edit`);
    }

    const columns = [
        {
            header: 'Produto',
            key: 'name',
            render: (product: ProductWithCategory) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs text-gray-400">Sem Foto</span>
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.code} {product.barcode ? `| ${product.barcode}` : ''}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Categoria',
            key: 'category_name',
            render: (product: ProductWithCategory) => (
                <span className="text-sm text-gray-600">{product.category_name || '-'}</span>
            )
        },
        {
            header: 'Preço',
            key: 'unit_price',
            render: (product: ProductWithCategory) => (
                <div className="font-medium text-gray-900">
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.unit_price)}
                </div>
            )
        },
        {
            header: 'Stock',
            key: 'current_stock',
            render: (product: ProductWithCategory) => {
                const isLowStock = product.current_stock <= product.min_stock;
                return (
                    <Badge variant={isLowStock ? 'warning' : 'success'}>
                        {product.current_stock} {product.unit_type}
                    </Badge>
                );
            }
        },
        {
            header: 'Estado',
            key: 'is_active',
            render: (product: ProductWithCategory) => (
                <Badge variant={product.is_active ? 'success' : 'error'}>
                    {product.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
            )
        },
        {
            header: 'Ações',
            key: 'actions',
            render: (product: ProductWithCategory) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => handleEdit(product.id, e)}
                        className="p-1 hover:bg-gray-100 rounded text-blue-600 transition-colors"
                        title="Editar"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={(e) => handleDelete(product.id, e)}
                        className="p-1 hover:bg-gray-100 rounded text-red-600 transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <SearchInput
                    placeholder="Pesquisar por nome, código..."
                    onSearch={handleSearch}
                    className="w-full sm:w-72"
                />
                <Button
                    onClick={() => router.push('/dashboard/products/new')}
                    className="flex items-center gap-2"
                >
                    <Plus size={20} />
                    Novo Produto
                </Button>
            </div>

            <Table
                columns={columns}
                data={products}
                loading={isLoading}
                onRowClick={(product) => router.push(`/dashboard/products/${product.id}/edit`)}
                emptyState={{
                    title: "Nenhum produto encontrado",
                    description: "Comece adicionando seu primeiro produto ao sistema.",
                    actionLabel: "Adicionar Produto",
                    onAction: () => router.push('/dashboard/products/new')
                }}
            />
        </div>
    );
};

export default ProductList;
