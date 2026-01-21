'use client';

import React, { useEffect } from 'react';
import { useStockStore } from '@/store/stockStore';
import { useAuthStore } from '@/store/authStore';
import Badge from '@/components/ui/Badge';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const LowStockAlert: React.FC = () => {
    const { lowStockProducts, fetchLowStock, isLoading } = useStockStore();
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (user?.organization_id) {
            fetchLowStock(user.organization_id);
        }
    }, [user?.organization_id, fetchLowStock]);

    if (isLoading) return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>;

    if (lowStockProducts.length === 0) return null;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-red-100 overflow-hidden">
            <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <AlertTriangle className="text-red-500 w-5 h-5" />
                <h3 className="font-semibold text-red-700">Alerta de Stock Baixo</h3>
            </div>
            <div className="divide-y divide-gray-100">
                {lowStockProducts.map(product => (
                    <div
                        key={product.id}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/dashboard/stock/entry`)} // Redirect to stock entry to fix
                    >
                        <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">Mín: {product.min_stock} {product.unit_type}</p>
                        </div>
                        <Badge variant="error">
                            {product.current_stock}
                        </Badge>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LowStockAlert;
