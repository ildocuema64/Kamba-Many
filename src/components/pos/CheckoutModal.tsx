'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCartStore, SaleDocumentType } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useCustomerStore } from '@/store/customerStore';
import { SaleRepository } from '@/lib/db/repositories/SaleRepository';
import { ProductRepository } from '@/lib/db/repositories/ProductRepository';
import { PaymentMethod } from '@/types';
import {
    Banknote,
    CreditCard,
    Building2,
    Smartphone,
    FileText,
    Receipt,
    FileCheck,
    Loader2,
    Search,
    UserPlus,
    Users,
    AlertCircle
} from 'lucide-react';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (saleNumber: string, invoiceId?: string) => void;
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

const paymentMethods: { method: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { method: 'DINHEIRO', label: 'Dinheiro', icon: <Banknote className="w-5 h-5" /> },
    { method: 'TPA', label: 'TPA', icon: <CreditCard className="w-5 h-5" /> },
    { method: 'TRANSFERENCIA', label: 'Transferência', icon: <Building2 className="w-5 h-5" /> },
    { method: 'MULTICAIXA', label: 'Multicaixa Express', icon: <Smartphone className="w-5 h-5" /> },
];

// Tipos de documento fiscal disponíveis no checkout
const documentTypes: { type: SaleDocumentType; label: string; description: string; icon: React.ReactNode }[] = [
    {
        type: 'FACTURA_RECIBO',
        label: 'Factura-Recibo (FR)',
        description: 'Venda com pagamento imediato',
        icon: <Receipt className="w-5 h-5" />
    },
    {
        type: 'FACTURA',
        label: 'Factura (FT)',
        description: 'Venda a crédito (requer NIF)',
        icon: <FileText className="w-5 h-5" />
    },
    {
        type: 'FACTURA_SIMPLIFICADA',
        label: 'Factura Simplificada (FS)',
        description: 'Valores até 25.000 Kz',
        icon: <FileCheck className="w-5 h-5" />
    },
];

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuthStore();
    const {
        items,
        customerName,
        customerNif,
        customerPhone,
        paymentMethod,
        documentType,
        setCustomer,
        setPaymentMethod,
        setDocumentType,
        getSubtotal,
        getTaxAmount,
        getDiscountAmount,
        getTotal,
        clearCart
    } = useCartStore();

    const { customers, fetchCustomers, searchCustomers } = useCustomerStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customerMode, setCustomerMode] = useState<'search' | 'manual'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<typeof customers>([]);

    React.useEffect(() => {
        if (user?.organization_id && isOpen) {
            // Load initial customers or popular ones
            fetchCustomers(user.organization_id);
        }
    }, [user?.organization_id, isOpen, fetchCustomers]);

    React.useEffect(() => {
        if (searchQuery.trim() && user?.organization_id) {
            const delayDebounceFn = setTimeout(async () => {
                const results = await searchCustomers(searchQuery, user.organization_id);
                setSearchResults(results);
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, user?.organization_id, searchCustomers]);

    const handleSelectCustomer = (customer: typeof customers[0]) => {
        setCustomer(customer.name, customer.nif, customer.phone);
        setSearchQuery('');
        setSearchResults([]);
        // Optional: switch to manual to show the filled data clearly? or keep in search mode with "Selected: X"
        // Let's just fill and let user see it.
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.organization_id || !user?.id) {
            setError('Utilizador não autenticado');
            return;
        }

        if (items.length === 0) {
            setError('O carrinho está vazio');
            return;
        }

        // Validação: Factura (FT) requer NIF do cliente
        if (documentType === 'FACTURA' && (!customerNif || customerNif.trim().length < 9)) {
            setError('Factura (FT) requer NIF válido do cliente (9 dígitos).');
            return;
        }

        // Validação: Factura Simplificada (FS) limitada a 25.000 Kz
        const total = getTotal();
        if (documentType === 'FACTURA_SIMPLIFICADA' && total > 25000) {
            setError(`Factura Simplificada limitada a 25.000 Kz. Total actual: ${formatCurrency(total)}. Use Factura ou Factura-Recibo.`);
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Create sale with selected document type
            const sale = await SaleRepository.create(
                {
                    organization_id: user.organization_id,
                    user_id: user.id,
                    customer_name: customerName || undefined,
                    customer_nif: customerNif || undefined,
                    customer_phone: customerPhone || undefined,
                    subtotal: getSubtotal(),
                    tax_amount: getTaxAmount(),
                    discount_amount: getDiscountAmount(),
                    total_amount: total,
                    payment_method: paymentMethod,
                    payment_status: 'PAID',
                    sale_date: new Date().toISOString(),
                },
                items.map(item => ({
                    product_id: item.product.id,
                    product_name: item.product.name,
                    product_code: item.product.code,
                    quantity: item.quantity,
                    unit_price: item.product.unit_price,
                    tax_rate: item.product.tax_rate,
                    discount_amount: item.discount,
                })),
                documentType // Passa o tipo de documento selecionado
            );

            // Update stock for each product
            for (const item of items) {
                const newStock = item.product.current_stock - item.quantity;
                await ProductRepository.updateStock(item.product.id, newStock);
            }

            // Clear cart and notify success
            clearCart();
            // Cast strictly to access invoice_id if TS complains, or rely on the return type I allowed earlier
            const createdSale = sale as any;
            onSuccess(sale.sale_number, createdSale.invoice_id);
        } catch (err) {
            console.error('Checkout error:', err);
            setError('Erro ao processar venda. Tente novamente.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Finalizar Venda" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Info */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-900">Dados do Cliente</h3>
                        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                            <button
                                type="button"
                                onClick={() => setCustomerMode('search')}
                                className={`px-3 py-1 text-sm rounded-md transition-all ${customerMode === 'search'
                                    ? 'bg-white shadow text-gray-900'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Users className="w-4 h-4 inline mr-1" />
                                Pesquisar
                            </button>
                            <button
                                type="button"
                                onClick={() => setCustomerMode('manual')}
                                className={`px-3 py-1 text-sm rounded-md transition-all ${customerMode === 'manual'
                                    ? 'bg-white shadow text-gray-900'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <UserPlus className="w-4 h-4 inline mr-1" />
                                Novo / Manual
                            </button>
                        </div>
                    </div>

                    {customerMode === 'search' && (
                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Pesquisar por nome ou NIF..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Search Results Dropdown */}
                            {searchQuery.trim() && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {searchResults.length > 0 ? (
                                        searchResults.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => handleSelectCustomer(c)}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0 border-gray-100"
                                            >
                                                <div className="font-medium text-gray-900">{c.name}</div>
                                                <div className="text-xs text-gray-500 flex gap-3">
                                                    {c.nif && <span>NIF: {c.nif}</span>}
                                                    {c.phone && <span>Tel: {c.phone}</span>}
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                            Nenhum cliente encontrado.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Always show manual fields, but maybe read-only if selected? Or allow edit. */}
                    {/* Allowing edit is good for "one-off" changes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Nome"
                            value={customerName}
                            onChange={(e) => setCustomer(e.target.value, customerNif, customerPhone)}
                            placeholder="Nome do cliente"
                            disabled={customerMode === 'search' && !customerName} // Disable if empty in search mode? No, allow manual override always
                        />
                        <Input
                            label="NIF"
                            value={customerNif}
                            onChange={(e) => setCustomer(customerName, e.target.value, customerPhone)}
                            placeholder="000000000"
                            maxLength={9}
                        />
                    </div>
                    <Input
                        label="Telefone"
                        value={customerPhone}
                        onChange={(e) => setCustomer(customerName, customerNif, e.target.value)}
                        placeholder="+244 900 000 000"
                    />
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Método de Pagamento</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {paymentMethods.map(({ method, label, icon }) => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method)}
                                className={`
                                    flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                                    ${paymentMethod === method
                                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }
                                `}
                            >
                                {icon}
                                <span className="text-sm font-medium">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Document Type Selection */}
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Tipo de Documento</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {documentTypes.map(({ type, label, description, icon }) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setDocumentType(type)}
                                className={`
                                    flex flex-col items-start gap-1 p-4 rounded-xl border-2 transition-all text-left
                                    ${documentType === type
                                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }
                                `}
                            >
                                <div className={`flex items-center gap-2 ${documentType === type ? 'text-[var(--primary)]' : 'text-gray-600'}`}>
                                    {icon}
                                    <span className="text-sm font-medium">{label}</span>
                                </div>
                                <span className="text-xs text-gray-500">{description}</span>
                            </button>
                        ))}
                    </div>

                    {/* Document type warnings */}
                    {documentType === 'FACTURA' && !customerNif && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>Factura (FT) requer NIF do cliente. Preencha o campo NIF acima.</span>
                        </div>
                    )}
                    {documentType === 'FACTURA_SIMPLIFICADA' && getTotal() > 25000 && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>Factura Simplificada limitada a 25.000 Kz. Total actual: {formatCurrency(getTotal())}</span>
                        </div>
                    )}
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatCurrency(getSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>IVA</span>
                        <span>{formatCurrency(getTaxAmount())}</span>
                    </div>
                    {getDiscountAmount() > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Desconto</span>
                            <span>-{formatCurrency(getDiscountAmount())}</span>
                        </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-[var(--primary)]">
                            {formatCurrency(getTotal())}
                        </span>
                    </div>
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
                        className="flex-1"
                        isLoading={isProcessing}
                    >
                        {isProcessing ? 'A processar...' : 'Confirmar Venda'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CheckoutModal;
