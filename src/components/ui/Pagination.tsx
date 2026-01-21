import React from 'react';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    siblingCount?: number;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 1,
}) => {
    if (totalPages <= 1) return null;

    const range = (start: number, end: number) => {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    const getPageNumbers = () => {
        const totalNumbers = siblingCount * 2 + 5;

        if (totalPages <= totalNumbers) {
            return range(1, totalPages);
        }

        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

        const showLeftDots = leftSiblingIndex > 2;
        const showRightDots = rightSiblingIndex < totalPages - 1;

        if (!showLeftDots && showRightDots) {
            const leftRange = range(1, 3 + 2 * siblingCount);
            return [...leftRange, '...', totalPages];
        }

        if (showLeftDots && !showRightDots) {
            const rightRange = range(totalPages - (2 + 2 * siblingCount), totalPages);
            return [1, '...', ...rightRange];
        }

        if (showLeftDots && showRightDots) {
            const middleRange = range(leftSiblingIndex, rightSiblingIndex);
            return [1, '...', ...middleRange, '...', totalPages];
        }

        return [];
    };

    const pages = getPageNumbers();

    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {pages.map((page, index) => {
                if (page === '...') {
                    return (
                        <span key={`dots-${index}`} className="px-3 py-2">
                            ...
                        </span>
                    );
                }

                const pageNumber = page as number;
                return (
                    <button
                        key={pageNumber}
                        onClick={() => onPageChange(pageNumber)}
                        className={`px-4 py-2 rounded-lg transition-colors ${currentPage === pageNumber
                                ? 'bg-[var(--primary)] text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        {pageNumber}
                    </button>
                );
            })}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};

export default Pagination;
