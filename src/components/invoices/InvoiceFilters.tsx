'use client';

import React from 'react';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Search, X } from 'lucide-react';
import { InvoiceFilters } from '@/lib/db/repositories/InvoiceRepository';
import { DocumentType, InvoiceStatus } from '@/types';

interface InvoiceFiltersProps {
    filters: InvoiceFilters;
    onFilterChange: (filters: InvoiceFilters) => void;
    onApply: () => void;
}

const InvoiceFiltersComponent: React.FC<InvoiceFiltersProps> = ({
    filters,
    onFilterChange,
    onApply
}) => {
    const documentTypeOptions = [
        { value: '', label: 'Todos os tipos' },
        { value: 'FACTURA', label: 'Factura' },
        { value: 'FACTURA_RECIBO', label: 'Factura-Recibo' },
        { value: 'FACTURA_SIMPLIFICADA', label: 'Factura Simplificada' },
        { value: 'FACTURA_PROFORMA', label: 'Proforma' },
        { value: 'NOTA_CREDITO', label: 'Nota de Crédito' },
        { value: 'NOTA_DEBITO', label: 'Nota de Débito' },
    ];

    const statusOptions = [
        { value: '', label: 'Todos os estados' },
        { value: 'EMITIDA', label: 'Emitida' },
        { value: 'CANCELADA', label: 'Cancelada' },
        { value: 'ANULADA', label: 'Anulada' },
        { value: 'RASCUNHO', label: 'Rascunho' },
    ];

    const handleClearFilters = () => {
        onFilterChange({});
        onApply();
    };

    const hasFilters = Object.values(filters).some(v => v !== undefined && v !== '');

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Pesquisa */}
                <div className="lg:col-span-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Pesquisar cliente ou NIF..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={filters.customerSearch || ''}
                            onChange={(e) => onFilterChange({ ...filters, customerSearch: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && onApply()}
                        />
                    </div>
                </div>

                {/* Tipo de Documento */}
                <Select
                    options={documentTypeOptions}
                    value={filters.documentType || ''}
                    onChange={(e) => onFilterChange({
                        ...filters,
                        documentType: e.target.value as DocumentType | undefined
                    })}
                />

                {/* Estado */}
                <Select
                    options={statusOptions}
                    value={filters.status || ''}
                    onChange={(e) => onFilterChange({
                        ...filters,
                        status: e.target.value as InvoiceStatus | undefined
                    })}
                />

                {/* Ações */}
                <div className="flex gap-2">
                    <Button variant="primary" onClick={onApply} className="flex-1">
                        Filtrar
                    </Button>
                    {hasFilters && (
                        <Button variant="outline" onClick={handleClearFilters}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Filtros de Data */}
            <div className="flex flex-wrap gap-4 items-center text-sm">
                <span className="text-gray-500">Período:</span>
                <input
                    type="date"
                    className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.startDate || ''}
                    onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                />
                <span className="text-gray-400">até</span>
                <input
                    type="date"
                    className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.endDate || ''}
                    onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                />
            </div>
        </div>
    );
};

export default InvoiceFiltersComponent;
