'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductGrid from '@/components/pos/ProductGrid';
import CartPanel from '@/components/pos/CartPanel';
import CheckoutModal from '@/components/pos/CheckoutModal';
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/types';
import { CheckCircle2, X } from 'lucide-react';

export default function POSPage() {
    const router = useRouter();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { addItem } = useCartStore();

    const handleProductSelect = (product: Product) => {
        addItem(product);
    };

    const handleCheckoutSuccess = (saleNumber: string, invoiceId?: string) => {
        setIsCheckoutOpen(false);
        setSuccessMessage(`Venda ${saleNumber} registada com sucesso!`);

        // Navigate to invoice view if available
        if (invoiceId) {
            router.push(`/dashboard/invoices/${invoiceId}`);
        }

        // Auto-dismiss success message after 5 seconds
        setTimeout(() => {
            setSuccessMessage(null);
        }, 5000);
    };

    return (
        <div className="h-[calc(100vh-130px)] flex flex-col lg:flex-row gap-6">
            {/* Success Toast */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg animate-slide-in">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">{successMessage}</span>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="ml-2 hover:bg-green-700 p-1 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Products Grid - Left Side */}
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <ProductGrid onProductSelect={handleProductSelect} />
            </div>

            {/* Cart Panel - Right Side */}
            <div className="w-full lg:w-96 flex-shrink-0">
                <CartPanel onCheckout={() => setIsCheckoutOpen(true)} />
            </div>

            {/* Checkout Modal */}
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onSuccess={handleCheckoutSuccess}
            />
        </div>
    );
}
