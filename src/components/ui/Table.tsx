import React from 'react';
import Spinner from './Spinner';
import EmptyState from './EmptyState';
import Button from './Button';

export interface TableColumn<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
}

export interface TableProps<T> {
    data: T[];
    columns: TableColumn<T>[];
    keyExtractor?: (item: T) => string | number;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    loading?: boolean;
    emptyState?: {
        title: string;
        description: string;
        actionLabel?: string;
        onAction?: () => void;
    };
}

function Table<T>({
    data,
    columns,
    keyExtractor = (item: any) => item.id,
    onRowClick,
    emptyMessage = 'Nenhum dado disponível',
    loading = false,
    emptyState
}: TableProps<T>) {
    if (loading) {
        return (
            <div className="w-full flex justify-center items-center py-12">
                <Spinner />
            </div>
        );
    }

    if (data.length === 0) {
        if (emptyState) {
            return (
                <EmptyState
                    title={emptyState.title}
                    description={emptyState.description}
                    action={emptyState.actionLabel && emptyState.onAction ? (
                        <Button onClick={emptyState.onAction}>
                            {emptyState.actionLabel}
                        </Button>
                    ) : undefined}
                />
            );
        }
        return (
            <div className="text-center py-12 text-gray-500">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item, index) => (
                        <tr
                            key={keyExtractor ? keyExtractor(item) : (item as any).id || index}
                            onClick={() => onRowClick?.(item)}
                            className={onRowClick ? 'hover:bg-gray-50 cursor-pointer transition-colors' : ''}
                        >
                            {columns.map((column) => (
                                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {column.render ? column.render(item) : String((item as any)[column.key])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
