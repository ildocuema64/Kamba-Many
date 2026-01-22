'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import useSubscriptionStore from '@/store/subscriptionStore';
import { AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui';

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

const ALLOWED_PATHS = [
    '/dashboard/settings',
    '/login',
    '/forgot-password',
    '/reset-password'
];

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuthStore();
    const { hasActiveSubscription, loadSubscription, isLoading } = useSubscriptionStore();

    useEffect(() => {
        if (user?.organization_id) {
            // Ensure status is fresh
            loadSubscription(user.organization_id);
        }
    }, [user?.organization_id, loadSubscription]);

    // Bypass check for allowed paths (like settings where they pay)
    // Also ignore if not logged in (auth guard handles that)
    // SuperAdmin never needs subscription
    if (!user || user.role === 'SUPERADMIN' || ALLOWED_PATHS.some(path => pathname?.startsWith(path))) {
        return <>{children}</>;
    }

    // Checking status
    const isActive = hasActiveSubscription();

    // If loading or active, show content
    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">A verificar assinatura...</div>;
    }

    if (isActive) {
        return <>{children}</>;
    }

    // BLOCKING STATE
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-10 h-10 text-red-600" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Temporariamente Bloqueado</h1>
                <p className="text-gray-600 mb-6">
                    A licença de uso da sua organização expirou. Para continuar a usar o sistema, por favor renove a sua assinatura.
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800 flex items-start gap-3 text-left">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">Serviços Indisponíveis:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Ponto de Venda (POS)</li>
                            <li>Emissão de Facturas</li>
                            <li>Gestão de Stock</li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-3">
                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => router.push('/dashboard/settings')}
                    >
                        Renovar Assinatura Agora
                    </Button>

                    {user.role !== 'ADMIN' && (
                        <p className="text-xs text-gray-500 mt-4">
                            Se não é administrador, contacte o responsável da sua empresa.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
