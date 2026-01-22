'use client';

import { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { SubscriptionGuard } from '@/components/auth/SubscriptionGuard';
import { ToastProvider } from '@/components/ui/Toast';

import Breadcrumbs from '@/components/dashboard/Breadcrumbs';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <ProtectedRoute>
            <ToastProvider>
                <div className="flex h-screen bg-gray-50 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
                    {/* Sidebar */}
                    <div className="print:hidden">
                        <Sidebar
                            isOpen={isSidebarOpen}
                            onClose={() => setIsSidebarOpen(false)}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col overflow-hidden print:h-auto print:overflow-visible">
                        {/* Header */}
                        <div className="print:hidden">
                            <Header onMenuClick={() => setIsSidebarOpen(true)} />
                        </div>

                        {/* Page Content */}
                        <main className="flex-1 overflow-auto p-6 print:p-0 print:overflow-visible print:h-auto">
                            <div className="print:hidden">
                                <Breadcrumbs />
                            </div>
                            <SubscriptionGuard>
                                {children}
                            </SubscriptionGuard>
                        </main>
                    </div>
                </div>
            </ToastProvider>
        </ProtectedRoute>
    );
}

