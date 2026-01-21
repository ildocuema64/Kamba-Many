/**
 * Invoice PDF Generator - Sistema KAMBA Many
 * Gera PDF da fatura usando renderização HTML para correspondência pixel-perfect
 * com a pré-visualização do sistema.
 * 
 * IMPORTANTE: Este módulo usa html2canvas para converter o componente React
 * InvoiceDocument directamente para PDF, garantindo fonte única da verdade.
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceWithItems, DocumentType, Organization } from '@/types';

interface GeneratePDFOptions {
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

/**
 * Gera PDF a partir de um elemento HTML (InvoiceDocument)
 * Esta função captura o HTML renderizado e converte para PDF,
 * garantindo correspondência visual exacta com a pré-visualização.
 */
export async function generateInvoicePDFFromElement(
    element: HTMLElement,
    invoice: InvoiceWithItems
): Promise<void> {
    // Configurações para renderização de alta qualidade
    const canvas = await html2canvas(element, {
        scale: 2, // Alta resolução para impressão
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        // Dimensões A4 em pixels (210mm x 297mm @ 96dpi)
        windowWidth: 794,
        windowHeight: 1123,
    });

    // Dimensões A4 em mm
    const pdfWidth = 210;
    const pdfHeight = 297;

    // Criar documento PDF
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // Calcular dimensões proporcionais
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    // Se a imagem for maior que uma página, criar múltiplas páginas
    let heightLeft = imgHeight;
    let position = 0;

    // Converter canvas para imagem
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Primeira página
    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Páginas adicionais se necessário
    while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
    }

    // Gerar nome do ficheiro
    const fileName = `${getDocTypeName(invoice.document_type)}_${invoice.invoice_number.replace(/\//g, '-')}.pdf`;

    // Download do PDF
    doc.save(fileName);
}

/**
 * Função de conveniência mantida para compatibilidade retroactiva.
 * NOTA: Esta função está deprecated. Use generateInvoicePDFFromElement com uma referência
 * ao componente InvoiceDocument para garantir correspondência visual.
 * 
 * @deprecated Use generateInvoicePDFFromElement em conjunto com InvoiceDocument
 */
export function generateInvoicePDF({ invoice, organization }: GeneratePDFOptions): void {
    console.warn(
        'generateInvoicePDF está deprecated. ' +
        'Use generateInvoicePDFFromElement com uma referência ao componente InvoiceDocument.'
    );

    // Fallback: criar elemento temporário com estrutura HTML
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm';
    tempContainer.style.minHeight = '297mm';
    tempContainer.style.padding = '15mm';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.fontFamily = "'Inter', sans-serif";
    tempContainer.style.boxSizing = 'border-box';

    tempContainer.innerHTML = generateInvoiceHTML(invoice, organization);

    document.body.appendChild(tempContainer);

    generateInvoicePDFFromElement(tempContainer, invoice)
        .then(() => {
            document.body.removeChild(tempContainer);
        })
        .catch((error) => {
            document.body.removeChild(tempContainer);
            console.error('Erro ao gerar PDF:', error);
        });
}

/**
 * Gera HTML da factura (usado apenas como fallback)
 */
