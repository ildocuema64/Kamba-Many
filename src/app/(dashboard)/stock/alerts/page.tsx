'use client';

import LowStockAlert from '@/components/stock/LowStockAlert';

export default function StockAlertsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Alertas de Stock</h1>
                <p className="text-gray-500">Produtos que necessitam de reposição urgente.</p>
            </div>
            <LowStockAlert />
        </div>
    );
}
