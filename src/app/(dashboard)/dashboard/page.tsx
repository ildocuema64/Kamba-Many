'use client';

import React, { useEffect } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { useProductStore } from '@/store/productStore';
import { useStockStore } from '@/store/stockStore';
import StatsCard from '@/components/dashboard/StatsCard';
import SalesChart from '@/components/dashboard/SalesChart';
import TopProducts from '@/components/dashboard/TopProducts';
import Link from 'next/link';
import {
    ShoppingCart,
    Package,
    AlertTriangle,
    FileText,
    Plus,
    CreditCard
} from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { products, fetchProducts } = useProductStore();
    const { lowStockProducts, fetchLowStock } = useStockStore();

    useEffect(() => {
        if (user?.organization_id) {
            fetchProducts(user.organization_id);
            fetchLowStock(user.organization_id);
        }
    }, [user?.organization_id, fetchProducts, fetchLowStock]);

    const stats = [
        {
            title: 'Vendas Hoje',
            value: '0 Kz',
            change: '+0%',
            icon: <ShoppingCart className="w-8 h-8 text-green-600" />,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            title: 'Produtos',
            value: products.length.toString(),
            change: 'Total',
            icon: <Package className="w-8 h-8 text-blue-600" />,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            title: 'Stock Baixo',
            value: lowStockProducts.length.toString(),
            change: 'Alertas',
            icon: <AlertTriangle className="w-8 h-8 text-yellow-600" />,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
        },
        {
            title: 'Facturas',
            value: '0',
            change: 'Este mês',
            icon: <FileText className="w-8 h-8 text-purple-600" />,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
    ];

    return (
        <div>
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Bem-vindo, {user?.name}!
                </h1>
                <p className="text-gray-600">
                    Aqui está um resumo do seu sistema KAMBA Many
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatsCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        change={stat.change}
                        icon={stat.icon}
                        colorClass={stat.color}
                        bgClass={stat.bg}
                    />
                ))}
            </div>

            {/* Charts & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 h-96">
                    <SalesChart />
                </div>
                <div className="h-96">
                    <TopProducts />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Links */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link
                            href="/dashboard/pos"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-gray-100"
                        >
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                <CreditCard className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Nova Venda</p>
                                <p className="text-xs text-gray-500">Abrir POS</p>
                            </div>
                        </Link>

                        <Link
                            href="/products/new"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-gray-100"
                        >
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <Plus className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Novo Produto</p>
                                <p className="text-xs text-gray-500">Adicionar item</p>
                            </div>
                        </Link>

                        <Link
                            href="/invoices"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-gray-100"
                        >
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Ver Facturas</p>
                                <p className="text-xs text-gray-500">Histórico</p>
                            </div>
                        </Link>

                        <Link
                            href="/stock/entry"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-gray-100"
                        >
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                                <Package className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Entrada Stock</p>
                                <p className="text-xs text-gray-500">Registuar</p>
                            </div>
                        </Link>
                    </div>
                </Card>

                {/* System Status */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado do Sistema</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Base de Dados</span>
                            <Badge variant="success">Online</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Sincronização</span>
                            <Badge variant="info">Ativo</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Licença</span>
                            <Badge variant="success">Válida</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Conformidade Legal</span>
                            <Badge variant="success">OK</Badge>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-blue-900">Sistema em Conformidade</p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Decreto 74/19 e 71/25 - Facturação eletrónica válida
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
