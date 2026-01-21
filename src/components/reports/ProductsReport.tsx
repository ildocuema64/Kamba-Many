'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface TopProduct {
    id: string;
    name: string;
    code: string;
    quantity: number;
    revenue: number;
}

interface LowStockProduct {
    id: string;
    name: string;
    code: string;
    current_stock: number;
    min_stock: number;
}

interface ProductsReportProps {
    topProducts: TopProduct[];
    lowStockProducts: LowStockProduct[];
    totalProducts: number;
    activeProducts: number;
    outOfStock: number;
}

const ProductsReport: React.FC<ProductsReportProps> = ({
    topProducts,
    lowStockProducts,
    totalProducts,
    activeProducts,
    outOfStock
}) => {
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const chartData = topProducts.slice(0, 10).map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        quantidade: p.quantity,
        receita: p.revenue
    }));

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total de Produtos</p>
                            <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                            <p className="text-sm text-gray-500">no catálogo</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Produtos Activos</p>
                            <p className="text-2xl font-bold text-gray-900">{activeProducts}</p>
                            <p className="text-sm text-green-600">disponíveis para venda</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Sem Stock</p>
                            <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
                            <p className="text-sm text-red-500">requerem atenção</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products Chart */}
                <Card>
                    <h3 className="font-semibold text-gray-900 mb-4">Top 10 Produtos Mais Vendidos</h3>
                    {topProducts.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fontSize: 11 }}
                                        width={100}
                                    />
                                    <Tooltip />
                                    <Bar dataKey="quantidade" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Quantidade" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-500">
                            Sem dados de vendas no período
                        </div>
                    )}
                </Card>

                {/* Top Products Table */}
                <Card>
                    <h3 className="font-semibold text-gray-900 mb-4">Receita por Produto</h3>
                    {topProducts.length > 0 ? (
                        <div className="overflow-auto max-h-80">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="text-left px-3 py-2 font-medium text-gray-600">Produto</th>
                                        <th className="text-right px-3 py-2 font-medium text-gray-600">Qtd</th>
                                        <th className="text-right px-3 py-2 font-medium text-gray-600">Receita</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {topProducts.slice(0, 10).map((product, index) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400">{index + 1}.</span>
                                                    <div>
                                                        <p className="font-medium text-gray-900 truncate max-w-[150px]">{product.name}</p>
                                                        <p className="text-xs text-gray-500">{product.code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-right px-3 py-2">{product.quantity}</td>
                                            <td className="text-right px-3 py-2 font-medium text-green-600">
                                                {formatCurrency(product.revenue)} Kz
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-500">
                            Sem dados de vendas no período
                        </div>
                    )}
                </Card>
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <h3 className="font-semibold text-gray-900">Produtos com Stock Baixo</h3>
                        <Badge variant="warning">{lowStockProducts.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {lowStockProducts.slice(0, 6).map((product) => (
                            <div
                                key={product.id}
                                className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg"
                            >
                                <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                <p className="text-xs text-gray-500">{product.code}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-sm text-yellow-700">
                                        Stock: <span className="font-bold">{product.current_stock}</span>
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Mín: {product.min_stock}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ProductsReport;
