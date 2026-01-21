import { create } from 'zustand';
import { Category } from '@/types';
import { CategoryRepository } from '@/lib/db/repositories/CategoryRepository';

interface CategoryState {
    categories: Category[];
    isLoading: boolean;
    error: string | null;

    fetchCategories: (organizationId: string) => Promise<void>;
    createCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => Promise<Category>;
    updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set) => ({
    categories: [],
    isLoading: false,
    error: null,

    fetchCategories: async (organizationId) => {
        set({ isLoading: true, error: null });
        try {
            const categories = await CategoryRepository.findAll(organizationId);
            set({ categories, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    createCategory: async (categoryData) => {
        set({ isLoading: true, error: null });
        try {
            const newCategory = await CategoryRepository.create(categoryData);
            set(state => ({
                categories: [...state.categories, newCategory],
                isLoading: false
            }));
            return newCategory;
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    updateCategory: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await CategoryRepository.update(id, updates);
            set(state => ({
                categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c),
                isLoading: false
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    deleteCategory: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await CategoryRepository.delete(id);
            set(state => ({
                categories: state.categories.filter(c => c.id !== id),
                isLoading: false
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    }
}));
