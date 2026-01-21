import { create } from 'zustand';
import { Product, ProductWithCategory } from '@/types';
import { ProductRepository } from '@/lib/db/repositories/ProductRepository';

interface ProductState {
    products: ProductWithCategory[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchProducts: (organizationId: string) => Promise<void>;
    createProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<Product>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    searchProducts: (query: string, organizationId: string) => Promise<void>;
    fetchProduct: (id: string) => Promise<Product | null>;
}

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    isLoading: false,
    error: null,

    fetchProducts: async (organizationId: string) => {
        set({ isLoading: true, error: null });
        try {
            const products = await ProductRepository.findAll(organizationId);
            set({ products, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    createProduct: async (productData) => {
        set({ isLoading: true, error: null });
        try {
            const newProduct = await ProductRepository.create(productData);
            set(state => ({
                products: [...state.products, { ...newProduct, category_name: undefined }], // Optimistic update
                isLoading: false
            }));
            return newProduct;
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    updateProduct: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await ProductRepository.update(id, updates);
            set(state => ({
                products: state.products.map(p => p.id === id ? { ...p, ...updates } : p),
                isLoading: false
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    deleteProduct: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await ProductRepository.delete(id);
            set(state => ({
                products: state.products.filter(p => p.id !== id),
                isLoading: false
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    searchProducts: async (query, organizationId) => {
        set({ isLoading: true, error: null });
        try {
            const products = await ProductRepository.search(query, organizationId);
            set({ products, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    fetchProduct: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const product = await ProductRepository.findById(id);
            set({ isLoading: false });
            return product;
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            return null;
        }
    }
}));
