'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import StockEntry from '@/components/stock/StockEntry';

export default function StockEntryPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/stock"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Registar Movimento de Stock</h1>
                    <p className="text-gray-500">Adicione entradas, saídas ou ajustes de inventário.</p>
                </div>
            </div>

            {/* Form Component */}
            <StockEntry />
        </div>
    );
}
