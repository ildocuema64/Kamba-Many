'use client';

import React from 'react';
import LowStockAlert from '@/components/stock/LowStockAlert';
import StockMovements from '@/components/stock/StockMovements';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { PackagePlus, History, AlertTriangle } from 'lucide-react';

export default function StockDashboard() {
    const router = useRouter();

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Stock</h1>
                    <p className="text-gray-500">Controle de inventário e movimentações.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => router.push('/stock/entry')}>
                        <PackagePlus className="w-4 h-4 mr-2" />
                        Novo Movimento
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/stock/movements')}>
                        <History className="w-4 h-4 mr-2" />
                        Histórico
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-800">Movimentações Recentes</h2>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                        <StockMovements />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">Alertas e Status</h2>
                        <Button variant="ghost" size="sm" onClick={() => router.push('/stock/alerts')}>Ver Todos</Button>
                    </div>
                    <LowStockAlert />

                    {/* Summary Card placeholder */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="text-blue-800 font-medium mb-2">Dica Rápida</h3>
                        <p className="text-sm text-blue-600">
                            Realize inventários rotativos periodicamente para garantir a precisão do stock. Use a opção "Ajuste" para corrigir divergências.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
