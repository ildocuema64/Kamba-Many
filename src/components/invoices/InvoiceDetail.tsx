'use client';

import React, { useState, useEffect } from 'react';
import { InvoiceWithItems, DocumentType, InvoiceStatus, Organization } from '@/types';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { FileText, User, Calendar, Hash, ArrowLeft, Printer, XCircle, AlertTriangle, Loader2 } from 'lucide-react'; // Removing non-essential icons
import { useInvoiceStore } from '@/store/invoiceStore';
import db from '@/lib/db/sqlite'; // Import DB directly for org details

interface InvoiceDetailProps {
    invoice: InvoiceWithItems;
}

const InvoiceDetail: React.FC<InvoiceDetailProps> = ({ invoice }) => {
    const { voidInvoice } = useInvoiceStore();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [showVoidModal, setShowVoidModal] = useState(false);
    const [voidReason, setVoidReason] = useState('');
    const [isVoiding, setIsVoiding] = useState(false);

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

    const getDocTypeName = (type: DocumentType): string => {
        const names: Record<DocumentType, string> = {
            'FACTURA': 'Factura',
            'FACTURA_RECIBO': 'Factura-Recibo',
            'FACTURA_SIMPLIFICADA': 'Factura Simplificada',
            'FACTURA_PROFORMA': 'Factura Proforma',
            'NOTA_CREDITO': 'Nota de Crédito',
            'NOTA_DEBITO': 'Nota de Débito'
        };
        return names[type] || type;
    };

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
            year: 'numeric',
            //            hour: '2-digit',
            //            minute: '2-digit'
        });
    };

    const handlePrint = () => {
        window.print();
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

    /* Professional A4 Layout Styles */
    return (
        <div className="max-w-4xl mx-auto my-8 print:m-0 print:w-full print:max-w-none">

            {/* Action Bar - Hidden on Print */}
            <div className="mb-6 flex justify-between items-center print:hidden bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Voltar</span>
                </button>
                <div className="flex gap-3">
                    {invoice.status === 'EMITIDA' && (
                        <button
                            onClick={() => setShowVoidModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                            <XCircle className="w-4 h-4" />
                            <span>Anular</span>
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Imprimir</span>
                    </button>
                </div>
            </div>

            {/* Invoice Paper Document */}
            <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-200 print:border-0 print:shadow-none print:p-8 relative overflow-hidden print:w-full">

                {/* Status Watermark for Non-Issued States */}
                {invoice.status !== 'EMITIDA' && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform -rotate-45 pointer-events-none opacity-10 z-0 whitespace-nowrap">
                        <span className={`text-7xl md:text-8xl font-black uppercase ${invoice.status === 'ANULADA' || invoice.status === 'CANCELADA' ? 'text-red-500' : 'text-gray-300'
                            }`}>
                            {invoice.status}
                        </span>
                    </div>
                )}

                {/* Header Section */}
                <div className="flex justify-between items-start mb-12 relative z-10">
                    {/* Organization / Logo */}
                    <div className="w-1/2">
                        {organization?.logo_url ? (
                            <img
                                src={organization.logo_url}
                                alt={organization.name}
                                className="h-24 w-auto object-contain mb-4"
                            />
                        ) : (
                            <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-2xl font-bold text-gray-400">{organization?.name?.charAt(0) || 'Co'}</span>
                            </div>
                        )}

                        <h1 className="text-lg font-bold text-gray-900 uppercase tracking-wide">{organization?.name || 'Nome da Empresa'}</h1>
                        <div className="text-sm text-gray-500 mt-2 space-y-1">
                            {organization?.nif && <p>NIF: {organization.nif}</p>}
                            {organization?.address && <p>{organization.address}</p>}
                            {organization?.phone && <p>Tel: {organization.phone}</p>}
                            {organization?.email && <p>Email: {organization.email}</p>}
                        </div>
                    </div>

                    {/* Document Details */}
                    <div className="w-1/2 text-right">
                        <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-1">
                            {getDocTypeName(invoice.document_type)}
                        </h2>
                        <p className="text-gray-500 font-mono text-sm mb-6">
                            Nº {invoice.invoice_number}
                        </p>

                        <div className="inline-block text-left bg-gray-50 p-4 rounded-lg border border-gray-100 min-w-[200px]">
                            <div className="mb-3 border-b border-gray-200 pb-2">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Data de Emissão</p>
                                <p className="font-medium text-gray-900">{formatDate(invoice.issue_date)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Vencimento</p>
                                <p className="font-medium text-gray-900">
                                    {invoice.due_date ? formatDate(invoice.due_date) : formatDate(invoice.issue_date)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Section */}
                <div className="mb-12 relative z-10">
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-semibold">Exmo.(s) Sr.(s)</p>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{invoice.customer_name}</h3>
                        <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                            {invoice.customer_nif && <p><span className="w-20 inline-block text-gray-400">NIF:</span> {invoice.customer_nif}</p>}
                            {invoice.customer_phone && <p><span className="w-20 inline-block text-gray-400">Tel:</span> {invoice.customer_phone}</p>}
                            {invoice.customer_email && <p><span className="w-20 inline-block text-gray-400">Email:</span> {invoice.customer_email}</p>}
                            {invoice.customer_address && <p className="md:col-span-2 mt-1"><span className="w-20 inline-block text-gray-400">Endereço:</span> {invoice.customer_address}</p>}
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-12 relative z-10">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-gray-900">
                                <th className="text-left py-3 font-bold text-gray-900 uppercase tracking-wider pl-2">Descrição</th>
                                <th className="text-right py-3 font-bold text-gray-900 uppercase tracking-wider w-24">Qtd</th>
                                <th className="text-right py-3 font-bold text-gray-900 uppercase tracking-wider w-32">Preço Unit.</th>
                                <th className="text-right py-3 font-bold text-gray-900 uppercase tracking-wider w-24">Desc.</th>
                                <th className="text-right py-3 font-bold text-gray-900 uppercase tracking-wider w-24">Taxa</th>
                                <th className="text-right py-3 font-bold text-gray-900 uppercase tracking-wider w-32 pr-2">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoice.items.map((item) => (
                                <tr key={item.id} className="group">
                                    <td className="py-4 pl-2">
                                        <p className="font-semibold text-gray-800">{item.product_name}</p>
                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{item.product_code}</p>
                                        {item.tax_exemption_code && (
                                            <p className="text-[10px] text-gray-400 mt-1 italic">
                                                Isenção: {item.tax_exemption_code} ({item.tax_exemption_reason})
                                            </p>
                                        )}
                                    </td>
                                    <td className="text-right py-4 align-top text-gray-600">{item.quantity}</td>
                                    <td className="text-right py-4 align-top text-gray-600">{formatCurrency(item.unit_price)}</td>
                                    <td className="text-right py-4 align-top text-gray-600">
                                        {item.discount_amount > 0 ? (
                                            <span className="text-red-500">-{formatCurrency(item.discount_amount)}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="text-right py-4 align-top text-gray-600">
                                        {item.tax_rate > 0 ? `${item.tax_rate}%` : '0%'}
                                    </td>
                                    <td className="text-right py-4 align-top font-medium text-gray-900 pr-2">{formatCurrency(item.line_total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary Section */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-12 relative z-10 border-t border-gray-200 pt-6">
                    <div className="w-full md:w-1/2 mb-6 md:mb-0 pr-8">
                        {/* Notes / Payment Info */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Informação de Pagamento</h4>
                                <div className="text-sm text-gray-600">
                                    <p><span className="font-medium">Método:</span> {invoice.payment_method || 'Não especificado'}</p>
                                    <p><span className="font-medium">Estado:</span> {invoice.payment_status === 'PAID' ? 'Pago' : 'Pendente'}</p>
                                </div>
                            </div>

                            {invoice.notes && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Observações</h4>
                                    <p className="text-xs text-gray-500 italic">{invoice.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Totals Box */}
                    <div className="w-full md:w-1/2 md:max-w-xs ml-auto">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            {invoice.discount_amount > 0 && (
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Desconto</span>
                                    <span className="text-red-500">-{formatCurrency(invoice.discount_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Imposto (IVA)</span>
                                <span>{formatCurrency(invoice.tax_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-900 mt-2">
                                <span className="text-base font-bold text-gray-900 uppercase">Total Geral</span>
                                <span className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Legal / Hash */}
                <div className="mt-auto pt-8 border-t border-gray-100 text-center md:text-left relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                        <div className="text-xs text-gray-400 space-y-1">
                            <p className="font-mono">
                                {invoice.is_fiscal ? (
                                    <>
                                        <span className="font-bold text-gray-600 px-1 border border-gray-300 rounded mr-1">
                                            {invoice.hash ? invoice.hash.substring(0, 4) : '....'}
                                        </span>
                                        - Processado por programa validado nº 31.1/AGT20
                                    </>
                                ) : (
                                    <span className="font-bold">ESTE DOCUMENTO NÃO SERVE DE FACTURA</span>
                                )}
                            </p>
                            <p>KAMBA Many - Software Certificado</p>
                            {invoice.hash && (
                                <p className="text-[8px] text-gray-300 break-all w-64 md:w-96 font-mono leading-tight mt-1">
                                    Full Hash: {invoice.hash}
                                </p>
                            )}
                        </div>

                        {/* Placeholder for QR Code */}
                        {invoice.is_fiscal && (
                            <div className="hidden md:block">
                                {/* <QrCode className="w-16 h-16 text-gray-800" /> */}
                                {/* Real QR code implementation would go here */}
                            </div>
                        )}
                    </div>
                </div>

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
        </div>
    );
};

export default InvoiceDetail;
