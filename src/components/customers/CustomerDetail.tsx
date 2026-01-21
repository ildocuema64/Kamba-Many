'use client';

import React from 'react';
import { Customer } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { User, Phone, Mail, MapPin, FileText, ShoppingCart } from 'lucide-react';

interface CustomerDetailProps {
    customer: Customer;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer }) => {
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA',
            minimumFractionDigits: 2
        }).format(value);
    };

    const formatDate = (date: string): string => {
        return new Date(date).toLocaleDateString('pt-AO', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
                        {customer.nif && (
                            <p className="text-gray-500">NIF: {customer.nif}</p>
                        )}
                    </div>
                </div>
                <Badge variant={customer.is_active ? 'success' : 'default'} className="text-base px-4 py-1">
                    {customer.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações de Contacto */}
                <Card>
                    <h3 className="font-semibold text-gray-900 mb-4">Informações de Contacto</h3>
                    <div className="space-y-4">
                        {customer.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-gray-400" />
                                <span>{customer.phone}</span>
                            </div>
                        )}
                        {customer.email && (
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-gray-400" />
                                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                                    {customer.email}
                                </a>
                            </div>
                        )}
                        {customer.address && (
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <span>{customer.address}</span>
                            </div>
                        )}
                        {!customer.phone && !customer.email && !customer.address && (
                            <p className="text-gray-500 text-sm">Sem informações de contacto</p>
                        )}
                    </div>
                </Card>

                {/* Estatísticas */}
                <Card>
                    <h3 className="font-semibold text-gray-900 mb-4">Resumo</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-green-700">Total de Compras</span>
                            </div>
                            <span className="font-bold text-green-600">
                                {formatCurrency(customer.total_purchases)}
                            </span>
                        </div>

                        <div className="text-sm text-gray-500 space-y-2">
                            <div className="flex justify-between">
                                <span>Cliente desde</span>
                                <span className="font-medium">{formatDate(customer.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Última atualização</span>
                                <span className="font-medium">{formatDate(customer.updated_at)}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Observações */}
            {customer.notes && (
                <Card>
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-900">Observações</h3>
                    </div>
                    <p className="text-gray-600">{customer.notes}</p>
                </Card>
            )}
        </div>
    );
};

export default CustomerDetail;
