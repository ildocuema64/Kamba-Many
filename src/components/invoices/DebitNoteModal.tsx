'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { InvoiceRepository } from '@/lib/db/repositories/InvoiceRepository';
import { InvoiceWithItems } from '@/types';
import {
    FilePlus,
    Loader2,
    AlertTriangle,
    Plus,
    Trash2
} from 'lucide-react';

interface DebitNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (invoiceId: string) => void;
    sourceInvoice: InvoiceWithItems;
}

interface DebitItem {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
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

const DebitNoteModal: React.FC<DebitNoteModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    sourceInvoice
}) => {
    const { user } = useAuthStore();

    // Debit items (additional charges)
    const [debitItems, setDebitItems] = useState<DebitItem[]>([]);
    const [reason, setReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Add new debit item
    const addItem = () => {
        setDebitItems([
            ...debitItems,
            {
                id: crypto.randomUUID(),
                description: '',
                quantity: 1,
                unit_price: 0,
                tax_rate: 14 // Default IVA Angola
            }
        ]);
    };

    // Remove debit item
    const removeItem = (id: string) => {
        setDebitItems(items => items.filter(item => item.id !== id));
    };

    // Update debit item
    const updateItem = (id: string, field: keyof DebitItem, value: string | number) => {
        setDebitItems(items => items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // Calculate totals
    const getDebitSubtotal = () => debitItems.reduce((sum, item) => {
        return sum + (item.unit_price * item.quantity);
    }, 0);

    const getDebitTax = () => debitItems.reduce((sum, item) => {
        const lineValue = item.unit_price * item.quantity;
        return sum + (lineValue * (item.tax_rate / 100));
    }, 0);

    const getDebitTotal = () => getDebitSubtotal() + getDebitTax();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.organization_id || !user?.id) {
            setError('Utilizador não autenticado');
            return;
        }

        if (debitItems.length === 0) {
            setError('Adicione pelo menos um item a debitar');
            return;
        }

        const invalidItems = debitItems.filter(item => !item.description.trim() || item.unit_price <= 0);
        if (invalidItems.length > 0) {
            setError('Preencha a descrição e valor de todos os itens');
            return;
        }

        if (!reason.trim()) {
            setError('Indique o motivo da Nota de Débito');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const now = new Date().toISOString();

            // Create the debit note
            const debitNote = await InvoiceRepository.create({
                organization_id: sourceInvoice.organization_id,
                source_id: sourceInvoice.id, // Reference to original invoice
                document_type: 'NOTA_DEBITO',
                customer_name: sourceInvoice.customer_name,
                customer_nif: sourceInvoice.customer_nif,
                customer_phone: sourceInvoice.customer_phone,
                customer_email: sourceInvoice.customer_email,
                customer_address: sourceInvoice.customer_address,
                subtotal: getDebitSubtotal(),
                tax_amount: getDebitTax(),
                discount_amount: 0,
                total_amount: getDebitTotal(),
                tax_date: now,
                issue_date: now,
                status: 'EMITIDA',
                payment_status: 'PENDING',
                user_id: user.id,
                notes: `ND ref. ${sourceInvoice.invoice_number}: ${reason}`,
                is_fiscal: true,
                system_entry_date: now
            }, debitItems.map((item, index) => ({
                product_code: `AJUSTE-${index + 1}`,
                product_name: item.description,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                discount_amount: 0
            })));

            onSuccess(debitNote.id);
        } catch (err) {
            console.error('Debit note creation error:', err);
            setError('Erro ao criar Nota de Débito: ' + (err as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nova Nota de Débito" size="xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header info */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                    <FilePlus className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">Nota de Débito para: {sourceInvoice.invoice_number}</p>
                        <p className="text-blue-600 mt-1">
                            A Nota de Débito adiciona valores a uma factura emitida.
                            Use para corrigir valores em falta ou taxas adicionais.
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

                {/* Debit Items */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">Itens a Debitar</h4>
                        <button
                            type="button"
                            onClick={addItem}
                            className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar Item
                        </button>
                    </div>

                    {debitItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                            <p>Nenhum item adicionado</p>
                            <button
                                type="button"
                                onClick={addItem}
                                className="mt-2 text-[var(--primary)] font-medium hover:underline"
                            >
                                + Adicionar primeiro item
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {debitItems.map((item, index) => (
                                <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-sm font-medium text-gray-600">Item {index + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs text-gray-500 mb-1">Descrição</label>
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                placeholder="Ex: Taxa de entrega"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Qtd</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Valor Unit.</label>
                                            <input
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-right text-sm">
                                        <span className="text-gray-500">Total: </span>
                                        <span className="font-medium">
                                            {formatCurrency(item.unit_price * item.quantity * (1 + item.tax_rate / 100))}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reason */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Motivo da Nota de Débito <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ex: Correcção de valor, taxa adicional..."
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none resize-none"
                        required
                    />
                </div>

                {/* Debit Total */}
                {debitItems.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm text-blue-700">
                            <span>Subtotal a Debitar</span>
                            <span>{formatCurrency(getDebitSubtotal())}</span>
                        </div>
                        <div className="flex justify-between text-sm text-blue-700">
                            <span>IVA (14%)</span>
                            <span>{formatCurrency(getDebitTax())}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-blue-300">
                            <span className="text-lg font-bold text-blue-800">Total da ND</span>
                            <span className="text-xl font-bold text-blue-600">
                                {formatCurrency(getDebitTotal())}
                            </span>
                        </div>
                    </div>
                )}

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
                        className="flex-1 !bg-blue-600 hover:!bg-blue-700"
                        isLoading={isProcessing}
                        disabled={debitItems.length === 0}
                    >
                        {isProcessing ? 'A criar...' : 'Emitir Nota de Débito'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default DebitNoteModal;
