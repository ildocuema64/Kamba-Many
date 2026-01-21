/**
 * Invoice XML Generator - Sistema KAMBA Many
 * Gera ficheiro XML individual para cada factura em conformidade
 * com o formato SAF-T Angola (Decreto Presidencial n.º 312/18)
 */

import { InvoiceWithItems, DocumentType, Organization } from '@/types';

/**
 * Mapeia tipo de documento para código SAF-T
 */
const getDocTypeCode = (type: DocumentType): string => {
    const codes: Record<DocumentType, string> = {
        'FACTURA': 'FT',
        'FACTURA_RECIBO': 'FR',
        'FACTURA_SIMPLIFICADA': 'FS',
        'FACTURA_PROFORMA': 'PF',
        'NOTA_CREDITO': 'NC',
        'NOTA_DEBITO': 'ND'
    };
    return codes[type] || 'FT';
};

/**
 * Escapa caracteres especiais para XML
 */
const escapeXml = (unsafe: string | null | undefined): string => {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

/**
 * Formata data para ISO 8601
 */
const formatDate = (date: string): string => {
    return new Date(date).toISOString().split('T')[0];
};

/**
 * Formata data e hora para ISO 8601
 */
const formatDateTime = (date: string): string => {
    const d = new Date(date);
    return d.toISOString().replace('Z', '');
};

/**
 * Formata valor numérico com 2 casas decimais
 */
const formatAmount = (value: number): string => {
    return value.toFixed(2);
};

interface GenerateXMLOptions {
    invoice: InvoiceWithItems;
    organization: Organization | null;
}

/**
 * Gera XML da factura individual no formato SAF-T AO
 */
export function generateInvoiceXML({ invoice, organization }: GenerateXMLOptions): string {
    const docTypeCode = getDocTypeCode(invoice.document_type);
    const now = new Date().toISOString();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<Invoice xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01">\n';

    // Header
    xml += '  <Header>\n';
    xml += `    <AuditFileVersion>1.01_01</AuditFileVersion>\n`;
    xml += `    <CompanyID>${escapeXml(organization?.nif || '')}</CompanyID>\n`;
    xml += `    <TaxRegistrationNumber>${escapeXml(organization?.nif || '')}</TaxRegistrationNumber>\n`;
    xml += `    <TaxAccountingBasis>F</TaxAccountingBasis>\n`;
    xml += `    <CompanyName>${escapeXml(organization?.name || '')}</CompanyName>\n`;
    xml += `    <BusinessName>${escapeXml(organization?.name || '')}</BusinessName>\n`;
    xml += '    <CompanyAddress>\n';
    xml += `      <AddressDetail>${escapeXml(organization?.address || 'Luanda')}</AddressDetail>\n`;
    xml += `      <City>Luanda</City>\n`;
    xml += `      <Country>AO</Country>\n`;
    xml += '    </CompanyAddress>\n';
    xml += `    <FiscalYear>${new Date(invoice.issue_date).getFullYear()}</FiscalYear>\n`;
    xml += `    <StartDate>${formatDate(invoice.issue_date)}</StartDate>\n`;
    xml += `    <EndDate>${formatDate(invoice.issue_date)}</EndDate>\n`;
    xml += `    <CurrencyCode>AOA</CurrencyCode>\n`;
    xml += `    <DateCreated>${formatDate(now)}</DateCreated>\n`;
    xml += `    <TaxEntity>Global</TaxEntity>\n`;
    xml += `    <ProductCompanyTaxID>${escapeXml(organization?.nif || '')}</ProductCompanyTaxID>\n`;
    xml += `    <SoftwareCertificateNumber>31</SoftwareCertificateNumber>\n`;
    xml += `    <ProductID>KAMBA Many</ProductID>\n`;
    xml += `    <ProductVersion>1.0</ProductVersion>\n`;
    xml += '  </Header>\n';

    // Customer in MasterFiles
    xml += '  <MasterFiles>\n';
    xml += '    <Customer>\n';
    xml += `      <CustomerID>${escapeXml(invoice.customer_nif || 'CF')}</CustomerID>\n`;
    xml += `      <AccountID>Unknown</AccountID>\n`;
    xml += `      <CustomerTaxID>${escapeXml(invoice.customer_nif || '999999999')}</CustomerTaxID>\n`;
    xml += `      <CompanyName>${escapeXml(invoice.customer_name)}</CompanyName>\n`;
    xml += '      <BillingAddress>\n';
    xml += `        <AddressDetail>${escapeXml(invoice.customer_address || 'Luanda')}</AddressDetail>\n`;
    xml += `        <City>Luanda</City>\n`;
    xml += `        <Country>AO</Country>\n`;
    xml += '      </BillingAddress>\n';
    xml += `      <SelfBillingIndicator>0</SelfBillingIndicator>\n`;
    xml += '    </Customer>\n';

    // Products in MasterFiles
    invoice.items.forEach(item => {
        xml += '    <Product>\n';
        xml += `      <ProductType>P</ProductType>\n`;
        xml += `      <ProductCode>${escapeXml(item.product_code)}</ProductCode>\n`;
        xml += `      <ProductGroup>N/A</ProductGroup>\n`;
        xml += `      <ProductDescription>${escapeXml(item.product_name)}</ProductDescription>\n`;
        xml += `      <ProductNumberCode>${escapeXml(item.product_code)}</ProductNumberCode>\n`;
        xml += '    </Product>\n';
    });

    xml += '  </MasterFiles>\n';

    // Source Documents - Invoice
    xml += '  <SourceDocuments>\n';
    xml += '    <SalesInvoices>\n';
    xml += `      <NumberOfEntries>1</NumberOfEntries>\n`;
    xml += `      <TotalDebit>0.00</TotalDebit>\n`;
    xml += `      <TotalCredit>${formatAmount(invoice.total_amount)}</TotalCredit>\n`;

    xml += '      <Invoice>\n';
    xml += `        <InvoiceNo>${escapeXml(invoice.invoice_number)}</InvoiceNo>\n`;
    xml += `        <ATCUD>${invoice.atcud || '0'}</ATCUD>\n`;
    xml += '        <DocumentStatus>\n';
    xml += `          <InvoiceStatus>${invoice.status === 'ANULADA' ? 'A' : 'N'}</InvoiceStatus>\n`;
    xml += `          <InvoiceStatusDate>${formatDateTime(invoice.cancelled_at || invoice.issue_date)}</InvoiceStatusDate>\n`;
    xml += `          <SourceID>${escapeXml(invoice.user_id)}</SourceID>\n`;
    xml += `          <SourceBilling>P</SourceBilling>\n`;
    xml += '        </DocumentStatus>\n';
    xml += `        <Hash>${escapeXml(invoice.hash || '')}</Hash>\n`;
    xml += `        <HashControl>1</HashControl>\n`;
    xml += `        <Period>${new Date(invoice.issue_date).getMonth() + 1}</Period>\n`;
    xml += `        <InvoiceDate>${formatDate(invoice.issue_date)}</InvoiceDate>\n`;
    xml += `        <InvoiceType>${docTypeCode}</InvoiceType>\n`;
    xml += '        <SpecialRegimes>\n';
    xml += `          <SelfBillingIndicator>0</SelfBillingIndicator>\n`;
    xml += `          <CashVATSchemeIndicator>0</CashVATSchemeIndicator>\n`;
    xml += `          <ThirdPartiesBillingIndicator>0</ThirdPartiesBillingIndicator>\n`;
    xml += '        </SpecialRegimes>\n';
    xml += `        <SourceID>${escapeXml(invoice.user_id)}</SourceID>\n`;
    xml += `        <SystemEntryDate>${formatDateTime(invoice.system_entry_date || invoice.issue_date)}</SystemEntryDate>\n`;
    xml += `        <CustomerID>${escapeXml(invoice.customer_nif || 'CF')}</CustomerID>\n`;

    // Invoice Lines
    invoice.items.forEach((item, index) => {
        const lineNumber = index + 1;
        const taxAmount = (item.unit_price * item.quantity * item.tax_rate) / 100;
        const netTotal = item.unit_price * item.quantity - (item.discount_amount || 0);

        xml += '        <Line>\n';
        xml += `          <LineNumber>${lineNumber}</LineNumber>\n`;
        xml += `          <ProductCode>${escapeXml(item.product_code)}</ProductCode>\n`;
        xml += `          <ProductDescription>${escapeXml(item.product_name)}</ProductDescription>\n`;
        xml += `          <Quantity>${item.quantity}</Quantity>\n`;
        xml += `          <UnitOfMeasure>UN</UnitOfMeasure>\n`;
        xml += `          <UnitPrice>${formatAmount(item.unit_price)}</UnitPrice>\n`;
        xml += `          <TaxPointDate>${formatDate(invoice.issue_date)}</TaxPointDate>\n`;
        xml += `          <Description>${escapeXml(item.description || item.product_name)}</Description>\n`;

        if (item.discount_amount && item.discount_amount > 0) {
            xml += `          <SettlementAmount>${formatAmount(item.discount_amount)}</SettlementAmount>\n`;
        }

        xml += `          <CreditAmount>${formatAmount(netTotal)}</CreditAmount>\n`;
        xml += '          <Tax>\n';
        xml += `            <TaxType>IVA</TaxType>\n`;
        xml += `            <TaxCountryRegion>AO</TaxCountryRegion>\n`;
        xml += `            <TaxCode>${item.tax_rate > 0 ? 'NOR' : 'ISE'}</TaxCode>\n`;
        xml += `            <TaxPercentage>${formatAmount(item.tax_rate)}</TaxPercentage>\n`;
        xml += '          </Tax>\n';

        if (item.tax_exemption_code) {
            xml += `          <TaxExemptionReason>${escapeXml(item.tax_exemption_code)}</TaxExemptionReason>\n`;
            xml += `          <TaxExemptionCode>${escapeXml(item.tax_exemption_code)}</TaxExemptionCode>\n`;
        }

        xml += '        </Line>\n';
    });

    // Document Totals
    xml += '        <DocumentTotals>\n';
    xml += `          <TaxPayable>${formatAmount(invoice.tax_amount)}</TaxPayable>\n`;
    xml += `          <NetTotal>${formatAmount(invoice.subtotal - invoice.discount_amount)}</NetTotal>\n`;
    xml += `          <GrossTotal>${formatAmount(invoice.total_amount)}</GrossTotal>\n`;
    xml += '        </DocumentTotals>\n';

    xml += '      </Invoice>\n';
    xml += '    </SalesInvoices>\n';
    xml += '  </SourceDocuments>\n';
    xml += '</Invoice>\n';

    return xml;
}

/**
 * Gera e faz download do XML da factura
 */
export function downloadInvoiceXML(invoice: InvoiceWithItems, organization: Organization | null): void {
    const xml = generateInvoiceXML({ invoice, organization });

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getDocTypeCode(invoice.document_type)}_${invoice.invoice_number.replace(/\//g, '-')}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
