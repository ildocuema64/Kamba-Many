
import { Invoice } from '@/types';

/**
 * Interface for Signing Keys
 */
export interface SigningKeys {
    privateKey: string;
    publicKey: string;
    keyVersion: string;
}

/**
 * Signer Class for Angola AGT Compliance (Decreto Presidencial 312/18)
 * Uses RSA-SHA1 to sign invoice data via Web Crypto API.
 */
export class InvoiceSigner {

    private static pemToArrayBuffer(pem: string): ArrayBuffer {
        const b64Lines = pem.replace(/(-----(BEGIN|END) [A-Z ]+-----|\r|\n)/g, '');
        const b64Prefix = b64Lines.replace(/ /g, ''); // clean up any extra spaces
        const binaryString = window.atob(b64Prefix);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    private static async importPrivateKey(pem: string): Promise<CryptoKey> {
        const binaryDer = this.pemToArrayBuffer(pem);
        return await window.crypto.subtle.importKey(
            'pkcs8',
            binaryDer,
            {
                name: 'RSASSA-PKCS1-v1_5',
                hash: { name: 'SHA-1' },
            },
            false,
            ['sign']
        );
    }

    private static async importPublicKey(pem: string): Promise<CryptoKey> {
        const binaryDer = this.pemToArrayBuffer(pem);
        return await window.crypto.subtle.importKey(
            'spki',
            binaryDer,
            {
                name: 'RSASSA-PKCS1-v1_5',
                hash: { name: 'SHA-1' },
            },
            false,
            ['verify']
        );
    }

    /**
     * Generates the RSA-SHA1 hash for a given invoice.
     * Format: Date;SystemEntryDate;InvoiceNo;GrossTotal;PreviousHash
     * 
     * @param invoice The invoice data to sign
     * @param previousHash The hash of the previous invoice (or empty string if first)
     * @param privateKey The RSA private key in PEM format (PKCS#8)
     * @returns The base64 encoded signature
     */
    static async generateHash(invoice: Invoice, previousHash: string = '', privateKey: string): Promise<string> {
        try {
            // 1. Format Data: Date;SystemEntryDate;InvoiceNo;GrossTotal;PreviousHash
            // Dates must be YYYY-MM-DD
            // SystemEntryDate must be YYYY-MM-DDTHH:mm:ss

            const invoiceDate = new Date(invoice.issue_date).toISOString().split('T')[0];
            const systemEntryDate = new Date(invoice.system_entry_date).toISOString().replace(/\.\d+Z$/, ''); // Remove ms
            const grossTotal = invoice.total_amount.toFixed(2);

            const dataToSign = `${invoiceDate};${systemEntryDate};${invoice.invoice_number};${grossTotal};${previousHash}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(dataToSign);

            // 2. Sign with RSA-SHA1
            const key = await this.importPrivateKey(privateKey);
            const signature = await window.crypto.subtle.sign(
                'RSASSA-PKCS1-v1_5',
                key,
                data
            );

            // Convert ArrayBuffer to Base64
            let binary = '';
            const bytes = new Uint8Array(signature);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);

        } catch (error) {
            console.error('Error generating hash:', error);
            throw new Error(`Failed to generate invoice hash: ${(error as Error).message}`);
        }
    }

    /**
     * Verified a hash signature
     */
    static async verifyHash(invoice: Invoice, previousHash: string = '', signature: string, publicKey: string): Promise<boolean> {
        try {
            const invoiceDate = new Date(invoice.issue_date).toISOString().split('T')[0];
            const systemEntryDate = new Date(invoice.system_entry_date).toISOString().replace(/\.\d+Z$/, '');
            const grossTotal = invoice.total_amount.toFixed(2);

            const dataVerifiable = `${invoiceDate};${systemEntryDate};${invoice.invoice_number};${grossTotal};${previousHash}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(dataVerifiable);

            const key = await this.importPublicKey(publicKey);

            // Signature is expected to be base64 string
            const binaryString = window.atob(signature);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            return await window.crypto.subtle.verify(
                'RSASSA-PKCS1-v1_5',
                key,
                bytes,
                data
            );
        } catch (error) {
            console.error('Error verifying hash:', error);
            return false;
        }
    }
}
