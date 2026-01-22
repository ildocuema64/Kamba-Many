'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import db from '@/lib/db/sqlite';
import { Loader2, Package } from 'lucide-react';

interface TopProduct {
    name: string;
    sold: number;
    revenue: number;
}

const TopProducts = () => {
    const { user } = useAuthStore();
    const [products, setProducts] = useState<TopProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTopProducts = async () => {
            if (!user?.organization_id) {
                setIsLoading(false);
                return;
            }

            try {
                // Get top selling products for the current month
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const startDate = startOfMonth.toISOString().split('T')[0];
                const endDate = now.toISOString().split('T')[0];

                const topProductsSql = `
                    SELECT 
                        si.product_name as name,
                        SUM(si.quantity) as sold,
                        SUM(si.line_total) as revenue
                    FROM sale_items si
                    JOIN sales s ON si.sale_id = s.id
                    WHERE s.organization_id = ? 
                      AND date(s.sale_date) >= date(?)
                      AND date(s.sale_date) <= date(?)
                    GROUP BY si.product_id
                    ORDER BY sold DESC
                    LIMIT 5
                `;

                const topProducts = await db.query<{ name: string; sold: number; revenue: number }>(
                    topProductsSql,
                    [user.organization_id, startDate, endDate]
                );

                setProducts(topProducts.map(p => ({
                    name: p.name,
                    sold: p.sold,
                    revenue: p.revenue
                })));
            } catch (error) {
                console.error('Error fetching top products:', error);
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTopProducts();
    }, [user?.organization_id]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <Card className="h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
            <div className="space-y-4">
                {isLoading ? (
                    <div className="h-32 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-gray-500">
                        <Package className="w-12 h-12 mb-2 text-gray-300" />
                        <p className="text-sm">Nenhuma venda este mês</p>
                    </div>
                ) : (
                    products.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                    {i + 1}
                                </span>
                                <div>
                                    <p className="font-medium text-gray-900">{p.name}</p>
                                    <p className="text-xs text-gray-500">{p.sold} unidades</p>
                                </div>
                            </div>
                            <span className="font-semibold text-gray-900">{formatCurrency(p.revenue)} Kz</span>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}

export default TopProducts;
