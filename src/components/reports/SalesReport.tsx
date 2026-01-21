'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, CreditCard, Banknote } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar
} from 'recharts';

interface SalesData {
    date: string;
    total: number;
    count: number;
}

interface PaymentMethodData {
    name: string;
    value: number;
    color: string;
}

interface SalesReportProps {
    salesData: SalesData[];
    totalSales: number;
    totalRevenue: number;
    averageTicket: number;
    paymentMethods: PaymentMethodData[];
    previousPeriodRevenue?: number;
}

const SalesReport: React.FC<SalesReportProps> = ({
    salesData,
    totalSales,
    totalRevenue,
    averageTicket,
    paymentMethods,
    previousPeriodRevenue
}) => {
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const revenueChange = previousPeriodRevenue
        ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
        : 0;

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Receita Total</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)} Kz</p>
                            {previousPeriodRevenue !== undefined && (
                                <div className={`flex items-center gap-1 text-sm ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {revenueChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    <span>{Math.abs(revenueChange).toFixed(1)}% vs período anterior</span>
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total de Vendas</p>
                            <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
                            <p className="text-sm text-gray-500">transações</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <ShoppingCart className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Ticket Médio</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(averageTicket)} Kz</p>
                            <p className="text-sm text-gray-500">por venda</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <CreditCard className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <Card>
                    <h3 className="font-semibold text-gray-900 mb-4">Evolução das Vendas</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    formatter={(value: number) => [`${formatCurrency(value)} Kz`, 'Valor']}
                                    labelStyle={{ color: '#374151' }}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#3B82F6"
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Payment Methods */}
                <Card>
                    <h3 className="font-semibold text-gray-900 mb-4">Métodos de Pagamento</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethods}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {paymentMethods.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [`${formatCurrency(value)} Kz`, 'Valor']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Sales by Day (Bar Chart) */}
            <Card>
                <h3 className="font-semibold text-gray-900 mb-4">Número de Vendas por Período</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} name="Vendas" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default SalesReport;
