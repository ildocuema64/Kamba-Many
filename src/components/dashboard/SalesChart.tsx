'use client';

import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import db from '@/lib/db/sqlite';
import { Loader2 } from 'lucide-react';

interface SalesDataPoint {
    name: string;
    uv: number;
}

const SalesChart = () => {
    const { user } = useAuthStore();
    const [data, setData] = useState<SalesDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        const fetchSalesData = async () => {
            if (!user?.organization_id) {
                setIsLoading(false);
                return;
            }

            try {
                // Get today's date and calculate 7 days ago
                const today = new Date();
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 6); // Include today

                // Generate last 7 days labels
                const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
                const days: { date: string; label: string }[] = [];

                for (let i = 0; i < 7; i++) {
                    const date = new Date(sevenDaysAgo);
                    date.setDate(sevenDaysAgo.getDate() + i);
                    days.push({
                        date: date.toISOString().split('T')[0],
                        label: dayNames[date.getDay()]
                    });
                }

                // Fetch sales data for the last 7 days
                const salesSql = `
                    SELECT 
                        date(sale_date) as sale_day,
                        COALESCE(SUM(total_amount), 0) as total
                    FROM sales 
                    WHERE organization_id = ? 
                      AND date(sale_date) >= date(?)
                      AND date(sale_date) <= date(?)
                    GROUP BY date(sale_date)
                `;

                const salesByDay = await db.query<{ sale_day: string; total: number }>(
                    salesSql,
                    [user.organization_id, days[0].date, days[6].date]
                );

                // Create a map of sales by date
                const salesMap = new Map<string, number>();
                salesByDay.forEach(row => {
                    salesMap.set(row.sale_day, row.total);
                });

                // Build chart data
                const chartData: SalesDataPoint[] = days.map(day => ({
                    name: day.label,
                    uv: salesMap.get(day.date) || 0
                }));

                const totalSales = chartData.reduce((sum, d) => sum + d.uv, 0);
                setHasData(totalSales > 0);
                setData(chartData);
            } catch (error) {
                console.error('Error fetching sales chart data:', error);
                // Set empty data on error
                setData([
                    { name: 'Seg', uv: 0 },
                    { name: 'Ter', uv: 0 },
                    { name: 'Qua', uv: 0 },
                    { name: 'Qui', uv: 0 },
                    { name: 'Sex', uv: 0 },
                    { name: 'Sab', uv: 0 },
                    { name: 'Dom', uv: 0 },
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSalesData();
    }, [user?.organization_id]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value) + ' Kz';
    };

    return (
        <Card className="h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Vendas da Semana
                {!hasData && !isLoading && (
                    <span className="text-sm font-normal text-gray-500 ml-2">(Sem vendas)</span>
                )}
            </h3>
            <div className="h-64">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [formatCurrency(Number(value) || 0), 'Vendas']}
                            />
                            <Area type="monotone" dataKey="uv" stroke="#16a34a" fill="#dcfce7" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </Card>
    );
};

export default SalesChart;
