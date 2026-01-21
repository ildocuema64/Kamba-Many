'use client';

import React from 'react';
import Card from '@/components/ui/Card';

const TopProducts = () => {
    // Mock data - will be connected in Sprint 3/4
    const products = [
        { name: 'Exemplo Produto A', sold: 0, revenue: '0' },
        { name: 'Exemplo Produto B', sold: 0, revenue: '0' },
        { name: 'Exemplo Produto C', sold: 0, revenue: '0' },
    ];

    return (
        <Card className="h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
            <div className="space-y-4">
                {products.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div>
                            <p className="font-medium text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.sold} unidades</p>
                        </div>
                        <span className="font-semibold text-gray-900">{p.revenue} Kz</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

export default TopProducts;
