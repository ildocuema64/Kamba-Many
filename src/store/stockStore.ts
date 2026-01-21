import { create } from 'zustand';
import { StockMovement, ProductWithCategory } from '@/types';
import { StockRepository } from '@/lib/db/repositories/StockRepository';

interface StockState {
    movements: (StockMovement & { product_name: string })[];
    lowStockProducts: ProductWithCategory[];
    isLoading: boolean;
    error: string | null;

    fetchMovements: (organizationId: string) => Promise<void>;
    fetchLowStock: (organizationId: string) => Promise<void>;
    createMovement: (movement: Omit<StockMovement, 'id' | 'created_at'>) => Promise<void>;
}

export const useStockStore = create<StockState>((set) => ({
    movements: [],
    lowStockProducts: [],
    isLoading: false,
    error: null,

    fetchMovements: async (organizationId) => {
        set({ isLoading: true, error: null });
        try {
            const movements = await StockRepository.findMovements(organizationId);
            set({ movements, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    fetchLowStock: async (organizationId) => {
        set({ isLoading: true, error: null });
        try {
            const lowStockProducts = await StockRepository.findLowStock(organizationId);
            set({ lowStockProducts, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    createMovement: async (movement) => {
        set({ isLoading: true, error: null });
        try {
            const newMovement = await StockRepository.createMovement(movement);
            // Optimistic update of movements list
            // Assuming we have product name? We don't in the input. 
            // Better to just refresh the list or append if we fetch name.
            // For now, let's just trigger a refetch of movements if needed or append with placeholder

            // To be safe and simple, re-fetch movements is good, or manual append.
            // But we need product name.
            set(state => ({ isLoading: false }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    }
}));
