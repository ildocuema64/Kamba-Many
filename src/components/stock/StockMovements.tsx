'use client';

import React, { useEffect } from 'react';
import { useStockStore } from '@/store/stockStore';
import { useAuthStore } from '@/store/authStore';
import { Table } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import { StockMovement } from '@/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { format } from 'date-fns';

const StockMovements: React.FC = () => {
    const { movements, fetchMovements, isLoading } = useStockStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (user?.organization_id) {
            fetchMovements(user.organization_id);
        }
    }, [user?.organization_id, fetchMovements]);

    const columns = [
        {
            key: 'date',
            header: 'Data',
            accessor: 'movement_date' as keyof (StockMovement & { product_name: string }),
            render: (item: any) => new Date(item.movement_date).toLocaleDateString('pt-AO') + ' ' + new Date(item.movement_date).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
        },
        {
            key: 'product',
            header: 'Produto',
            accessor: 'product_name' as keyof (StockMovement & { product_name: string }),
            render: (item: any) => <span className="font-medium text-gray-900">{item.product_name}</span>
        },
        {
            key: 'type',
            header: 'Tipo',
            accessor: 'movement_type' as keyof (StockMovement & { product_name: string }),
            render: (item: any) => {
                const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
                    'ENTRADA': 'success',
                    'SAIDA': 'error',
                    'AJUSTE': 'warning',
                    'VENDA': 'info',
                    'DEVOLUCAO': 'success'
                };
                return <Badge variant={variants[item.movement_type] || 'default'}>{item.movement_type}</Badge>;
            }
        },
        {
            key: 'quantity',
            header: 'Qtd',
            accessor: 'quantity' as keyof (StockMovement & { product_name: string }),
            render: (item: any) => (
                <span className={['ENTRADA', 'DEVOLUCAO'].includes(item.movement_type) ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {['ENTRADA', 'DEVOLUCAO'].includes(item.movement_type) ? '+' : '-'}{item.quantity}
                </span>
            )
        },
        {
            key: 'notes',
            header: 'Obs',
            accessor: 'notes' as keyof (StockMovement & { product_name: string }),
            render: (item: any) => <span className="text-sm text-gray-500 truncate max-w-xs block" title={item.notes}>{item.notes || '-'}</span>
        }
    ];

    return (
        <Table
            columns={columns}
            data={movements}
            loading={isLoading}
            emptyState={{
                title: "Sem movimentações",
                description: "Nenhuma movimentação de stock registada."
            }}
        />
    );
};

export default StockMovements;
