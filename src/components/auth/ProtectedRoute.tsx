'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import Spinner from '@/components/ui/Spinner';
import { type SystemModule, type UserRole } from '@/lib/auth/permissions';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** Roles permitidos (modo legacy) */
    requireRole?: UserRole | UserRole[];
    /** Módulo requerido - verificará se o utilizador tem permissão para visualizar */
    requireModule?: SystemModule;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireRole,
    requireModule
}) => {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const { canView, role } = usePermissions();

    // Verificação de autenticação
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    // Verificação de permissão
    const hasAccess = (): boolean => {
        if (!user) return false;

        // Verificação por módulo (novo sistema)
        if (requireModule) {
            return canView(requireModule);
        }

        // Verificação por role (legacy/específica)
        if (requireRole) {
            const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
            return allowedRoles.includes(role);
        }

        // Sem restrição específica, apenas autenticação
        return true;
    };

    // Loading state
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    // Verificação de acesso
    if (!hasAccess()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600\" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
                    <p className="text-gray-600 mb-6">
                        Você não tem permissão para acessar esta página.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Voltar ao Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;

