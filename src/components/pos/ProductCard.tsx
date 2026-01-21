'use client';

import React from 'react';
import { Product } from '@/types';
import { Package } from 'lucide-react';

interface ProductCardProps {
    product: Product;
    onSelect: (product: Product) => void;
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

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
    const isLowStock = product.current_stock <= product.min_stock;
    const isOutOfStock = product.current_stock <= 0;

    return (
        <button
            onClick={() => !isOutOfStock && onSelect(product)}
            disabled={isOutOfStock}
            className={`
                group relative w-full text-left p-3 rounded-2xl border transition-all duration-300
                flex flex-col h-full
                ${isOutOfStock
                    ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                    : 'bg-white border-gray-100 hover:border-[var(--primary)]/50 hover:shadow-xl hover:-translate-y-1'
                }
            `}
        >
            {/* Product Image/Icon */}
            <div className={`
                relative aspect-[4/3] mb-3 rounded-xl overflow-hidden flex items-center justify-center transition-colors
                ${isOutOfStock ? 'bg-gray-100' : 'bg-gray-50 group-hover:bg-[var(--primary)]/5'}
            `}>
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <Package className={`w-10 h-10 transition-colors ${isOutOfStock ? 'text-gray-300' : 'text-gray-300 group-hover:text-[var(--primary)]'}`} />
                )}

                {/* Overlay Add Intent */}
                {!isOutOfStock && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-900 shadow-sm">
                            Adicionar
                        </div>
                    </div>
                )}
            </div>

            {/* Product Info - Flex Grow to push footer down */}
            <div className="flex-1 min-w-0 space-y-0.5 mb-2">
                <div className="flex items-start justify-between gap-2">
                    <h3
                        className="font-semibold text-gray-900 text-xs leading-snug line-clamp-2 group-hover:text-[var(--primary)] transition-colors"
                        title={product.name}
                    >
                        {product.name}
                    </h3>
                </div>
                <p className="text-[10px] text-gray-400 font-mono truncate">
                    {product.code}
                </p>
            </div>

            {/* Price & Stock - Footer */}
            <div className="pt-2 border-t border-dashed border-gray-100 flex items-end justify-between gap-1 mt-auto">
                <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-[var(--primary)] whitespace-nowrap">
                        {formatCurrency(product.unit_price)}
                    </p>
                    {product.tax_rate > 0 && (
                        <p className="text-[9px] text-gray-400 truncate">
                            + {product.tax_rate}% IVA
                        </p>
                    )}
                </div>

                <div className="flex-shrink-0">
                    <span className={`
                        inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-medium border
                        ${isOutOfStock
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : isLowStock
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }
                    `}>
                        {isOutOfStock
                            ? 'Esgotado'
                            : `${product.current_stock} ${product.unit_type}`
                        }
                    </span>
                </div>
            </div>
        </button>
    );
};

export default ProductCard;
