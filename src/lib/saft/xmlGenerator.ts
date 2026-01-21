
import { Invoice, InvoiceWithItems, Organization, Customer, Product, InvoiceItem, DocumentType } from '@/types';
import { CustomerRepository } from '@/lib/db/repositories/CustomerRepository';
import { InvoiceRepository } from '@/lib/db/repositories/InvoiceRepository';
import { ProductRepository } from '@/lib/db/repositories/ProductRepository';

interface SaftHeader {
    auditFileVersion: string;
    companyID: string;
    taxRegistrationNumber: string;
    taxAccountingBasis: string;
    companyName: string;
    businessName: string;
    companyAddress: {
        addressDetail: string;
        city: string;
        country: string;
    };
    fiscalYear: string;
    startDate: string;
    endDate: string;
    currencyCode: string;
    dateCreated: string;
    taxEntity: string;
    productCompanyTaxID: string;
    softwareValidationNumber: string;
    productID: string;
    productVersion: string;
}

export class SaftGenerator {

    private escapeXml(unsafe: string): string {
        if (!unsafe) return '';
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }

    private formatDate(date: string): string {
        return new Date(date).toISOString().split('T')[0];
    }

    private formatDateTime(date: string): string {
        return new Date(date).toISOString().replace(/\.\d+Z$/, '');
    }

    private mapPaymentMechanism(method: string | undefined): string {
        const types: Record<string, string> = {
            'DINHEIRO': 'NU',
            'TPA': 'CC',
            'TRANSFERENCIA': 'TB',
            'MULTICAIXA': 'CC',
            'OUTRO': 'OU'
        };
        return types[method || ''] || 'NU';
    }

    private mapInvoiceType(type: DocumentType): string {
        const types: Record<DocumentType, string> = {
            'FACTURA': 'FT',
            'FACTURA_RECIBO': 'FR',
            'FACTURA_SIMPLIFICADA': 'FS',
            'FACTURA_PROFORMA': 'PF',
            'NOTA_CREDITO': 'NC',
            'NOTA_DEBITO': 'ND'
        };
        return types[type] || 'FT';
    }

    async generate(organizationId: string, startDate: string, endDate: string, organization: Organization): Promise<string> {

        // Fetch Data
        const invoices = await InvoiceRepository.findAll(organizationId, { startDate, endDate });
        const customers = await CustomerRepository.findAll(organizationId);
        const products = await ProductRepository.findAll(organizationId);

        // Filter invoices to only include relevant types (fiscal or working documents if requested)
        // Usually SAF-T includes everything, but let's stick to standard behavior

        const header: SaftHeader = {
            auditFileVersion: '1.01_01',
            companyID: organization.nif,
            taxRegistrationNumber: organization.nif,
            taxAccountingBasis: 'F', // Faturação
            companyName: organization.name,
            businessName: organization.name,
            companyAddress: {
                addressDetail: organization.address || 'Luanda',
                city: 'Luanda',
                country: 'AO'
            },
            fiscalYear: new Date(startDate).getFullYear().toString(),
            startDate: this.formatDate(startDate),
            endDate: this.formatDate(endDate),
            currencyCode: 'AOA',
            dateCreated: this.formatDate(new Date().toISOString()),
            taxEntity: 'Global',
            productCompanyTaxID: '5417082695', // Example Producer NIF
            softwareValidationNumber: '31.1/AGT20', // Supplied by user
            productID: 'KAMBA Many',
            productVersion: '1.0.0'
        };

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<AuditFile xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01" xsi:schemaLocation="urn:OECD:StandardAuditFile-Tax:AO_1.01_01 SAF-T_AO_1.01_01.xsd">\n';

        // 1. Header
        xml += this.generateHeader(header);

        // 2. MasterFiles
        xml += '  <MasterFiles>\n';
        xml += this.generateCustomerMasterFiles(customers);
        xml += this.generateProductMasterFiles(products);
        xml += '  </MasterFiles>\n';

        // 3. SourceDocuments
        xml += '  <SourceDocuments>\n';
        xml += await this.generateSalesInvoices(invoices);
        xml += '  </SourceDocuments>\n';

        xml += '</AuditFile>';

        return xml;
    }

