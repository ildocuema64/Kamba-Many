'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useAuthStore } from '@/store/authStore';
import InvoiceFilters from '@/components/invoices/InvoiceFilters';
import InvoiceList from '@/components/invoices/InvoiceList';
import StatsCard from '@/components/dashboard/StatsCard';
import Button from '@/components/ui/Button';
import { FileText, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

export default function InvoicesPage() {
    const { user } = useAuthStore();
    const {
        filters,
        stats,
        setFilters,
        fetchInvoices,
        fetchStats,
        isLoading
    } = useInvoiceStore();

    useEffect(() => {
        if (user?.organization_id) {
            fetchInvoices(user.organization_id);
            fetchStats(user.organization_id);
        }
    }, [user?.organization_id, fetchInvoices, fetchStats]);

    const handleApplyFilters = () => {
        if (user?.organization_id) {
            fetchInvoices(user.organization_id);
        }
    };

    const handleRefresh = () => {
        if (user?.organization_id) {
            fetchInvoices(user.organization_id);
            fetchStats(user.organization_id);
        }
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value) + ' Kz';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
                    <p className="text-gray-500">Gestão de documentos fiscais e proformas.</p>
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
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Facturas"
                    value={stats.total.toString()}
                    change="Total"
                    icon={<FileText className="w-8 h-8 text-blue-600" />}
                    colorClass="text-blue-600"
                    bgClass="bg-blue-50"
                />
                <StatsCard
                    title="Emitidas"
                    value={stats.emitidas.toString()}
                    change="Activas"
                    icon={<CheckCircle className="w-8 h-8 text-green-600" />}
                    colorClass="text-green-600"
                    bgClass="bg-green-50"
                />
                <StatsCard
                    title="Pendentes"
                    value={stats.pendingPayment.toString()}
                    change="Pagamento"
                    icon={<Clock className="w-8 h-8 text-yellow-600" />}
                    colorClass="text-yellow-600"
                    bgClass="bg-yellow-50"
                />
                <StatsCard
                    title="Este Mês"
                    value={formatCurrency(stats.monthTotal)}
                    change="Facturado"
                    icon={<FileText className="w-8 h-8 text-purple-600" />}
                    colorClass="text-purple-600"
                    bgClass="bg-purple-50"
                />
            </div>

            {/* Filters */}
            <InvoiceFilters
                filters={filters}
                onFilterChange={setFilters}
                onApply={handleApplyFilters}
            />

            {/* Invoice List */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <InvoiceList />
            </div>
        </div>
    );
}
