'use client';

import React, { useEffect, useState } from 'react';
import db from '@/lib/db/sqlite';
import Spinner from '@/components/ui/Spinner';

interface DatabaseProviderProps {
    children: React.ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initDB = async () => {
            try {
                await db.initialize();
                setIsInitialized(true);
            } catch (err) {
                console.error('Failed to initialize database:', err);
                setError('Falha ao inicializar o banco de dados. Por favor, recarregue a página.');
            }
        };

        if (!isInitialized) {
            initDB();
        }
    }, [isInitialized]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Erro de Inicialização</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    if (!isInitialized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-500 font-medium">A carregar sistema...</p>
            </div>
        );
    }

    return <>{children}</>;
};

export default DatabaseProvider;
