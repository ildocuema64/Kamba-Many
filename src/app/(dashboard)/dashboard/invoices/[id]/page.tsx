'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInvoiceStore } from '@/store/invoiceStore';
import InvoiceDetail from '@/components/invoices/InvoiceDetail';
import Button from '@/components/ui/Button';
import { ArrowLeft, Printer, Download, XCircle } from 'lucide-react';

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
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

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                <div className="flex items-center gap-4">
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
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir
                    </Button>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                    </Button>
                </div>
            </div>

            {/* Invoice Detail */}
            <InvoiceDetail invoice={selectedInvoice} />
        </div>
    );
}
