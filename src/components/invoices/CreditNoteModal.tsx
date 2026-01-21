'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { InvoiceRepository } from '@/lib/db/repositories/InvoiceRepository';
import { InvoiceWithItems, InvoiceItem } from '@/types';
import {
    FileMinus,
    Loader2,
    AlertTriangle,
    Check
} from 'lucide-react';

interface CreditNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (invoiceId: string) => void;
    sourceInvoice: InvoiceWithItems;
}

interface CreditNoteItem {
    item: InvoiceItem;
    selected: boolean;
    quantity: number;
}

/**
 * Formats a number as Angolan Kwanza currency
 */
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: 'AOA',
        minimumFractionDigits: 2
    }).format(value);
}

const CreditNoteModal: React.FC<CreditNoteModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    sourceInvoice
}) => {
    const { user } = useAuthStore();

    // Initialize items with selection state
    const [creditItems, setCreditItems] = useState<CreditNoteItem[]>(
        sourceInvoice.items.map(item => ({
            item,
            selected: false,
            quantity: item.quantity
        }))
    );
    const [reason, setReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Toggle item selection
    const toggleItem = (index: number) => {
        setCreditItems(items => items.map((ci, i) =>
            i === index ? { ...ci, selected: !ci.selected } : ci
        ));
    };

    // Update quantity
    const updateQuantity = (index: number, qty: number) => {
        setCreditItems(items => items.map((ci, i) =>
            i === index ? { ...ci, quantity: Math.max(1, Math.min(qty, ci.item.quantity)) } : ci
        ));
    };

    // Calculate totals for selected items
    const getSelectedItems = () => creditItems.filter(ci => ci.selected);

    const getCreditSubtotal = () => getSelectedItems().reduce((sum, ci) => {
        const lineValue = ci.item.unit_price * ci.quantity;
        return sum + lineValue;
    }, 0);

    const getCreditTax = () => getSelectedItems().reduce((sum, ci) => {
        const lineValue = ci.item.unit_price * ci.quantity;
        return sum + (lineValue * (ci.item.tax_rate / 100));
    }, 0);

    const getCreditTotal = () => getCreditSubtotal() + getCreditTax();

    // Select/deselect all
    const selectAll = () => {
        const allSelected = creditItems.every(ci => ci.selected);
        setCreditItems(items => items.map(ci => ({ ...ci, selected: !allSelected })));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.organization_id || !user?.id) {
            setError('Utilizador não autenticado');
            return;
        }

        const selectedItems = getSelectedItems();
        if (selectedItems.length === 0) {
            setError('Selecione pelo menos um item para creditar');
            return;
        }

        if (!reason.trim()) {
            setError('Indique o motivo da Nota de Crédito');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const now = new Date().toISOString();

            // Create the credit note
            const creditNote = await InvoiceRepository.create({
                organization_id: sourceInvoice.organization_id,
                source_id: sourceInvoice.id, // Reference to original invoice
                document_type: 'NOTA_CREDITO',
                customer_name: sourceInvoice.customer_name,
                customer_nif: sourceInvoice.customer_nif,
                customer_phone: sourceInvoice.customer_phone,
                customer_email: sourceInvoice.customer_email,
                customer_address: sourceInvoice.customer_address,
                subtotal: getCreditSubtotal(),
                tax_amount: getCreditTax(),
                discount_amount: 0,
                total_amount: getCreditTotal(),
                tax_date: now,
                issue_date: now,
                status: 'EMITIDA',
                payment_status: 'PAID', // Credit notes are considered "paid"
                user_id: user.id,
                notes: `NC ref. ${sourceInvoice.invoice_number}: ${reason}`,
                is_fiscal: true,
                system_entry_date: now
            }, selectedItems.map(ci => ({
                product_id: ci.item.product_id,
                product_code: ci.item.product_code,
                product_name: ci.item.product_name,
                description: ci.item.description,
                quantity: ci.quantity,
                unit_price: ci.item.unit_price,
                tax_rate: ci.item.tax_rate,
                discount_amount: 0,
                tax_exemption_code: ci.item.tax_exemption_code,
                tax_exemption_reason: ci.item.tax_exemption_reason
            })));

            onSuccess(creditNote.id);
        } catch (err) {
            console.error('Credit note creation error:', err);
            setError('Erro ao criar Nota de Crédito: ' + (err as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nova Nota de Crédito" size="xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header info */}
                <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
                    <FileMinus className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">Nota de Crédito para: {sourceInvoice.invoice_number}</p>
                        <p className="text-orange-600 mt-1">
                            A Nota de Crédito anula total ou parcialmente uma factura emitida.
                            Selecione os itens a creditar.
                        </p>
                    </div>
                </div>

                {/* Original invoice info */}
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-gray-500">Cliente:</span>
                            <span className="ml-2 font-medium">{sourceInvoice.customer_name}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Valor Original:</span>
                            <span className="ml-2 font-medium">{formatCurrency(sourceInvoice.total_amount)}</span>
                        </div>
                    </div>
                </div>

                {/* Items selection */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">Itens a Creditar</h4>
                        <button
                            type="button"
                            onClick={selectAll}
                            className="text-sm text-[var(--primary)] hover:underline"
                        >
                            {creditItems.every(ci => ci.selected) ? 'Desmarcar todos' : 'Selecionar todos'}
                        </button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="w-10 px-3 py-2"></th>
                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Produto</th>
                                    <th className="text-center px-4 py-2 font-medium text-gray-600">Qtd Original</th>
                                    <th className="text-center px-4 py-2 font-medium text-gray-600">Qtd a Creditar</th>
                                    <th className="text-right px-4 py-2 font-medium text-gray-600">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {creditItems.map((ci, index) => (
                                    <tr
                                        key={ci.item.id}
                                        className={`border-t ${ci.selected ? 'bg-orange-50' : ''}`}
                                    >
                                        <td className="px-3 py-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleItem(index)}
                                                className={`w-5 h-5 rounded flex items-center justify-center border ${ci.selected
                                                        ? 'bg-orange-500 border-orange-500 text-white'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                    }`}
                                            >
                                                {ci.selected && <Check className="w-3 h-3" />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="font-medium text-gray-900">{ci.item.product_name}</div>
                                            <div className="text-xs text-gray-500">{ci.item.product_code}</div>
                                        </td>
                                        <td className="px-4 py-2 text-center text-gray-600">
                                            {ci.item.quantity}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {ci.selected ? (
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={ci.item.quantity}
                                                    value={ci.quantity}
                                                    onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                                                    className="w-16 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-orange-300 focus:outline-none"
                                                />
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-right font-medium">
                                            {ci.selected
                                                ? formatCurrency(ci.item.unit_price * ci.quantity * (1 + ci.item.tax_rate / 100))
                                                : <span className="text-gray-400">-</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Reason */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Motivo da Nota de Crédito <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ex: Devolução de produto, erro de facturação..."
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none resize-none"
                        required
                    />
                </div>

                {/* Credit Total */}
                {getSelectedItems().length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm text-orange-700">
                            <span>Subtotal a Creditar</span>
                            <span>{formatCurrency(getCreditSubtotal())}</span>
                        </div>
                        <div className="flex justify-between text-sm text-orange-700">
                            <span>IVA</span>
                            <span>{formatCurrency(getCreditTax())}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-orange-300">
                            <span className="text-lg font-bold text-orange-800">Total da NC</span>
                            <span className="text-xl font-bold text-orange-600">
                                {formatCurrency(getCreditTotal())}
                            </span>
                        </div>
                    </div>
                )}

                {/* Warning */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>A emissão de uma Nota de Crédito irá repor o stock dos produtos selecionados.</span>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isProcessing}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1 !bg-orange-600 hover:!bg-orange-700"
                        isLoading={isProcessing}
                        disabled={getSelectedItems().length === 0}
                    >
                        {isProcessing ? 'A criar...' : 'Emitir Nota de Crédito'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreditNoteModal;