    private generateHeader(h: SaftHeader): string {
        return `  <Header>
    <AuditFileVersion>${h.auditFileVersion}</AuditFileVersion>
    <CompanyID>${this.escapeXml(h.companyID)}</CompanyID>
    <TaxRegistrationNumber>${this.escapeXml(h.taxRegistrationNumber)}</TaxRegistrationNumber>
    <TaxAccountingBasis>${h.taxAccountingBasis}</TaxAccountingBasis>
    <CompanyName>${this.escapeXml(h.companyName)}</CompanyName>
    <BusinessName>${this.escapeXml(h.businessName)}</BusinessName>
    <CompanyAddress>
      <AddressDetail>${this.escapeXml(h.companyAddress.addressDetail)}</AddressDetail>
      <City>${this.escapeXml(h.companyAddress.city)}</City>
      <Country>AO</Country>
    </CompanyAddress>
    <FiscalYear>${h.fiscalYear}</FiscalYear>
    <StartDate>${h.startDate}</StartDate>
    <EndDate>${h.endDate}</EndDate>
    <CurrencyCode>${h.currencyCode}</CurrencyCode>
    <DateCreated>${h.dateCreated}</DateCreated>
    <TaxEntity>${h.taxEntity}</TaxEntity>
    <ProductCompanyTaxID>${h.productCompanyTaxID}</ProductCompanyTaxID>
    <SoftwareValidationNumber>${h.softwareValidationNumber}</SoftwareValidationNumber>
    <ProductID>${this.escapeXml(h.productID)}</ProductID>
    <ProductVersion>${this.escapeXml(h.productVersion)}</ProductVersion>
  </Header>\n`;
    }

    private generateCustomerMasterFiles(customers: Customer[]): string {
        let xml = '    <Customer>\n';
        for (const c of customers) {
            xml += `      <CustomerID>${this.escapeXml(c.id)}</CustomerID>\n`;
            xml += `      <AccountID>Unknown</AccountID>\n`; // Required field, map to generic if unknown
            xml += `      <CustomerTaxID>${c.nif || '999999999'}</CustomerTaxID>\n`; // 999999999 for Consumidor Final
            xml += `      <CompanyName>${this.escapeXml(c.name)}</CompanyName>\n`;
            xml += `      <BillingAddress>\n`;
            xml += `        <AddressDetail>${this.escapeXml(c.address || 'Luanda')}</AddressDetail>\n`;
            xml += `        <City>Luanda</City>\n`;
            xml += `        <Country>AO</Country>\n`;
            xml += `      </BillingAddress>\n`;
            xml += `      <SelfBillingIndicator>0</SelfBillingIndicator>\n`;
            xml += '    </Customer>\n';
        }
        // Always include 'Consumidor Final' generic customer if not present
        return xml;
    }

    private generateProductMasterFiles(products: Product[]): string {
        let xml = '    <Product>\n';
        for (const p of products) {
            xml += `      <ProductType>${p.unit_type === 'SERVICO' ? 'S' : 'P'}</ProductType>\n`;
            xml += `      <ProductCode>${this.escapeXml(p.code)}</ProductCode>\n`;
            xml += `      <ProductGroup>${this.escapeXml(p.category_id || 'N/A')}</ProductGroup>\n`; // Map to Category Name ideally
            xml += `      <Description>${this.escapeXml(p.name)}</Description>\n`;
            xml += `      <ProductNumberCode>${this.escapeXml(p.code)}</ProductNumberCode>\n`;
            xml += `    </Product>\n`;
        }
        return xml;
    }