function generateInvoiceHTML(invoice: InvoiceWithItems, organization: Organization | null): string {
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

    const itemsHTML = invoice.items.map(item => `
        <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4mm 2mm;">
                <p style="font-weight: 600; color: #1f2937; margin: 0;">${item.product_name}</p>
                <p style="font-size: 8pt; color: #6b7280; font-family: monospace; margin: 0.5mm 0 0 0;">${item.product_code}</p>
                ${item.tax_exemption_code ? `<p style="font-size: 7pt; color: #9ca3af; margin: 1mm 0 0 0; font-style: italic;">Isenção: ${item.tax_exemption_code}</p>` : ''}
            </td>
            <td style="text-align: right; padding: 4mm 2mm; vertical-align: top; color: #4b5563;">${item.quantity}</td>
            <td style="text-align: right; padding: 4mm 2mm; vertical-align: top; color: #4b5563;">${formatCurrency(item.unit_price)}</td>
            <td style="text-align: right; padding: 4mm 2mm; vertical-align: top; color: #4b5563;">
                ${item.discount_amount > 0 ? `<span style="color: #ef4444;">-${formatCurrency(item.discount_amount)}</span>` : '-'}
            </td>
            <td style="text-align: right; padding: 4mm 2mm; vertical-align: top; color: #4b5563;">
                ${item.tax_rate > 0 ? `${item.tax_rate}%` : '0%'}
            </td>
            <td style="text-align: right; padding: 4mm 2mm; vertical-align: top; font-weight: 500; color: #111827;">${formatCurrency(item.line_total)}</td>
        </tr>
    `).join('');

    return `
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12mm;">
            <div style="width: 50%;">
                <div style="height: 20mm; width: 20mm; background-color: #f3f4f6; border-radius: 2mm; display: flex; align-items: center; justify-content: center; margin-bottom: 4mm;">
                    <span style="font-size: 16pt; font-weight: 700; color: #9ca3af;">${organization?.name?.charAt(0) || 'Co'}</span>
                </div>
                <h1 style="font-size: 12pt; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">
                    ${organization?.name || 'Nome da Empresa'}
                </h1>
                <div style="font-size: 9pt; color: #6b7280; margin-top: 2mm;">
                    ${organization?.nif ? `<p style="margin: 1mm 0;">NIF: ${organization.nif}</p>` : ''}
                    ${organization?.address ? `<p style="margin: 1mm 0;">${organization.address}</p>` : ''}
                    ${organization?.phone ? `<p style="margin: 1mm 0;">Tel: ${organization.phone}</p>` : ''}
                    ${organization?.email ? `<p style="margin: 1mm 0;">Email: ${organization.email}</p>` : ''}
                </div>
            </div>
            <div style="width: 50%; text-align: right;">
                <h2 style="font-size: 16pt; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 1mm 0;">
                    ${getDocTypeName(invoice.document_type)}
                </h2>
                <p style="color: #6b7280; font-family: monospace; font-size: 9pt; margin: 0 0 6mm 0;">
                    Nº ${invoice.invoice_number}
                </p>
                <div style="display: inline-block; text-align: left; background-color: #f9fafb; padding: 4mm; border-radius: 2mm; border: 1px solid #f3f4f6; min-width: 55mm;">
                    <div style="margin-bottom: 3mm; border-bottom: 1px solid #e5e7eb; padding-bottom: 2mm;">
                        <p style="font-size: 7pt; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">Data de Emissão</p>
                        <p style="font-weight: 500; color: #111827; font-size: 9pt; margin: 0;">${formatDate(invoice.issue_date)}</p>
                    </div>
                    <div>
                        <p style="font-size: 7pt; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">Vencimento</p>
                        <p style="font-weight: 500; color: #111827; font-size: 9pt; margin: 0;">${invoice.due_date ? formatDate(invoice.due_date) : formatDate(invoice.issue_date)}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Customer -->
        <div style="margin-bottom: 12mm;">
            <div style="background-color: #f9fafb; border-radius: 2mm; padding: 6mm; border: 1px solid #f3f4f6;">
                <p style="font-size: 7pt; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 3mm 0; font-weight: 600;">Exmo.(s) Sr.(s)</p>
                <h3 style="font-size: 14pt; font-weight: 700; color: #111827; margin: 0 0 2mm 0;">${invoice.customer_name}</h3>
                <div style="font-size: 9pt; color: #4b5563;">
                    ${invoice.customer_nif ? `<p style="margin: 0;"><span style="color: #9ca3af;">NIF:</span> ${invoice.customer_nif}</p>` : ''}
                    ${invoice.customer_phone ? `<p style="margin: 0;"><span style="color: #9ca3af;">Tel:</span> ${invoice.customer_phone}</p>` : ''}
                    ${invoice.customer_email ? `<p style="margin: 0;"><span style="color: #9ca3af;">Email:</span> ${invoice.customer_email}</p>` : ''}
                    ${invoice.customer_address ? `<p style="margin: 1mm 0 0 0;"><span style="color: #9ca3af;">Endereço:</span> ${invoice.customer_address}</p>` : ''}
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <div style="margin-bottom: 12mm;">
            <table style="width: 100%; font-size: 8pt; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid #111827;">
                        <th style="text-align: left; padding: 3mm 2mm; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.05em;">Descrição</th>
                        <th style="text-align: right; padding: 3mm 2mm; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; width: 15mm;">Qtd</th>
                        <th style="text-align: right; padding: 3mm 2mm; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; width: 25mm;">Preço Unit.</th>
                        <th style="text-align: right; padding: 3mm 2mm; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; width: 18mm;">Desc.</th>
                        <th style="text-align: right; padding: 3mm 2mm; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; width: 15mm;">Taxa</th>
                        <th style="text-align: right; padding: 3mm 2mm; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; width: 25mm;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
        </div>

        <!-- Summary -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12mm; border-top: 1px solid #e5e7eb; padding-top: 6mm;">
            <div style="width: 50%; padding-right: 8mm;">
                <h4 style="font-size: 8pt; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 2mm 0;">Informação de Pagamento</h4>
                <div style="font-size: 9pt; color: #4b5563;">
                    <p style="margin: 0;"><span style="font-weight: 500;">Método:</span> ${invoice.payment_method || 'Não especificado'}</p>
                    <p style="margin: 0;"><span style="font-weight: 500;">Estado:</span> ${invoice.payment_status === 'PAID' ? 'Pago' : 'Pendente'}</p>
                </div>
                ${invoice.notes ? `
                    <div style="margin-top: 4mm;">
                        <h4 style="font-size: 8pt; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 1mm 0;">Observações</h4>
                        <p style="font-size: 8pt; color: #6b7280; font-style: italic; margin: 0;">${invoice.notes}</p>
                    </div>
                ` : ''}
            </div>
            <div style="width: 50%; max-width: 70mm; margin-left: auto;">
                <div style="display: flex; justify-content: space-between; font-size: 9pt; color: #4b5563; margin-bottom: 3mm;">
                    <span>Subtotal</span>
                    <span>${formatCurrency(invoice.subtotal)}</span>
                </div>
                ${invoice.discount_amount > 0 ? `
                    <div style="display: flex; justify-content: space-between; font-size: 9pt; color: #4b5563; margin-bottom: 3mm;">
                        <span>Desconto</span>
                        <span style="color: #ef4444;">-${formatCurrency(invoice.discount_amount)}</span>
                    </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 9pt; color: #4b5563; margin-bottom: 3mm;">
                    <span>Imposto (IVA)</span>
                    <span>${formatCurrency(invoice.tax_amount)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4mm; border-top: 2px solid #111827; margin-top: 2mm;">
                    <span style="font-size: 10pt; font-weight: 700; color: #111827; text-transform: uppercase;">Total Geral</span>
                    <span style="font-size: 14pt; font-weight: 700; color: #111827;">${formatCurrency(invoice.total_amount)}</span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: auto; padding-top: 8mm; border-top: 1px solid #f3f4f6;">
            <div style="font-size: 7pt; color: #9ca3af;">
                <p style="font-family: monospace; margin: 0;">
                    ${invoice.is_fiscal ? `
                        <span style="font-weight: 700; color: #4b5563; padding: 1mm 2mm; border: 1px solid #d1d5db; border-radius: 1mm; margin-right: 1mm;">
                            ${invoice.hash ? invoice.hash.substring(0, 4) : '....'}
                        </span>
                        - Processado por programa validado nº 31.1/AGT20
                    ` : '<span style="font-weight: 700;">ESTE DOCUMENTO NÃO SERVE DE FACTURA</span>'}
                </p>
                <p style="margin: 2mm 0 0 0;">KAMBA Many - Software Certificado</p>
                ${invoice.hash ? `
                    <p style="font-size: 5pt; color: #d1d5db; word-break: break-all; max-width: 100mm; font-family: monospace; line-height: 1.3; margin: 1mm 0 0 0;">
                        Full Hash: ${invoice.hash}
                    </p>
                ` : ''}
            </div>
        </div>
    `;
}
