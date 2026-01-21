'use client';

import React, { useState } from 'react';
import OrganizationSettings from '@/components/settings/OrganizationSettings';
import UserSettings from '@/components/settings/UserSettings';
import PrinterSettings from '@/components/settings/PrinterSettings';
import SystemSettings from '@/components/settings/SystemSettings';
import CategorySettings from '@/components/settings/CategorySettings';
import DatabaseSettings from '@/components/settings/DatabaseSettings';
import SaftExport from '@/components/saft/SaftExport';
import { Building, User, Printer, Database, Layers, HardDrive, FileCode } from 'lucide-react';

type SettingsTab = 'organization' | 'categories' | 'user' | 'printer' | 'database' | 'system' | 'compliance';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('organization');

    const tabs = [
        { id: 'organization' as SettingsTab, label: 'Organização', icon: Building },
        { id: 'categories' as SettingsTab, label: 'Categorias', icon: Layers },
        { id: 'user' as SettingsTab, label: 'Perfil', icon: User },
        { id: 'printer' as SettingsTab, label: 'Impressora', icon: Printer },
        { id: 'database' as SettingsTab, label: 'Base de Dados', icon: HardDrive },
        { id: 'system' as SettingsTab, label: 'Sistema', icon: Database },
        { id: 'compliance' as SettingsTab, label: 'Fiscal / SAF-T', icon: FileCode },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
                <p className="text-gray-500">Gerir definições da organização, categorias, perfil e sistema.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="lg:w-64 flex-shrink-0">
                    <nav className="bg-white rounded-lg shadow-sm border p-2 space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${activeTab === tab.id
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {activeTab === 'organization' && <OrganizationSettings />}
                    {activeTab === 'categories' && <CategorySettings />}
                    {activeTab === 'user' && <UserSettings />}
                    {activeTab === 'printer' && <PrinterSettings />}
                    {activeTab === 'database' && <DatabaseSettings />}
                    {activeTab === 'system' && <SystemSettings />}
                    {activeTab === 'compliance' && <SaftExport />}
                </div>
            </div>
        </div>
    );
}
