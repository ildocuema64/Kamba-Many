'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useCustomerStore } from '@/store/customerStore';
import { useAuthStore } from '@/store/authStore';
import CustomerList from '@/components/customers/CustomerList';
import StatsCard from '@/components/dashboard/StatsCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Users, UserCheck, FileText, ShoppingCart, Plus, RefreshCw, Search } from 'lucide-react';

export default function CustomersPage() {
    const { user } = useAuthStore();
    const {
        stats,
        filters,
        setFilters,
        fetchCustomers,
        fetchStats,
        isLoading
    } = useCustomerStore();

    useEffect(() => {
        if (user?.organization_id) {
            fetchCustomers(user.organization_id);
            fetchStats(user.organization_id);
        }
    }, [user?.organization_id, fetchCustomers, fetchStats]);

    const handleSearch = (search: string) => {
        setFilters({ ...filters, search });
        if (user?.organization_id) {
            fetchCustomers(user.organization_id);
        }
    };

    const handleRefresh = () => {
        if (user?.organization_id) {
            fetchCustomers(user.organization_id);
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
                    <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                    <p className="text-gray-500">Gestão de clientes e contactos.</p>
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
                    <Link href="/dashboard/customers/new">
                        <Button variant="primary">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Cliente
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Clientes"
                    value={stats.total.toString()}
                    change="Cadastrados"
                    icon={<Users className="w-8 h-8 text-blue-600" />}
                    colorClass="text-blue-600"
                    bgClass="bg-blue-50"
                />
                <StatsCard
                    title="Clientes Activos"
                    value={stats.active.toString()}
                    change="Operacionais"
                    icon={<UserCheck className="w-8 h-8 text-green-600" />}
                    colorClass="text-green-600"
                    bgClass="bg-green-50"
                />
                <StatsCard
                    title="Com NIF"
                    value={stats.withNif.toString()}
                    change="Registados"
                    icon={<FileText className="w-8 h-8 text-purple-600" />}
                    colorClass="text-purple-600"
                    bgClass="bg-purple-50"
                />
                <StatsCard
                    title="Volume Total"
                    value={formatCurrency(stats.totalPurchases)}
                    change="Em compras"
                    icon={<ShoppingCart className="w-8 h-8 text-yellow-600" />}
                    colorClass="text-yellow-600"
                    bgClass="bg-yellow-50"
                />
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome, NIF, telefone ou email..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={filters.search || ''}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Customer List */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <CustomerList />
            </div>
        </div>
    );
}
