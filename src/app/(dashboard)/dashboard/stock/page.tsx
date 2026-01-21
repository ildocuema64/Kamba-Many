'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import LowStockAlert from '@/components/stock/LowStockAlert';
import StockMovements from '@/components/stock/StockMovements';
import { Plus, RefreshCw } from 'lucide-react';
import { useStockStore } from '@/store/stockStore';
import { useAuthStore } from '@/store/authStore';

export default function StockPage() {
    const { user } = useAuthStore();
    const { fetchMovements, fetchLowStock, isLoading } = useStockStore();

    const handleRefresh = () => {
        if (user?.organization_id) {
            fetchMovements(user.organization_id);
            fetchLowStock(user.organization_id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Stock</h1>
                    <p className="text-gray-500">Controle de inventário e movimentações de stock.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Link href="/dashboard/stock/entry">
                        <Button variant="primary">
                            <Plus className="w-4 h-4 mr-2" />
                            Registar Entrada
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Layout com Alertas e Movimentos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Painel de Alertas (1/3) */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Alertas</h2>
                    <LowStockAlert />
                </div>

                {/* Histórico de Movimentos (2/3) */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Histórico de Movimentações</h2>
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <StockMovements />
                    </div>
                </div>
            </div>
        </div>
    );
}
