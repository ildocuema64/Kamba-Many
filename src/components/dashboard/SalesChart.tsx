'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '@/components/ui/Card';

const SalesChart = () => {
    // Mock data for now - will be connected to real data in Sprint 3/4
    const data = [
        { name: 'Seg', uv: 0 },
        { name: 'Ter', uv: 0 },
        { name: 'Qua', uv: 0 },
        { name: 'Qui', uv: 0 },
        { name: 'Sex', uv: 0 },
        { name: 'Sab', uv: 0 },
        { name: 'Dom', uv: 0 },
    ];

    return (
        <Card className="h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas da Semana (Simulado)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="uv" stroke="#16a34a" fill="#dcfce7" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default SalesChart;
