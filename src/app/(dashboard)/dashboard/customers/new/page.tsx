'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CustomerForm from '@/components/customers/CustomerForm';

export default function NewCustomerPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/customers"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
                    <p className="text-gray-500">Adicione um novo cliente ao sistema.</p>
                </div>
            </div>

            {/* Form */}
            <CustomerForm />
        </div>
    );
}
