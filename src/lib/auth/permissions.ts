/**
 * Sistema de Permissões por Role
 * Define quais ações cada role pode executar em cada módulo do sistema
 */

// Roles disponíveis no sistema (alinhados com schema SQL)
export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER';

// Mapeamento de roles legacy para novos roles
export const LEGACY_ROLE_MAP: Record<string, UserRole> = {
    'superadmin': 'SUPERADMIN',
    'admin': 'ADMIN',
    'vendedor': 'CASHIER',
    'manager': 'MANAGER',
    'cashier': 'CASHIER',
    'viewer': 'VIEWER',
};

// Módulos do sistema
export type SystemModule =
    | 'dashboard'
    | 'pos'
    | 'products'
    | 'stock'
    | 'invoices'
    | 'customers'
    | 'reports'
    | 'settings'
    | 'users';

// Ações possíveis
export type ModuleAction = 'view' | 'create' | 'edit' | 'delete';

// Tipo para permissões de um módulo
type ModulePermissions = {
    [action in ModuleAction]?: UserRole[];
};

// Mapa de permissões completo
export const PERMISSIONS: Record<SystemModule, ModulePermissions> = {
    dashboard: {
        view: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'],
    },
    pos: {
        view: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER'],
        create: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER'], // criar vendas
    },
    products: {
        view: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'],
        create: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
        edit: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
        delete: ['SUPERADMIN', 'ADMIN'],
    },
    stock: {
        view: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'],
        create: ['SUPERADMIN', 'ADMIN', 'MANAGER'], // ajustes de stock
        edit: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
    },
    invoices: {
        view: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'],
        create: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER'],
        edit: ['SUPERADMIN', 'ADMIN'], // anular facturas
        delete: ['SUPERADMIN'], // só superadmin pode eliminar
    },
    customers: {
        view: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'],
        create: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER'],
        edit: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER'],
        delete: ['SUPERADMIN', 'ADMIN'],
    },
    reports: {
        view: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'VIEWER'],
    },
    settings: {
        view: ['SUPERADMIN', 'ADMIN'],
        edit: ['SUPERADMIN', 'ADMIN'],
    },
    users: {
        view: ['SUPERADMIN', 'ADMIN'],
        create: ['SUPERADMIN', 'ADMIN'],
        edit: ['SUPERADMIN', 'ADMIN'],
        delete: ['SUPERADMIN'],
    },
};

// Labels amigáveis para exibição
export const ROLE_LABELS: Record<UserRole, string> = {
    SUPERADMIN: 'Super Administrador',
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    CASHIER: 'Caixa',
    VIEWER: 'Visualizador',
};

// Cores para badges
export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
    SUPERADMIN: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    ADMIN: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    MANAGER: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    CASHIER: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    VIEWER: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
};

/**
 * Verifica se um role tem permissão para uma ação em um módulo
 */
export function hasPermission(
    role: UserRole | string | undefined,
    module: SystemModule,
    action: ModuleAction = 'view'
): boolean {
    if (!role) return false;

    // Normaliza role (suporte a legacy roles)
    const normalizedRole = normalizeRole(role);

    const modulePermissions = PERMISSIONS[module];
    if (!modulePermissions) return false;

    const allowedRoles = modulePermissions[action];
    if (!allowedRoles) return false;

    return allowedRoles.includes(normalizedRole);
}

/**
 * Normaliza um role (converte legacy para novo formato)
 */
export function normalizeRole(role: string): UserRole {
    const upperRole = role.toUpperCase() as UserRole;
    if (Object.keys(ROLE_LABELS).includes(upperRole)) {
        return upperRole;
    }
    return LEGACY_ROLE_MAP[role.toLowerCase()] || 'VIEWER';
}

/**
 * Verifica se um role pode acessar um módulo (qualquer ação)
 */
export function canAccessModule(role: UserRole | string | undefined, module: SystemModule): boolean {
    return hasPermission(role, module, 'view');
}

/**
 * Retorna lista de módulos acessíveis para um role
 */
export function getAccessibleModules(role: UserRole | string | undefined): SystemModule[] {
    const modules: SystemModule[] = [
        'dashboard', 'pos', 'products', 'stock',
        'invoices', 'customers', 'reports', 'settings', 'users'
    ];

    return modules.filter(module => canAccessModule(role, module));
}

/**
 * Verifica se um role é administrativo (pode gerir utilizadores)
 */
export function isAdminRole(role: UserRole | string | undefined): boolean {
    if (!role) return false;
    const normalizedRole = normalizeRole(role);
    return normalizedRole === 'SUPERADMIN' || normalizedRole === 'ADMIN';
}
