'use client';

import React, { useState } from 'react';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Calendar, Download, RefreshCw } from 'lucide-react';

export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

interface ReportFiltersProps {
    period: ReportPeriod;
    startDate: string;
    endDate: string;
    onPeriodChange: (period: ReportPeriod) => void;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    onRefresh: () => void;
    onExport?: () => void;
    isLoading?: boolean;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
    period,
    startDate,
    endDate,
    onPeriodChange,
    onStartDateChange,
    onEndDateChange,
    onRefresh,
    onExport,
    isLoading
}) => {
    const periodOptions = [
        { value: 'today', label: 'Hoje' },
        { value: 'week', label: 'Esta Semana' },
        { value: 'month', label: 'Este Mês' },
        { value: 'year', label: 'Este Ano' },
        { value: 'custom', label: 'Personalizado' },
    ];

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <Select
                        options={periodOptions}
                        value={period}
                        onChange={(e) => onPeriodChange(e.target.value as ReportPeriod)}
                    />
                </div>

                {period === 'custom' && (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">De:</span>
                            <input
                                type="date"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={startDate}
                                onChange={(e) => onStartDateChange(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Até:</span>
                            <input
                                type="date"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={endDate}
                                onChange={(e) => onEndDateChange(e.target.value)}
                            />
                        </div>
                    </>
                )}

                <div className="flex gap-2 ml-auto">
                    <Button
                        variant="outline"
                        onClick={onRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    {onExport && (
                        <Button variant="outline" onClick={onExport}>
                            <Download className="w-4 h-4 mr-2" />
                            Exportar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportFilters;
