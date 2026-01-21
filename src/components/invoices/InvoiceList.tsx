'use client';

import React, { useEffect } from 'react';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useAuthStore } from '@/store/authStore';
import { Table } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import { Invoice, DocumentType, InvoiceStatus } from '@/types';
import { useRouter } from 'next/navigation';

const InvoiceList: React.FC = () => {
    const router = useRouter();
    const { invoices, fetchInvoices, isLoading } = useInvoiceStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (user?.organization_id) {
            fetchInvoices(user.organization_id);
        }
    }, [user?.organization_id, fetchInvoices]);

    const getDocTypeName = (type: DocumentType): string => {
        const names: Record<DocumentType, string> = {
            'FACTURA': 'Factura',
            'FACTURA_RECIBO': 'Factura-Recibo',
            'FACTURA_SIMPLIFICADA': 'Factura Simpl.',
            'FACTURA_PROFORMA': 'Proforma',
            'NOTA_CREDITO': 'Nota de Crédito',
            'NOTA_DEBITO': 'Nota de Débito'
        };
        return names[type] || type;
    };

    const getStatusVariant = (status: InvoiceStatus): 'success' | 'error' | 'warning' | 'default' | 'info' => {
        const variants: Record<InvoiceStatus, 'success' | 'error' | 'warning' | 'default' | 'info'> = {
            'EMITIDA': 'success',
            'CANCELADA': 'error',
            'ANULADA': 'warning',
            'RASCUNHO': 'default'
        };
        return variants[status] || 'default';
    };

    const getStatusName = (status: InvoiceStatus): string => {
        const names: Record<InvoiceStatus, string> = {
            'EMITIDA': 'Emitida',
            'CANCELADA': 'Cancelada',
            'ANULADA': 'Anulada',
            'RASCUNHO': 'Rascunho'
        };
        return names[status] || status;
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA',
            minimumFractionDigits: 2
        }).format(value);
    };

    const columns = [
        {
            key: 'invoice_number',
            header: 'Número',
            accessor: 'invoice_number' as keyof Invoice,
            render: (item: Invoice) => (
                <span className="font-mono font-medium text-blue-600">{item.invoice_number}</span>
            )
        },
        {
            key: 'document_type',
            header: 'Tipo',
            accessor: 'document_type' as keyof Invoice,
            render: (item: Invoice) => (
                <span className="text-sm">
                    {getDocTypeName(item.document_type)}
                    {item.is_fiscal && (
                        <span className="ml-1 text-xs text-green-600">●</span>
                    )}
                </span>
            )
        },
        {
            key: 'customer_name',
            header: 'Cliente',
            accessor: 'customer_name' as keyof Invoice,
            render: (item: Invoice) => (
                <div>
                    <p className="font-medium text-gray-900 truncate max-w-[200px]">{item.customer_name}</p>
                    {item.customer_nif && (
                        <p className="text-xs text-gray-500">NIF: {item.customer_nif}</p>
                    )}
                </div>
            )
        },
        {
            key: 'issue_date',
            header: 'Data',
            accessor: 'issue_date' as keyof Invoice,
            render: (item: Invoice) => (
                <span className="text-sm text-gray-600">
                    {new Date(item.issue_date).toLocaleDateString('pt-AO')}
                </span>
            )
        },
        {
            key: 'total_amount',
            header: 'Total',
            accessor: 'total_amount' as keyof Invoice,
            render: (item: Invoice) => (
                <span className="font-semibold text-gray-900">
                    {formatCurrency(item.total_amount)}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Estado',
            accessor: 'status' as keyof Invoice,
            render: (item: Invoice) => (
                <Badge variant={getStatusVariant(item.status)}>
                    {getStatusName(item.status)}
                </Badge>
            )
        }
    ];

    const handleRowClick = (invoice: Invoice) => {
        router.push(`/dashboard/invoices/${invoice.id}`);
    };

    return (
        <Table
            columns={columns}
            data={invoices}
            loading={isLoading}
            onRowClick={handleRowClick}
            emptyState={{
                title: "Sem facturas",
                description: "Nenhuma factura encontrada. As facturas são geradas automaticamente ao finalizar vendas."
            }}
        />
    );
};

export default InvoiceList;
