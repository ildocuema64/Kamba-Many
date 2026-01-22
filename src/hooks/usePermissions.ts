'use client';

import { useAuthStore } from '@/store/authStore';
import {
    hasPermission,
    canAccessModule,
    getAccessibleModules,
    isAdminRole,
    normalizeRole,
    type SystemModule,
    type ModuleAction,
    type UserRole,
    ROLE_LABELS,
    ROLE_COLORS
} from '@/lib/auth/permissions';

export interface UsePermissionsReturn {
    // Role do utilizador atual
    role: UserRole;
    roleLabel: string;
    roleColors: { bg: string; text: string; border: string };

    // Verificações de permissão
    can: (module: SystemModule, action?: ModuleAction) => boolean;
    canView: (module: SystemModule) => boolean;
    canCreate: (module: SystemModule) => boolean;
    canEdit: (module: SystemModule) => boolean;
    canDelete: (module: SystemModule) => boolean;

    // Verificações especiais
    isAdmin: boolean;
    isSuperAdmin: boolean;
    accessibleModules: SystemModule[];
}

/**
 * Hook para verificar permissões do utilizador atual
 */
export function usePermissions(): UsePermissionsReturn {
    const { user } = useAuthStore();

    const role = normalizeRole(user?.role || '');
    const roleLabel = ROLE_LABELS[role] || 'Desconhecido';
    const roleColors = ROLE_COLORS[role] || ROLE_COLORS.VIEWER;

    return {
        role,
        roleLabel,
        roleColors,

        can: (module: SystemModule, action: ModuleAction = 'view') =>
            hasPermission(user?.role, module, action),

        canView: (module: SystemModule) =>
            hasPermission(user?.role, module, 'view'),

        canCreate: (module: SystemModule) =>
            hasPermission(user?.role, module, 'create'),

        canEdit: (module: SystemModule) =>
            hasPermission(user?.role, module, 'edit'),

        canDelete: (module: SystemModule) =>
            hasPermission(user?.role, module, 'delete'),

        isAdmin: isAdminRole(user?.role),
        isSuperAdmin: normalizeRole(user?.role || '') === 'SUPERADMIN',
        accessibleModules: getAccessibleModules(user?.role),
    };
}

export default usePermissions;
