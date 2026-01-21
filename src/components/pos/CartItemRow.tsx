'use client';

import React from 'react';
import { CartItem } from '@/types';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemRowProps {
    item: CartItem;
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onRemove: (productId: string) => void;
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

const CartItemRow: React.FC<CartItemRowProps> = ({ item, onUpdateQuantity, onRemove }) => {
    const lineTotal = item.product.unit_price * item.quantity;
    const lineTax = lineTotal * (item.product.tax_rate / 100);
    const lineWithTax = lineTotal + lineTax - item.discount;

    return (
        <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
            {/* Product Info */}
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                    {item.product.name}
                </h4>
                <p className="text-xs text-gray-500">
                    {formatCurrency(item.product.unit_price)} × {item.quantity}
                </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    aria-label="Diminuir quantidade"
                >
                    <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="w-8 text-center font-medium text-sm">
                    {item.quantity}
                </span>
                <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.current_stock}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Aumentar quantidade"
                >
                    <Plus className="w-4 h-4 text-gray-600" />
                </button>
            </div>

            {/* Total & Remove */}
            <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm w-24 text-right">
                    {formatCurrency(lineWithTax)}
                </span>
                <button
                    onClick={() => onRemove(item.product.id)}
                    className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                    aria-label="Remover item"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default CartItemRow;
