'use client';

import React from 'react';
import { useCartStore } from '@/store/cartStore';
import CartItemRow from './CartItemRow';
import Button from '@/components/ui/Button';
import { ShoppingCart, Trash2 } from 'lucide-react';

interface CartPanelProps {
    onCheckout: () => void;
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

const CartPanel: React.FC<CartPanelProps> = ({ onCheckout }) => {
    const {
        items,
        updateQuantity,
        removeItem,
        clearCart,
        getSubtotal,
        getTaxAmount,
        getDiscountAmount,
        getTotal,
        getItemCount
    } = useCartStore();

    const subtotal = getSubtotal();
    const taxAmount = getTaxAmount();
    const discountAmount = getDiscountAmount();
    const total = getTotal();
    const itemCount = getItemCount();

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-[var(--primary)]" />
                    <h2 className="font-semibold text-gray-900">Carrinho</h2>
                    {itemCount > 0 && (
                        <span className="bg-[var(--primary)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {itemCount}
                        </span>
                    )}
                </div>
                {items.length > 0 && (
                    <button
                        onClick={clearCart}
                        className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Limpar
                    </button>
                )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-4">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                        <ShoppingCart className="w-16 h-16 mb-4" />
                        <p className="font-medium">Carrinho vazio</p>
                        <p className="text-sm mt-1">Clique num produto para adicionar</p>
                    </div>
                ) : (
                    <div className="py-2">
                        {items.map(item => (
                            <CartItemRow
                                key={item.product.id}
                                item={item}
                                onUpdateQuantity={updateQuantity}
                                onRemove={removeItem}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Totals & Checkout */}
            {items.length > 0 && (
                <div className="border-t border-gray-200 p-4 space-y-3">
                    {/* Subtotals */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>IVA</span>
                            <span>{formatCurrency(taxAmount)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Desconto</span>
                                <span>-{formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-[var(--primary)]">
                            {formatCurrency(total)}
                        </span>
                    </div>

                    {/* Checkout Button */}
                    <Button
                        onClick={onCheckout}
                        size="lg"
                        className="w-full mt-4"
                    >
                        Finalizar Venda
                    </Button>
                </div>
            )}
        </div>
    );
};

export default CartPanel;
