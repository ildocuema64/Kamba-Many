'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useInvoiceStore } from '@/store/invoiceStore';
import InvoiceDetail from '@/components/invoices/InvoiceDetail';
import Button from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

/**
 * Página de detalhes da factura
 * 
 * Responsável por:
 * - Carregar dados da factura via store
 * - Renderizar InvoiceDetail (que contém toda a lógica de visualização e acções)
 */
export default function InvoiceDetailPage() {
    const params = useParams();
    const { selectedInvoice, fetchInvoiceById, clearSelectedInvoice, isLoading } = useInvoiceStore();

    const invoiceId = params.id as string;

    useEffect(() => {
        if (invoiceId) {
            fetchInvoiceById(invoiceId);
        }

        return () => {
            clearSelectedInvoice();
        };
    }, [invoiceId, fetchInvoiceById, clearSelectedInvoice]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-gray-500">Carregando factura...</div>
            </div>
        );
    }

    if (!selectedInvoice) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-gray-500">Factura não encontrada.</p>
                <Link href="/dashboard/invoices">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para Facturas
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header - apenas título, acções estão no InvoiceDetail */}
            <div className="flex items-center gap-4 print:hidden">
                <Link
                    href="/dashboard/invoices"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Factura {selectedInvoice.invoice_number}
                    </h1>
                    <p className="text-gray-500">Detalhes do documento fiscal</p>
                </div>
            </div>

            {/* Invoice Detail - contém toda a lógica de visualização, PDF e acções */}
            <InvoiceDetail invoice={selectedInvoice} />
        </div>
    );
}
