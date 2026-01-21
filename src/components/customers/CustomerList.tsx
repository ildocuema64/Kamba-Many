'use client';

import React, { useEffect } from 'react';
import { useCustomerStore } from '@/store/customerStore';
import { useAuthStore } from '@/store/authStore';
import { Table } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import { Customer } from '@/types';
import { useRouter } from 'next/navigation';

const CustomerList: React.FC = () => {
    const router = useRouter();
    const { customers, fetchCustomers, isLoading } = useCustomerStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (user?.organization_id) {
            fetchCustomers(user.organization_id);
        }
    }, [user?.organization_id, fetchCustomers]);

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA',
            minimumFractionDigits: 0
        }).format(value);
    };

    const columns = [
        {
            header: 'Nome',
            accessor: 'name' as keyof Customer,
            render: (item: Customer) => (
                <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.nif && (
                        <p className="text-xs text-gray-500">NIF: {item.nif}</p>
                    )}
                </div>
            )
        },
        {
            header: 'Contacto',
            accessor: 'phone' as keyof Customer,
            render: (item: Customer) => (
                <div className="text-sm">
                    {item.phone && <p>{item.phone}</p>}
                    {item.email && <p className="text-gray-500">{item.email}</p>}
                </div>
            )
        },
        {
            header: 'Morada',
            accessor: 'address' as keyof Customer,
            render: (item: Customer) => (
                <span className="text-sm text-gray-600 truncate max-w-[200px] block">
                    {item.address || '-'}
                </span>
            )
        },
        {
            header: 'Total Compras',
            accessor: 'total_purchases' as keyof Customer,
            render: (item: Customer) => (
                <span className="font-medium text-green-600">
                    {formatCurrency(item.total_purchases)}
                </span>
            )
        },
        {
            header: 'Estado',
            accessor: 'is_active' as keyof Customer,
            render: (item: Customer) => (
                <Badge variant={item.is_active ? 'success' : 'default'}>
                    {item.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
            )
        }
    ];

    const handleRowClick = (customer: Customer) => {
        router.push(`/dashboard/customers/${customer.id}`);
    };

    return (
        <Table
            columns={columns}
            data={customers}
            loading={isLoading}
            onRowClick={handleRowClick}
            emptyState={{
                title: "Sem clientes",
                description: "Nenhum cliente cadastrado. Adicione o primeiro cliente."
            }}
        />
    );
};

export default CustomerList;
