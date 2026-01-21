'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCustomerStore } from '@/store/customerStore';
import CustomerForm from '@/components/customers/CustomerForm';
import Button from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function EditCustomerPage() {
    const params = useParams();
    const { selectedCustomer, fetchCustomerById, clearSelectedCustomer, isLoading } = useCustomerStore();

    const customerId = params.id as string;

    useEffect(() => {
        if (customerId) {
            fetchCustomerById(customerId);
        }

        return () => {
            clearSelectedCustomer();
        };
    }, [customerId, fetchCustomerById, clearSelectedCustomer]);

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
            <div className="flex items-center gap-4">
                <Link
                    href={`/dashboard/customers/${customerId}`}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
                    <p className="text-gray-500">Atualizar informações de {selectedCustomer.name}</p>
                </div>
            </div>

            {/* Form */}
            <CustomerForm customer={selectedCustomer} isEdit />
        </div>
    );
}
