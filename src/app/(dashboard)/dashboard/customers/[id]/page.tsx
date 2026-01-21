'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCustomerStore } from '@/store/customerStore';
import CustomerDetail from '@/components/customers/CustomerDetail';
import Button from '@/components/ui/Button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { selectedCustomer, fetchCustomerById, deleteCustomer, clearSelectedCustomer, isLoading } = useCustomerStore();

    const customerId = params.id as string;

    useEffect(() => {
        if (customerId) {
            fetchCustomerById(customerId);
        }

        return () => {
            clearSelectedCustomer();
        };
    }, [customerId, fetchCustomerById, clearSelectedCustomer]);

    const handleDelete = async () => {
        if (!selectedCustomer) return;

        const confirm = window.confirm(`Tem certeza que deseja desativar o cliente "${selectedCustomer.name}"?`);
        if (confirm) {
            try {
                await deleteCustomer(selectedCustomer.id);
                alert('Cliente desativado com sucesso!');
                router.push('/dashboard/customers');
            } catch (error) {
                alert('Erro ao desativar cliente');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-gray-500">Carregando cliente...</div>
            </div>
        );
    }

    if (!selectedCustomer) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-gray-500">Cliente não encontrado.</p>
                <Link href="/dashboard/customers">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para Clientes
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/customers"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h1>
                        <p className="text-gray-500">Detalhes do cliente</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href={`/dashboard/customers/${customerId}/edit`}>
                        <Button variant="outline">
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                        </Button>
                    </Link>
                    <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Desativar
                    </Button>
                </div>
            </div>

            {/* Customer Detail */}
            <CustomerDetail customer={selectedCustomer} />
        </div>
    );
}
