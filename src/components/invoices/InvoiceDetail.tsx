'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InvoiceWithItems, Organization } from '@/types';
import InvoiceDocument from './InvoiceDocument';
import CreditNoteModal from './CreditNoteModal';
import DebitNoteModal from './DebitNoteModal';
import { ArrowLeft, Printer, XCircle, AlertTriangle, Loader2, Download, FileText, FileMinus, FilePlus, FileCode } from 'lucide-react';
import { downloadInvoiceXML } from '@/lib/xml/invoiceXml';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useAuthStore } from '@/store/authStore';
import { generateInvoicePDFFromElement } from '@/lib/pdf/invoicePdf';
import { InvoiceRepository } from '@/lib/db/repositories/InvoiceRepository';
import db from '@/lib/db/sqlite';
import { useRouter } from 'next/navigation';

interface InvoiceDetailProps {
    invoice: InvoiceWithItems;
}

/**
 * InvoiceDetail - Wrapper para visualização de factura
 * 
 * Este componente fornece:
 * - Barra de acções (Voltar, Anular, Imprimir, PDF)
 * - Modal de anulação
 * - Conversão de Proforma em Factura
 * - Botões para NC/ND (a implementar)
 * - Renderização do documento via InvoiceDocument (fonte única da verdade)
 */
