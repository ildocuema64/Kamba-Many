'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { useCustomerStore } from '@/store/customerStore';
import { ProductRepository } from '@/lib/db/repositories/ProductRepository';
import { InvoiceRepository } from '@/lib/db/repositories/InvoiceRepository';
import { Product, Customer } from '@/types';
import {
    Search,
    Package,
    Trash2,
    Plus,
    Minus,
    Loader2,
    Users,
    UserPlus,
    FileText,
    Calendar
} from 'lucide-react';

interface ProformaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (invoiceId: string) => void;
}

interface ProformaItem {
    product: Product;
    quantity: number;
    discount: number;
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

const ProformaModal: React.FC<ProformaModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuthStore();
    const { customers, fetchCustomers, searchCustomers } = useCustomerStore();

    // State
    const [items, setItems] = useState<ProformaItem[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [customerNif, setCustomerNif] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [validityDays, setValidityDays] = useState(30);

    // Product search
    const [products, setProducts] = useState<Product[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    // Customer search
    const [customerMode, setCustomerMode] = useState<'search' | 'manual'>('search');
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);

    // Processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load products
    useEffect(() => {
        if (user?.organization_id && isOpen) {
            ProductRepository.findAll(user.organization_id).then(setProducts);
            fetchCustomers(user.organization_id);
        }
    }, [user?.organization_id, isOpen, fetchCustomers]);

    // Filter products based on search
    const filteredProducts = productSearch.trim()
        ? products.filter(p =>
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.code.toLowerCase().includes(productSearch.toLowerCase()) ||
            (p.barcode && p.barcode.includes(productSearch))
        ).slice(0, 10)
        : [];

    // Customer search effect
    useEffect(() => {
        if (customerSearchQuery.trim() && user?.organization_id) {
            const delayDebounceFn = setTimeout(async () => {
                const results = await searchCustomers(customerSearchQuery, user.organization_id!);
                setCustomerSearchResults(results);
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setCustomerSearchResults([]);
        }
    }, [customerSearchQuery, user?.organization_id, searchCustomers]);

    // Calculate totals
    const getSubtotal = () => items.reduce((sum, item) => {
        return sum + (item.product.unit_price * item.quantity) - item.discount;
    }, 0);

    const getTaxAmount = () => items.reduce((sum, item) => {
        const lineSubtotal = item.product.unit_price * item.quantity - item.discount;
        return sum + (lineSubtotal * (item.product.tax_rate / 100));
    }, 0);

    const getTotal = () => getSubtotal() + getTaxAmount();

    // Add product to proforma
    const handleAddProduct = (product: Product) => {
        const existing = items.find(item => item.product.id === product.id);
        if (existing) {
            setItems(items.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setItems([...items, { product, quantity: 1, discount: 0 }]);
        }
        setProductSearch('');
        setShowProductDropdown(false);
    };

    // Update quantity
    const handleUpdateQuantity = (productId: string, delta: number) => {
        setItems(items.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    // Remove item
    const handleRemoveItem = (productId: string) => {
        setItems(items.filter(item => item.product.id !== productId));
    };

    // Select customer
    const handleSelectCustomer = (customer: Customer) => {
        setCustomerName(customer.name);
        setCustomerNif(customer.nif || '');
        setCustomerPhone(customer.phone || '');
        setCustomerEmail(customer.email || '');
        setCustomerAddress(customer.address || '');
        setCustomerSearchQuery('');
        setCustomerSearchResults([]);
    };

    // Reset form
    const resetForm = () => {
        setItems([]);
        setCustomerName('');
        setCustomerNif('');
        setCustomerPhone('');
        setCustomerEmail('');
        setCustomerAddress('');
        setNotes('');
        setValidityDays(30);
        setProductSearch('');
        setCustomerSearchQuery('');
        setError(null);
    };

    // Submit proforma
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.organization_id || !user?.id) {
            setError('Utilizador não autenticado');
            return;
        }

        if (items.length === 0) {
            setError('Adicione pelo menos um produto');
            return;
        }

        if (!customerName.trim()) {
            setError('Preencha o nome do cliente');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const now = new Date().toISOString();
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + validityDays);

            const invoice = await InvoiceRepository.create({
                organization_id: user.organization_id,
                document_type: 'FACTURA_PROFORMA',
                customer_name: customerName,
                customer_nif: customerNif || undefined,
                customer_phone: customerPhone || undefined,
                customer_email: customerEmail || undefined,
                customer_address: customerAddress || undefined,
                subtotal: getSubtotal(),
                tax_amount: getTaxAmount(),
                discount_amount: items.reduce((sum, item) => sum + item.discount, 0),
                total_amount: getTotal(),
                tax_date: now,
                issue_date: now,
                due_date: dueDate.toISOString(),
                status: 'EMITIDA',
                payment_status: 'PENDING',
                user_id: user.id,
                notes: notes || undefined,
                is_fiscal: false,
                system_entry_date: now
            }, items.map(item => ({
                product_id: item.product.id,
                product_code: item.product.code,
                product_name: item.product.name,
                quantity: item.quantity,
                unit_price: item.product.unit_price,
                tax_rate: item.product.tax_rate,
                discount_amount: item.discount
            })));

            resetForm();
            onSuccess(invoice.id);
        } catch (err) {
            console.error('Proforma creation error:', err);
            setError('Erro ao criar proforma. Tente novamente.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nova Factura Proforma" size="xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header info */}
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span>A Factura Proforma não é um documento fiscal. Serve como orçamento ou proposta comercial.</span>
                </div>

                {/* Product Search */}
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Produtos
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            value={productSearch}
                            onChange={(e) => {
                                setProductSearch(e.target.value);
                                setShowProductDropdown(true);
                            }}
                            onFocus={() => setShowProductDropdown(true)}
                            placeholder="Pesquisar produto por nome, código ou barcode..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                        />

                        {/* Product dropdown */}
                        {showProductDropdown && filteredProducts.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredProducts.map(product => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => handleAddProduct(product)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0 border-gray-100"
                                    >
                                        <div className="flex justify-between">
                                            <span className="font-medium text-gray-900">{product.name}</span>
                                            <span className="text-[var(--primary)] font-medium">{formatCurrency(product.unit_price)}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Código: {product.code} | Stock: {product.current_stock}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Items list */}
                    {items.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-4 py-2 font-medium text-gray-600">Produto</th>
                                        <th className="text-center px-4 py-2 font-medium text-gray-600">Qtd</th>
                                        <th className="text-right px-4 py-2 font-medium text-gray-600">Preço</th>
                                        <th className="text-right px-4 py-2 font-medium text-gray-600">Total</th>
                                        <th className="px-2 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.product.id} className="border-t">
                                            <td className="px-4 py-2">
                                                <div className="font-medium text-gray-900">{item.product.name}</div>
                                                <div className="text-xs text-gray-500">{item.product.code}</div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                                                        className="p-1 rounded hover:bg-gray-100"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                                                        className="p-1 rounded hover:bg-gray-100"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-right text-gray-600">
                                                {formatCurrency(item.product.unit_price)}
                                            </td>
                                            <td className="px-4 py-2 text-right font-medium">
                                                {formatCurrency(item.product.unit_price * item.quantity)}
                                            </td>
                                            <td className="px-2 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.product.id)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {items.length === 0 && (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                            Pesquise e adicione produtos acima
                        </div>
                    )}
                </div>

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
                                Manual
                            </button>
                        </div>
                    </div>

                    {customerMode === 'search' && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                value={customerSearchQuery}
                                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                                placeholder="Pesquisar por nome ou NIF..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                            />

                            {customerSearchQuery.trim() && customerSearchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {customerSearchResults.map(c => (
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
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Nome *"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Nome do cliente"
                            required
                        />
                        <Input
                            label="NIF"
                            value={customerNif}
                            onChange={(e) => setCustomerNif(e.target.value)}
                            placeholder="000000000"
                            maxLength={9}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Telefone"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="+244 900 000 000"
                        />
                        <Input
                            label="Email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                            type="email"
                        />
                    </div>
                    <Input
                        label="Morada"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Endereço do cliente"
                    />
                </div>

                {/* Validity and Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Validade (dias)
                        </label>
                        <input
                            type="number"
                            value={validityDays}
                            onChange={(e) => setValidityDays(Math.max(1, parseInt(e.target.value) || 30))}
                            min={1}
                            max={365}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notas adicionais..."
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Totals */}
                {items.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatCurrency(getSubtotal())}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>IVA</span>
                            <span>{formatCurrency(getTaxAmount())}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                            <span className="text-lg font-bold text-gray-900">Total</span>
                            <span className="text-xl font-bold text-[var(--primary)]">
                                {formatCurrency(getTotal())}
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
                        onClick={() => {
                            resetForm();
                            onClose();
                        }}
                        className="flex-1"
                        disabled={isProcessing}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1"
                        isLoading={isProcessing}
                        disabled={items.length === 0}
                    >
                        {isProcessing ? 'A criar...' : 'Criar Proforma'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ProformaModal;
