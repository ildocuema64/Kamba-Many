'use client';

import StockMovements from '@/components/stock/StockMovements';

export default function StockMovementsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Histórico de Movimentações</h1>
                <p className="text-gray-500">Consulte o histórico completo de todas as operações de stock.</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <StockMovements />
            </div>
        </div>
    );
}
