import { create } from 'zustand';
import { Invoice, InvoiceWithItems, DocumentType, InvoiceStatus } from '@/types';
import { InvoiceRepository, InvoiceFilters, InvoiceStats } from '@/lib/db/repositories/InvoiceRepository';
import { useAuthStore } from '@/store/authStore';

interface InvoiceState {
    invoices: Invoice[];
    selectedInvoice: InvoiceWithItems | null;
    stats: InvoiceStats;
    filters: InvoiceFilters;
    isLoading: boolean;
    error: string | null;

    fetchInvoices: (organizationId: string) => Promise<void>;
    fetchInvoiceById: (id: string) => Promise<void>;
    fetchStats: (organizationId: string) => Promise<void>;
    voidInvoice: (id: string, reason: string) => Promise<void>;
    setFilters: (filters: InvoiceFilters) => void;
    clearSelectedInvoice: () => void;
}

const defaultStats: InvoiceStats = {
    total: 0,
    emitidas: 0,
    canceladas: 0,
    pendingPayment: 0,
    todayTotal: 0,
    monthTotal: 0
};

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
    invoices: [],
    selectedInvoice: null,
    stats: defaultStats,
    filters: {},
    isLoading: false,
    error: null,

    fetchInvoices: async (organizationId) => {
        set({ isLoading: true, error: null });
        try {
            const { filters } = get();
            const invoices = await InvoiceRepository.findAll(organizationId, filters);
            set({ invoices, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    fetchInvoiceById: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const invoice = await InvoiceRepository.findByIdWithItems(id);
            set({ selectedInvoice: invoice, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    fetchStats: async (organizationId) => {
        try {
            const stats = await InvoiceRepository.getStats(organizationId);
            set({ stats });
        } catch (error) {
            console.error('Error fetching invoice stats:', error);
        }
    },

    voidInvoice: async (id, reason) => {
        set({ isLoading: true, error: null });
        try {
            const { user } = useAuthStore.getState();
            if (!user) throw new Error('User not authenticated');

            await InvoiceRepository.cancel(id, reason, user.id, user.organization_id);

            // Refresh details if selected
            const { selectedInvoice, filters } = get();
            if (selectedInvoice?.id === id) {
                await get().fetchInvoiceById(id);
            }

            // Refresh list
            if (user?.organization_id) {
                await get().fetchInvoices(user.organization_id);
                await get().fetchStats(user.organization_id);
            }

        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    setFilters: (filters) => {
        set({ filters });
    },

    clearSelectedInvoice: () => {
        set({ selectedInvoice: null });
    }
}));
