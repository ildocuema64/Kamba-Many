/**
 * Cart Store - Gestão do estado do carrinho
 * Sistema KAMBA Many
 */

import { create } from 'zustand';
import { Product, CartItem, PaymentMethod } from '@/types';

interface CartState {
    items: CartItem[];
    customerName: string;
    customerNif: string;
    customerPhone: string;
    paymentMethod: PaymentMethod;

    // Actions
    addItem: (product: Product, quantity?: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    updateDiscount: (productId: string, discount: number) => void;
    clearCart: () => void;
    setCustomer: (name: string, nif: string, phone: string) => void;
    setPaymentMethod: (method: PaymentMethod) => void;

    // Computed
    getSubtotal: () => number;
    getTaxAmount: () => number;
    getDiscountAmount: () => number;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    customerName: '',
    customerNif: '',
    customerPhone: '',
    paymentMethod: 'DINHEIRO',

    addItem: (product: Product, quantity = 1) => {
        set((state) => {
            const existingItem = state.items.find(item => item.product.id === product.id);

            if (existingItem) {
                // Increment quantity if product already in cart
                return {
                    items: state.items.map(item =>
                        item.product.id === product.id
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    )
                };
            }

            // Add new item
            return {
                items: [...state.items, { product, quantity, discount: 0 }]
            };
        });
    },

    removeItem: (productId: string) => {
        set((state) => ({
            items: state.items.filter(item => item.product.id !== productId)
        }));
    },

    updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
            get().removeItem(productId);
            return;
        }

        set((state) => ({
            items: state.items.map(item =>
                item.product.id === productId
                    ? { ...item, quantity }
                    : item
            )
        }));
    },

    updateDiscount: (productId: string, discount: number) => {
        set((state) => ({
            items: state.items.map(item =>
                item.product.id === productId
                    ? { ...item, discount: Math.max(0, discount) }
                    : item
            )
        }));
    },

    clearCart: () => {
        set({
            items: [],
            customerName: '',
            customerNif: '',
            customerPhone: '',
            paymentMethod: 'DINHEIRO'
        });
    },

    setCustomer: (name: string, nif: string, phone: string) => {
        set({ customerName: name, customerNif: nif, customerPhone: phone });
    },

    setPaymentMethod: (method: PaymentMethod) => {
        set({ paymentMethod: method });
    },

    getSubtotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => {
            const lineSubtotal = item.product.unit_price * item.quantity;
            return sum + lineSubtotal - item.discount;
        }, 0);
    },

    getTaxAmount: () => {
        const { items } = get();
        return items.reduce((sum, item) => {
            const lineSubtotal = item.product.unit_price * item.quantity - item.discount;
            const taxAmount = lineSubtotal * (item.product.tax_rate / 100);
            return sum + taxAmount;
        }, 0);
    },

    getDiscountAmount: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.discount, 0);
    },

    getTotal: () => {
        return get().getSubtotal() + get().getTaxAmount();
    },

    getItemCount: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.quantity, 0);
    }
}));
