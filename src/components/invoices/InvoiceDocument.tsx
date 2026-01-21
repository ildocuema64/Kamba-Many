'use client';

import React, { forwardRef } from 'react';
import { InvoiceWithItems, DocumentType, Organization } from '@/types';

interface InvoiceDocumentProps {
    invoice: InvoiceWithItems;
    organization: Organization | null;
}

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
    });
};

/**
 * InvoiceDocument - Componente unificado para pré-visualização e PDF
 * Este componente é a FONTE ÚNICA DA VERDADE para o layout da factura.
 * Usar em ambos os contextos: visualização web e geração de PDF.
 */
const InvoiceDocument = forwardRef<HTMLDivElement, InvoiceDocumentProps>(
    ({ invoice, organization }, ref) => {
        if (!invoice) return null;

        return (
            <div
                ref={ref}
                className="invoice-document bg-white relative overflow-hidden"
                style={{
                    width: '210mm',
                    minHeight: '297mm',
                    padding: '10mm', // Reduzido de 15mm para garantir margem de segurança
                    fontFamily: "'Inter', sans-serif",
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                    fontSize: '9pt', // Definindo tamanho base explícito
                }}
            >
                {/* Status Watermark for Non-Issued States */}
                {invoice.status !== 'EMITIDA' && (
                    <div
                        className="absolute top-1/2 left-1/2 pointer-events-none whitespace-nowrap"
                        style={{
                            transform: 'translate(-50%, -50%) rotate(-45deg)',
                            opacity: 0.1,
                            zIndex: 0,
                        }}
                    >
                        <span
                            style={{
                                fontSize: '3.5rem',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                color: invoice.status === 'ANULADA' || invoice.status === 'CANCELADA' ? '#ef4444' : '#d1d5db',
                            }}
                        >
                            {invoice.status}
                        </span>
                    </div>
                )}

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12mm', position: 'relative', zIndex: 10 }}>
                    {/* Organization / Logo */}
                    <div style={{ width: '50%' }}>
                        {organization?.logo_url ? (
                            <img
                                src={organization.logo_url}
                                alt={organization.name}
                                style={{ height: '24mm', width: 'auto', objectFit: 'contain', marginBottom: '4mm' }}
                            />
                        ) : (
                            <div
                                style={{
                                    height: '20mm',
                                    width: '20mm',
                                    backgroundColor: '#f3f4f6',
                                    borderRadius: '2mm',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '4mm',
                                }}
                            >
                                <span style={{ fontSize: '16pt', fontWeight: 700, color: '#9ca3af' }}>
                                    {organization?.name?.charAt(0) || 'Co'}
                                </span>
                            </div>
                        )}

                        <h1 style={{ fontSize: '12pt', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                            {organization?.name || 'Nome da Empresa'}
                        </h1>
                        <div style={{ fontSize: '9pt', color: '#6b7280', marginTop: '2mm' }}>
                            {organization?.nif && <p style={{ margin: '1mm 0' }}>NIF: {organization.nif}</p>}
                            {organization?.address && <p style={{ margin: '1mm 0' }}>{organization.address}</p>}
                            {organization?.phone && <p style={{ margin: '1mm 0' }}>Tel: {organization.phone}</p>}
                            {organization?.email && <p style={{ margin: '1mm 0' }}>Email: {organization.email}</p>}
                        </div>
                    </div>

                    {/* Document Details */}
                    <div style={{ width: '50%', textAlign: 'right' }}>
                        <h2 style={{ fontSize: '16pt', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1mm', margin: 0 }}>
                            {getDocTypeName(invoice.document_type)}
                        </h2>
                        <p style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '9pt', marginBottom: '6mm', margin: '0 0 6mm 0' }}>
                            Nº {invoice.invoice_number}
                        </p>

                        <div
                            style={{
                                backgroundColor: '#f9fafb',
                                padding: '4mm',
                                borderRadius: '2mm',
                                border: '1px solid #e5e7eb',
                                width: '55mm',
                                marginLeft: 'auto',
                                marginTop: '4mm',
                            }}
                        >
                            <div style={{ marginBottom: '3mm', borderBottom: '1px solid #e5e7eb', paddingBottom: '2mm' }}>
                                <p style={{ fontSize: '7pt', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: 600 }}>Data de Emissão</p>
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: '9pt', margin: '1mm 0 0 0' }}>{formatDate(invoice.issue_date)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '7pt', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: 600 }}>Vencimento</p>
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: '9pt', margin: '1mm 0 0 0' }}>
                                    {invoice.due_date ? formatDate(invoice.due_date) : formatDate(invoice.issue_date)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Section */}
                <div style={{ marginBottom: '12mm', position: 'relative', zIndex: 10 }}>
                    <div
                        style={{
                            backgroundColor: '#f9fafb',
                            borderRadius: '2mm',
                            padding: '6mm',
                            border: '1px solid #f3f4f6',
                        }}
                    >
                        <p style={{ fontSize: '7pt', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3mm', fontWeight: 600, margin: '0 0 3mm 0' }}>
                            Exmo.(s) Sr.(s)
                        </p>
                        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '2mm', margin: '0 0 2mm 0' }}>
                            {invoice.customer_name}
                        </h3>
                        <div style={{ fontSize: '9pt', color: '#4b5563', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2mm 8mm' }}>
                            {invoice.customer_nif && (
                                <p style={{ margin: 0 }}>
                                    <span style={{ color: '#9ca3af' }}>NIF:</span> {invoice.customer_nif}
                                </p>
                            )}
                            {invoice.customer_phone && (
                                <p style={{ margin: 0 }}>
                                    <span style={{ color: '#9ca3af' }}>Tel:</span> {invoice.customer_phone}
                                </p>
                            )}
                            {invoice.customer_email && (
                                <p style={{ margin: 0 }}>
                                    <span style={{ color: '#9ca3af' }}>Email:</span> {invoice.customer_email}
                                </p>
                            )}
                            {invoice.customer_address && (
                                <p style={{ gridColumn: 'span 2', marginTop: '1mm', margin: '1mm 0 0 0' }}>
                                    <span style={{ color: '#9ca3af' }}>Endereço:</span> {invoice.customer_address}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div style={{ marginBottom: '12mm', position: 'relative', zIndex: 10 }}>
                    <table style={{ width: '100%', fontSize: '8pt', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #111827' }}>
                                <th style={{ textAlign: 'left', padding: '3mm 2mm', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</th>
                                <th style={{ textAlign: 'right', padding: '3mm 2mm', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', width: '15mm' }}>Qtd</th>
                                <th style={{ textAlign: 'right', padding: '3mm 2mm', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', width: '25mm' }}>Preço Unit.</th>
                                <th style={{ textAlign: 'right', padding: '3mm 2mm', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', width: '18mm' }}>Desc.</th>
                                <th style={{ textAlign: 'right', padding: '3mm 2mm', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', width: '15mm' }}>Taxa</th>
                                <th style={{ textAlign: 'right', padding: '3mm 2mm', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', width: '25mm' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, index) => (
                                <tr key={item.id ?? `item-${index}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '4mm 2mm' }}>
                                        <p style={{ fontWeight: 600, color: '#1f2937', margin: 0 }}>{item.product_name}</p>
                                        <p style={{ fontSize: '8pt', color: '#6b7280', fontFamily: 'monospace', marginTop: '0.5mm', margin: '0.5mm 0 0 0' }}>{item.product_code}</p>
                                        {item.tax_exemption_code && (
                                            <p style={{ fontSize: '7pt', color: '#9ca3af', marginTop: '1mm', fontStyle: 'italic', margin: '1mm 0 0 0' }}>
                                                Isenção: {item.tax_exemption_code} ({item.tax_exemption_reason})
                                            </p>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '4mm 2mm', verticalAlign: 'top', color: '#4b5563' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'right', padding: '4mm 2mm', verticalAlign: 'top', color: '#4b5563' }}>{formatCurrency(item.unit_price)}</td>
                                    <td style={{ textAlign: 'right', padding: '4mm 2mm', verticalAlign: 'top', color: '#4b5563' }}>
                                        {item.discount_amount > 0 ? (
                                            <span style={{ color: '#ef4444' }}>-{formatCurrency(item.discount_amount)}</span>
                                        ) : '-'}
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '4mm 2mm', verticalAlign: 'top', color: '#4b5563' }}>
                                        {item.tax_rate > 0 ? `${item.tax_rate}%` : '0%'}
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '4mm 2mm', verticalAlign: 'top', fontWeight: 500, color: '#111827' }}>{formatCurrency(item.line_total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12mm', position: 'relative', zIndex: 10, borderTop: '1px solid #e5e7eb', paddingTop: '6mm' }}>
                    {/* Notes / Payment Info */}
                    <div style={{ width: '50%', paddingRight: '8mm' }}>
                        <div>
                            <h4 style={{ fontSize: '8pt', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2mm', margin: '0 0 2mm 0' }}>
                                Informação de Pagamento
                            </h4>
                            <div style={{ fontSize: '9pt', color: '#4b5563' }}>
                                <p style={{ margin: 0 }}><span style={{ fontWeight: 500 }}>Método:</span> {invoice.payment_method || 'Não especificado'}</p>
                                <p style={{ margin: 0 }}><span style={{ fontWeight: 500 }}>Estado:</span> {invoice.payment_status === 'PAID' ? 'Pago' : 'Pendente'}</p>
                            </div>
                        </div>

                        {invoice.notes && (
                            <div style={{ marginTop: '4mm' }}>
                                <h4 style={{ fontSize: '8pt', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1mm', margin: '0 0 1mm 0' }}>
                                    Observações
                                </h4>
                                <p style={{ fontSize: '8pt', color: '#6b7280', fontStyle: 'italic', margin: 0 }}>{invoice.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Totals Box */}
                    <div style={{ width: '50%', maxWidth: '70mm', marginLeft: 'auto' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt', color: '#4b5563', marginBottom: '3mm' }}>
                                <span>Subtotal</span>
                                <span>{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            {invoice.discount_amount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt', color: '#4b5563', marginBottom: '3mm' }}>
                                    <span>Desconto</span>
                                    <span style={{ color: '#ef4444' }}>-{formatCurrency(invoice.discount_amount)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt', color: '#4b5563', marginBottom: '3mm' }}>
                                <span>Imposto (IVA)</span>
                                <span>{formatCurrency(invoice.tax_amount)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4mm', borderTop: '2px solid #111827', marginTop: '2mm' }}>
                                <span style={{ fontSize: '10pt', fontWeight: 700, color: '#111827', textTransform: 'uppercase' }}>Total Geral</span>
                                <span style={{ fontSize: '14pt', fontWeight: 700, color: '#111827' }}>{formatCurrency(invoice.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Legal / Hash */}
                <div style={{ marginTop: 'auto', paddingTop: '8mm', borderTop: '1px solid #f3f4f6', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '7pt', color: '#9ca3af' }}>
                            <p style={{ fontFamily: 'monospace', margin: 0 }}>
                                {invoice.is_fiscal ? (
                                    <>
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                color: '#4b5563',
                                                padding: '1mm 2mm',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '1mm',
                                                marginRight: '1mm',
                                            }}
                                        >
                                            {invoice.hash ? invoice.hash.substring(0, 4) : '....'}
                                        </span>
                                        - Processado por programa validado nº 31.1/AGT20
                                    </>
                                ) : (
                                    <span style={{ fontWeight: 700 }}>ESTE DOCUMENTO NÃO SERVE DE FACTURA</span>
                                )}
                            </p>
                            <p style={{ marginTop: '2mm', margin: '2mm 0 0 0' }}>KAMBA Many - Software Certificado</p>
                            {invoice.hash && (
                                <p
                                    style={{
                                        fontSize: '5pt',
                                        color: '#d1d5db',
                                        wordBreak: 'break-all',
                                        maxWidth: '100mm',
                                        fontFamily: 'monospace',
                                        lineHeight: 1.3,
                                        marginTop: '1mm',
                                        margin: '1mm 0 0 0',
                                    }}
                                >
                                    Full Hash: {invoice.hash}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

InvoiceDocument.displayName = 'InvoiceDocument';

export default InvoiceDocument;
