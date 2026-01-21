'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = () => {
    const pathname = usePathname();
    const paths = pathname.split('/').filter(Boolean);

    if (paths.length === 0 || (paths.length === 1 && paths[0] === 'dashboard')) return null;

    const pathNames: Record<string, string> = {
        'dashboard': 'Dashboard',
        'products': 'Produtos',
        'new': 'Novo',
        'edit': 'Editar',
        'stock': 'Stock',
        'movements': 'Movimentações',
        'entry': 'Entrada/Saída',
        'alerts': 'Alertas',
        'sales': 'Vendas',
        'invoices': 'Facturas',
        'customers': 'Clientes',
        'reports': 'Relatórios',
        'settings': 'Configurações'
    };

    return (
        <nav className="flex items-center text-sm text-gray-500 mb-6">
            <Link href="/dashboard" className="hover:text-gray-900 transition-colors">
                <Home className="w-4 h-4" />
            </Link>
            {paths.map((path, index) => {
                // Ignore 'dashboard' in the loop if we handled home link separately or keep it?
                // paths array for /dashboard/products/new is ['dashboard', 'products', 'new']
                if (path === 'dashboard') return null;

                const href = `/${paths.slice(0, index + 1).join('/')}`;
                const isLast = index === paths.length - 1;
                const name = pathNames[path] || path;

                return (
                    <React.Fragment key={path}>
                        <ChevronRight className="w-4 h-4 mx-2" />
                        {isLast ? (
                            <span className="font-medium text-gray-900">{name}</span>
                        ) : (
                            <Link href={href} className="hover:text-gray-900 transition-colors">
                                {name}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
