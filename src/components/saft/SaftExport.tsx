'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import { Download, FileCode, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { SaftGenerator } from '@/lib/saft/xmlGenerator';
import { useAuthStore } from '@/store/authStore';

export default function SaftExport() {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1); // First day of current month
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const date = new Date(); // Today
        return date.toISOString().split('T')[0];
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const handleExport = async () => {
        if (!user?.organization_id) return;

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const generator = new SaftGenerator();

            // Mock organization object for now or fetch it properly
            // In a real app, we should fetch the full Organization details
            const organization = {
                id: user.organization_id,
                name: 'Minha Empresa Demo', // TODO: Fetch from store
                nif: '5417082695', // TODO: Fetch from store
                address: 'Luanda, Angola',
                fiscal_regime: 'GERAL',
                is_active: true,
                created_at: '',
                updated_at: ''
            } as any;

            const xml = await generator.generate(user.organization_id, startDate, endDate, organization);

            // Trigger Download
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SAFT_AO_${startDate}_${endDate}.xml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setSuccessMessage('Ficheiro SAF-T gerado com sucesso!');
        } catch (err) {
            console.error(err);
            setError('Erro ao gerar ficheiro SAF-T: ' + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <FileCode className="w-6 h-6 text-blue-600" />
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Exportação SAF-T (AO)</h2>
                    <p className="text-sm text-gray-500">Decreto Presidencial n.º 312/18</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {successMessage}
                </div>
            )}

            <button
                onClick={handleExport}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                <span>Gerar e Descarregar XML</span>
            </button>
        </Card>
    );
}
