'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import ReportFilters, { ReportPeriod } from '@/components/reports/ReportFilters';
import SalesReport from '@/components/reports/SalesReport';
import ProductsReport from '@/components/reports/ProductsReport';
import db from '@/lib/db/sqlite';
import { BarChart3, ShoppingCart, Package, TrendingUp } from 'lucide-react';

type ReportTab = 'sales' | 'products';

interface SalesData {
    date: string;
    total: number;
    count: number;
}

interface PaymentMethodData {
    name: string;
    value: number;
    color: string;
    [key: string]: string | number;
}

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

export default function ReportsPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<ReportTab>('sales');
    const [period, setPeriod] = useState<ReportPeriod>('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Sales Report Data
    const [salesData, setSalesData] = useState<SalesData[]>([]);
    const [totalSales, setTotalSales] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [averageTicket, setAverageTicket] = useState(0);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);

    // Products Report Data
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [activeProducts, setActiveProducts] = useState(0);
    const [outOfStock, setOutOfStock] = useState(0);

    const getDateRange = () => {
        const now = new Date();
        let start: Date;
        const end = new Date(now);

        switch (period) {
            case 'today':
                start = new Date(now);
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                start = new Date(now);
                start.setDate(now.getDate() - now.getDay());
                start.setHours(0, 0, 0, 0);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                break;
            case 'custom':
                return { start: startDate, end: endDate };
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    };

    const fetchSalesData = async () => {
        if (!user?.organization_id) return;

        const { start, end } = getDateRange();

        try {
            // Sales by day
            const salesByDaySql = `
                SELECT 
                    date(sale_date) as date,
                    SUM(total_amount) as total,
                    COUNT(*) as count
                FROM sales 
                WHERE organization_id = ? 
                  AND date(sale_date) >= date(?) 
                  AND date(sale_date) <= date(?)
                GROUP BY date(sale_date)
                ORDER BY date ASC
            `;
            const salesByDay = await db.query<{ date: string; total: number; count: number }>(
                salesByDaySql, [user.organization_id, start, end]
            );
            setSalesData(salesByDay.map(d => ({
                date: new Date(d.date).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' }),
                total: d.total,
                count: d.count
            })));

            // Totals
            const totalsSql = `
                SELECT 
                    COUNT(*) as count,
                    COALESCE(SUM(total_amount), 0) as total
                FROM sales 
                WHERE organization_id = ? 
                  AND date(sale_date) >= date(?) 
                  AND date(sale_date) <= date(?)
            `;
            const totals = await db.queryOne<{ count: number; total: number }>(
                totalsSql, [user.organization_id, start, end]
            );
            setTotalSales(totals?.count || 0);
            setTotalRevenue(totals?.total || 0);
            setAverageTicket(totals?.count ? (totals.total / totals.count) : 0);

            // Payment methods
            const paymentSql = `
                SELECT 
                    payment_method,
                    SUM(total_amount) as total
                FROM sales 
                WHERE organization_id = ? 
                  AND date(sale_date) >= date(?) 
                  AND date(sale_date) <= date(?)
                GROUP BY payment_method
            `;
            const payments = await db.query<{ payment_method: string; total: number }>(
                paymentSql, [user.organization_id, start, end]
            );
            const colors: Record<string, string> = {
                'DINHEIRO': '#10B981',
                'TPA': '#3B82F6',
                'TRANSFERENCIA': '#F59E0B',
                'MULTICAIXA': '#EF4444',
                'OUTRO': '#8B5CF6'
            };
            setPaymentMethods(payments.map(p => ({
                name: p.payment_method,
                value: p.total,
                color: colors[p.payment_method] || '#6B7280'
            })));
        } catch (error) {
            console.error('Error fetching sales data:', error);
        }
    };

    const fetchProductsData = async () => {
        if (!user?.organization_id) return;

        const { start, end } = getDateRange();

        try {
            // Top products
            const topProductsSql = `
                SELECT 
                    si.product_id as id,
                    si.product_name as name,
                    si.product_code as code,
                    SUM(si.quantity) as quantity,
                    SUM(si.line_total) as revenue
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE s.organization_id = ? 
                  AND date(s.sale_date) >= date(?) 
                  AND date(s.sale_date) <= date(?)
                GROUP BY si.product_id
                ORDER BY quantity DESC
                LIMIT 10
            `;
            const top = await db.query<TopProduct>(
                topProductsSql, [user.organization_id, start, end]
            );
            setTopProducts(top);

            // Low stock
            const lowStockSql = `
                SELECT id, name, code, current_stock, min_stock
                FROM products 
                WHERE organization_id = ? 
                  AND is_active = 1
                  AND current_stock <= min_stock
                ORDER BY current_stock ASC
                LIMIT 10
            `;
            const lowStock = await db.query<LowStockProduct>(
                lowStockSql, [user.organization_id]
            );
            setLowStockProducts(lowStock);

            // Product stats
            const statsSql = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock
                FROM products 
                WHERE organization_id = ?
            `;
            const stats = await db.queryOne<{ total: number; active: number; out_of_stock: number }>(
                statsSql, [user.organization_id]
            );
            setTotalProducts(stats?.total || 0);
            setActiveProducts(stats?.active || 0);
            setOutOfStock(stats?.out_of_stock || 0);
        } catch (error) {
            console.error('Error fetching products data:', error);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'sales') {
                await fetchSalesData();
            } else {
                await fetchProductsData();
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.organization_id, activeTab, period]);

    const tabs = [
        { id: 'sales' as ReportTab, label: 'Vendas', icon: ShoppingCart },
        { id: 'products' as ReportTab, label: 'Produtos', icon: Package },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
                    <p className="text-gray-500">Análise de vendas e produtos.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <ReportFilters
                period={period}
                startDate={startDate}
                endDate={endDate}
                onPeriodChange={setPeriod}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onRefresh={fetchData}
                isLoading={isLoading}
            />

            {/* Report Content */}
            {activeTab === 'sales' && (
                <SalesReport
                    salesData={salesData}
                    totalSales={totalSales}
                    totalRevenue={totalRevenue}
                    averageTicket={averageTicket}
                    paymentMethods={paymentMethods}
                />
            )}

            {activeTab === 'products' && (
                <ProductsReport
                    topProducts={topProducts}
                    lowStockProducts={lowStockProducts}
                    totalProducts={totalProducts}
                    activeProducts={activeProducts}
                    outOfStock={outOfStock}
                />
            )}
        </div>
    );
}