const InvoiceDetail: React.FC<InvoiceDetailProps> = ({ invoice }) => {
    const router = useRouter();
    const { user } = useAuthStore();
    const { voidInvoice, fetchInvoiceById } = useInvoiceStore();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [showVoidModal, setShowVoidModal] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
    const [showDebitNoteModal, setShowDebitNoteModal] = useState(false);
    const [voidReason, setVoidReason] = useState('');
    const [isVoiding, setIsVoiding] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Referência ao componente InvoiceDocument para geração de PDF
    const invoiceDocumentRef = useRef<HTMLDivElement>(null);

    // Fetch Organization Details
    useEffect(() => {
        if (invoice?.organization_id) {
            try {
                const org = db.queryOne<Organization>('SELECT * FROM organizations WHERE id = ?', [invoice.organization_id]);
                setOrganization(org);
            } catch (error) {
                console.error('Failed to fetch organization details:', error);
            }
        }
    }, [invoice]);

    if (!invoice) return null;

    const isProforma = invoice.document_type === 'FACTURA_PROFORMA';
    const isFiscalInvoice = ['FACTURA', 'FACTURA_RECIBO', 'FACTURA_SIMPLIFICADA'].includes(invoice.document_type);
    const canVoid = invoice.status === 'EMITIDA' && !isProforma;
    const canConvert = isProforma && invoice.status === 'EMITIDA';
    const canCreateNC = isFiscalInvoice && invoice.status === 'EMITIDA';

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!invoiceDocumentRef.current) {
            console.error('Invoice document ref not found');
            return;
        }

        setIsGeneratingPdf(true);
        try {
            await generateInvoicePDFFromElement(invoiceDocumentRef.current, invoice);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Erro ao gerar PDF: ' + (error as Error).message);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleVoid = async () => {
        if (!voidReason.trim()) return;

        setIsVoiding(true);
        try {
            await voidInvoice(invoice.id, voidReason);
            setShowVoidModal(false);
            setVoidReason('');
        } catch (error) {
            alert('Erro ao anular factura: ' + (error as Error).message);
        } finally {
            setIsVoiding(false);
        }
    };

    const handleConvertToInvoice = async () => {
        if (!user?.organization_id || !user?.id) {
            alert('Utilizador não autenticado');
            return;
        }

        setIsConverting(true);
        try {
            const now = new Date().toISOString();

            // Create a new FACTURA_RECIBO based on the proforma
            const newInvoice = await InvoiceRepository.create({
                organization_id: invoice.organization_id,
                source_id: invoice.id, // Reference to the proforma
                document_type: 'FACTURA_RECIBO',
                customer_name: invoice.customer_name,
                customer_nif: invoice.customer_nif,
                customer_phone: invoice.customer_phone,
                customer_email: invoice.customer_email,
                customer_address: invoice.customer_address,
                subtotal: invoice.subtotal,
                tax_amount: invoice.tax_amount,
                discount_amount: invoice.discount_amount,
                total_amount: invoice.total_amount,
                tax_date: now,
                issue_date: now,
                status: 'EMITIDA',
                payment_status: 'PAID',
                payment_method: 'DINHEIRO',
                user_id: user.id,
                notes: `Convertido da Proforma ${invoice.invoice_number}`,
                is_fiscal: true,
                system_entry_date: now
            }, invoice.items.map(item => ({
                product_id: item.product_id,
                product_code: item.product_code,
                product_name: item.product_name,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                discount_amount: item.discount_amount
            })));

            setShowConvertModal(false);

            // Navigate to the new invoice
            router.push(`/dashboard/invoices/${newInvoice.id}`);
        } catch (error) {
            console.error('Convert error:', error);
            alert('Erro ao converter proforma: ' + (error as Error).message);
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto my-8 print:m-0 print:w-full print:max-w-none">

            {/* Action Bar - Hidden on Print */}
            <div className="mb-6 flex flex-wrap justify-between items-center gap-3 print:hidden bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Voltar</span>
                </button>
                <div className="flex flex-wrap gap-2">
                    {/* Convert Proforma to Invoice */}
                    {canConvert && (
                        <button
                            onClick={() => setShowConvertModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Converter em Factura</span>
                        </button>
                    )}

                    {/* Credit Note */}
                    {canCreateNC && (
                        <button
                            onClick={() => setShowCreditNoteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-orange-200"
                        >
                            <FileMinus className="w-4 h-4" />
                            <span>Nota Crédito</span>
                        </button>
                    )}

                    {/* Debit Note */}
                    {canCreateNC && (
                        <button
                            onClick={() => setShowDebitNoteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                        >
                            <FilePlus className="w-4 h-4" />
                            <span>Nota Débito</span>
                        </button>
                    )}

                    {/* Void Invoice */}
                    {canVoid && (
                        <button
                            onClick={() => setShowVoidModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                            <XCircle className="w-4 h-4" />
                            <span>Anular</span>
                        </button>
                    )}

                    {/* Download XML (apenas para facturas fiscais) */}
                    {isFiscalInvoice && (
                        <button
                            onClick={() => downloadInvoiceXML(invoice, organization)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-200"
                            title="Download XML SAF-T"
                        >
                            <FileCode className="w-4 h-4" />
                            <span>XML</span>
                        </button>
                    )}

                    {/* Download PDF */}
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPdf}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                        {isGeneratingPdf ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        <span>PDF</span>
                    </button>

                    {/* Print */}
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Imprimir</span>
                    </button>
                </div>
            </div>

            {/* Invoice Document - FONTE ÚNICA DA VERDADE */}
            {/* Este mesmo componente é usado para pré-visualização E geração de PDF */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 print:border-0 print:shadow-none overflow-hidden">
                <InvoiceDocument
                    ref={invoiceDocumentRef}
                    invoice={invoice}
                    organization={organization}
                />
            </div>

            {/* Void Modal */}
            {showVoidModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold">Anular Factura</h3>
                        </div>

                        <p className="text-gray-600 mb-4 text-sm">
                            Tem a certeza que deseja anular esta factura? <br />
                            <span className="font-medium text-gray-900">Esta acção irá reverter o stock dos produtos.</span>
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Motivo da anulação <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={voidReason}
                                onChange={(e) => setVoidReason(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none text-sm"
                                rows={3}
                                placeholder="Descreva o motivo..."
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowVoidModal(false)}
                                disabled={isVoiding}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleVoid}
                                disabled={!voidReason.trim() || isVoiding}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                {isVoiding ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Confirmar Anulação
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Convert to Invoice Modal */}
            {showConvertModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 text-green-600 mb-4">
                            <div className="p-2 bg-green-100 rounded-full">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold">Converter em Factura</h3>
                        </div>

                        <p className="text-gray-600 mb-4 text-sm">
                            Deseja converter esta Proforma em <strong>Factura-Recibo</strong>?
                        </p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
                            <p><strong>Cliente:</strong> {invoice.customer_name}</p>
                            <p><strong>Valor:</strong> {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(invoice.total_amount)}</p>
                            <p><strong>Itens:</strong> {invoice.items.length}</p>
                        </div>

                        <p className="text-gray-500 text-xs mb-6">
                            Será criada uma nova Factura-Recibo fiscal com os mesmos dados.
                            A proforma original será mantida como referência.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConvertModal(false)}
                                disabled={isConverting}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConvertToInvoice}
                                disabled={isConverting}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                Confirmar Conversão
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Credit Note Modal */}
            <CreditNoteModal
                isOpen={showCreditNoteModal}
                onClose={() => setShowCreditNoteModal(false)}
                onSuccess={(invoiceId) => {
                    setShowCreditNoteModal(false);
                    router.push(`/dashboard/invoices/${invoiceId}`);
                }}
                sourceInvoice={invoice}
            />

            {/* Debit Note Modal */}
            <DebitNoteModal
                isOpen={showDebitNoteModal}
                onClose={() => setShowDebitNoteModal(false)}
                onSuccess={(invoiceId) => {
                    setShowDebitNoteModal(false);
                    router.push(`/dashboard/invoices/${invoiceId}`);
                }}
                sourceInvoice={invoice}
            />
        </div>
    );
};

export default InvoiceDetail;