    private async generateSalesInvoices(invoices: Invoice[]): Promise<string> {
        let xml = '    <SalesInvoices>\n';

        let totalDebit = 0;
        let totalCredit = 0;

        // Use a loop to fetch items for each invoice (performance warning: N+1 query, but safe for small batches. Optimize later)
        for (const invoice of invoices) {
            if (!invoice.is_fiscal && invoice.document_type !== 'FACTURA_PROFORMA') continue; // Skip non-relevant docs? Actually SAF-T might want everything. 
            // AGT usually requires FT, FR, FS, NC, ND. PF is usually excluded or optional.

            const items = await InvoiceRepository.findItems(invoice.id);

            // Calculate totals for footer
            if (invoice.document_type === 'NOTA_CREDITO') {
                totalCredit += invoice.total_amount;
            } else {
                totalDebit += invoice.total_amount;
            }

            xml += `      <Invoice>\n`;
            xml += `        <InvoiceNo>${this.escapeXml(invoice.invoice_number)}</InvoiceNo>\n`;

            // DocumentStatus
            xml += `        <DocumentStatus>\n`;
            xml += `          <InvoiceStatus>${invoice.status === 'ANULADA' ? 'A' : 'N'}</InvoiceStatus>\n`; // N = Normal, A = Anulado, S = Self Billing
            xml += `          <InvoiceStatusDate>${this.formatDateTime(invoice.cancelled_at || invoice.issue_date)}</InvoiceStatusDate>\n`;
            xml += `          <SourceID>${invoice.user_id}</SourceID>\n`;
            xml += `          <SourceBilling>${invoice.document_type === 'AUTO_FACTURA' ? 'P' : 'P'}</SourceBilling>\n`; // P = Produced by app
            xml += `        </DocumentStatus>\n`;

            xml += `        <Hash>${invoice.hash || '0'}</Hash>\n`;
            xml += `        <HashControl>${invoice.hash_control || '1'}</HashControl>\n`;

            xml += `        <Period>${new Date(invoice.issue_date).getMonth() + 1}</Period>\n`;
            xml += `        <InvoiceDate>${this.formatDate(invoice.issue_date)}</InvoiceDate>\n`;
            xml += `        <InvoiceType>${this.mapInvoiceType(invoice.document_type)}</InvoiceType>\n`;

            xml += `        <SpecialRegimes>\n`;
            xml += `          <SelfBillingIndicator>0</SelfBillingIndicator>\n`;
            xml += `          <CashVATSchemeIndicator>0</CashVATSchemeIndicator>\n`;
            xml += `          <ThirdPartiesBillingIndicator>0</ThirdPartiesBillingIndicator>\n`;
            xml += `        </SpecialRegimes>\n`;

            xml += `        <SourceID>${invoice.user_id}</SourceID>\n`;
            xml += `        <SystemEntryDate>${this.formatDateTime(invoice.system_entry_date)}</SystemEntryDate>\n`;
            xml += `        <CustomerID>${invoice.customer_nif ? invoice.customer_nif : 'Consumidor Final'}</CustomerID>\n`; // Use ID or NIF linkage

            // Line Items
            for (const item of items) {
                xml += `        <Line>\n`;
                xml += `          <LineNumber>${items.indexOf(item) + 1}</LineNumber>\n`;
                xml += `          <ProductCode>${this.escapeXml(item.product_code)}</ProductCode>\n`;
                xml += `          <ProductDescription>${this.escapeXml(item.product_name)}</ProductDescription>\n`;
                xml += `          <Quantity>${item.quantity}</Quantity>\n`;
                xml += `          <UnitOfMeasure>Unid</UnitOfMeasure>\n`;
                xml += `          <UnitPrice>${item.unit_price.toFixed(4)}</UnitPrice>\n`; // 4 decimals required
                xml += `          <TaxPointDate>${this.formatDate(invoice.issue_date)}</TaxPointDate>\n`;
                xml += `          <Description>${this.escapeXml(item.description || item.product_name)}</Description>\n`;
                xml += `          <CreditAmount>${item.line_total.toFixed(2)}</CreditAmount>\n`; // Or DebitAmount depending on doc type

                // Tax
                xml += `          <Tax>\n`;
                xml += `            <TaxType>IVA</TaxType>\n`;
                xml += `            <TaxCountryRegion>AO</TaxCountryRegion>\n`;
                xml += `            <TaxCode>${item.tax_rate > 0 ? 'NOR' : 'ISE'}</TaxCode>\n`; // NOR = Normal, ISE = Isento
                xml += `            <TaxPercentage>${item.tax_rate}</TaxPercentage>\n`;
                xml += `          </Tax>\n`;

                if (item.tax_exemption_code) {
                    xml += `          <TaxExemptionReason>${this.escapeXml(item.tax_exemption_reason || '')}</TaxExemptionReason>\n`;
                    xml += `          <TaxExemptionCode>${this.escapeXml(item.tax_exemption_code)}</TaxExemptionCode>\n`;
                }

                xml += `          <SettlementAmount>${item.discount_amount}</SettlementAmount>\n`;
                xml += `        </Line>\n`;
            }

            // Document Totals
            xml += `        <DocumentTotals>\n`;
            xml += `          <TaxPayable>${invoice.tax_amount.toFixed(2)}</TaxPayable>\n`;
            xml += `          <NetTotal>${(invoice.total_amount - invoice.tax_amount).toFixed(2)}</NetTotal>\n`;
            xml += `          <GrossTotal>${invoice.total_amount.toFixed(2)}</GrossTotal>\n`;
            // xml += `          <Currency>\n`;
            // xml += `            <CurrencyCode>AOA</CurrencyCode>\n`;
            // xml += `            <CurrencyAmount>${invoice.total_amount.toFixed(2)}</CurrencyAmount>\n`;
            // xml += `          </Currency>\n`;
            xml += `        </DocumentTotals>\n`;

            xml += `      </Invoice>\n`;
        }

        xml += `      <NumberOfEntries>${invoices.length}</NumberOfEntries>\n`;
        xml += `      <TotalDebit>${totalDebit.toFixed(2)}</TotalDebit>\n`;
        xml += `      <TotalCredit>${totalCredit.toFixed(2)}</TotalCredit>\n`;

        xml += '    </SalesInvoices>\n';
        return xml;
    }
}
