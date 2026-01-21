'use client';

import StockEntry from '@/components/stock/StockEntry';

export default function StockEntryPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Entrada/Saída de Stock</h1>
                <p className="text-gray-500">Registe entradas, saídas, quebras ou ajustes de inventário.</p>
            </div>
            <StockEntry />
        </div>
    );
}
