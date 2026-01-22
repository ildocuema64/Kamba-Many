/**
 * Store de Assinaturas - Zustand
 * Gestão do estado de assinatura da organização
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import db from '@/lib/db/sqlite';
import { isSubscriptionActive, daysRemaining, type PlanType } from '@/lib/subscription/activationService';

interface Subscription {
    id: string;
    organization_id: string;
    plan_type: PlanType;
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
    start_date: string;
    end_date: string;
    amount: number;
}

interface SubscriptionRequest {
    id: string;
    organization_id: string;
    plan_type: PlanType;
    payment_method: 'TRANSFERENCIA' | 'MULTICAIXA_EXPRESS';
    reference_code: string;
    activation_code_hash: string | null;
    amount: number;
    status: 'PENDING' | 'ACTIVATED' | 'REJECTED' | 'EXPIRED';
    requested_at: string;
    activated_at: string | null;
}

interface SubscriptionState {
    currentSubscription: Subscription | null;
    pendingRequests: SubscriptionRequest[];
    isLoading: boolean;
    lastCheck: string | null;

    // Actions
    loadSubscription: (organizationId: string) => void;
    loadPendingRequests: (organizationId: string) => void;
    hasActiveSubscription: () => boolean;
    getDaysRemaining: () => number;
    refresh: (organizationId: string) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set, get) => ({
            currentSubscription: null,
            pendingRequests: [],
            isLoading: false,
            lastCheck: null,

            loadSubscription: (organizationId: string) => {
                try {
                    const subscription = db.queryOne<Subscription>(
                        `SELECT * FROM subscriptions 
                         WHERE organization_id = ? 
                         AND status = 'ACTIVE'
                         AND date(end_date) >= date('now')
                         ORDER BY end_date DESC
                         LIMIT 1`,
                        [organizationId]
                    );

                    set({
                        currentSubscription: subscription,
                        lastCheck: new Date().toISOString(),
                    });
                } catch (error) {
                    console.error('Erro ao carregar assinatura:', error);
                    set({ currentSubscription: null });
                }
            },

            loadPendingRequests: (organizationId: string) => {
                try {
                    const requests = db.query<SubscriptionRequest>(
                        `SELECT * FROM subscription_requests 
                         WHERE organization_id = ? 
                         AND status = 'PENDING'
                         ORDER BY requested_at DESC`,
                        [organizationId]
                    );

                    set({ pendingRequests: requests });
                } catch (error) {
                    console.error('Erro ao carregar pedidos:', error);
                    set({ pendingRequests: [] });
                }
            },

            hasActiveSubscription: () => {
                const { currentSubscription } = get();
                if (!currentSubscription) return false;
                return isSubscriptionActive(currentSubscription.end_date);
            },

            getDaysRemaining: () => {
                const { currentSubscription } = get();
                if (!currentSubscription) return 0;
                return daysRemaining(currentSubscription.end_date);
            },

            refresh: (organizationId: string) => {
                set({ isLoading: true });
                get().loadSubscription(organizationId);
                get().loadPendingRequests(organizationId);
                set({ isLoading: false });
            },
        }),
        {
            name: 'pos-angola-subscription',
            partialize: (state) => ({
                currentSubscription: state.currentSubscription,
                lastCheck: state.lastCheck,
            }),
        }
    )
);

export default useSubscriptionStore;
