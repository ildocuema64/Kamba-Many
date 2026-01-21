import { create } from 'zustand';
import { Customer } from '@/types';
import { CustomerRepository, CustomerFilters, CustomerStats } from '@/lib/db/repositories/CustomerRepository';

const defaultStats: CustomerStats = {
    total: 0,
    active: 0,
    withNif: 0,
    totalPurchases: 0
};

interface CustomerState {
    customers: Customer[];
    selectedCustomer: Customer | null;
    stats: CustomerStats;
    filters: CustomerFilters;
    isLoading: boolean;
    error: string | null;

    fetchCustomers: (organizationId: string) => Promise<void>;
    fetchCustomerById: (id: string) => Promise<void>;
    fetchStats: (organizationId: string) => Promise<void>;
    createCustomer: (customer: Omit<Customer, 'id' | 'total_purchases' | 'created_at' | 'updated_at'>) => Promise<Customer>;
    updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    searchCustomers: (query: string, organizationId: string) => Promise<Customer[]>;
    setFilters: (filters: CustomerFilters) => void;
    clearSelectedCustomer: () => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
    customers: [],
    selectedCustomer: null,
    stats: defaultStats,
    filters: {},
    isLoading: false,
    error: null,

    fetchCustomers: async (organizationId) => {
        set({ isLoading: true, error: null });
        try {
            const { filters } = get();
            const customers = await CustomerRepository.findAll(organizationId, filters);
            set({ customers, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    fetchCustomerById: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const customer = await CustomerRepository.findById(id);
            set({ selectedCustomer: customer, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    fetchStats: async (organizationId) => {
        try {
            const stats = await CustomerRepository.getStats(organizationId);
            set({ stats });
        } catch (error) {
            console.error('Error fetching customer stats:', error);
        }
    },

    createCustomer: async (customer) => {
        set({ isLoading: true, error: null });
        try {
            const newCustomer = await CustomerRepository.create(customer);
            set(state => ({
                customers: [...state.customers, newCustomer],
                isLoading: false
            }));
            return newCustomer;
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    updateCustomer: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await CustomerRepository.update(id, updates);
            set(state => ({
                customers: state.customers.map(c =>
                    c.id === id ? { ...c, ...updates } : c
                ),
                selectedCustomer: state.selectedCustomer?.id === id
                    ? { ...state.selectedCustomer, ...updates }
                    : state.selectedCustomer,
                isLoading: false
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    deleteCustomer: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await CustomerRepository.delete(id);
            set(state => ({
                customers: state.customers.filter(c => c.id !== id),
                isLoading: false
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    searchCustomers: async (query, organizationId) => {
        try {
            return await CustomerRepository.search(query, organizationId);
        } catch (error) {
            console.error('Error searching customers:', error);
            return [];
        }
    },

    setFilters: (filters) => {
        set({ filters });
    },

    clearSelectedCustomer: () => {
        set({ selectedCustomer: null });
    }
}));
