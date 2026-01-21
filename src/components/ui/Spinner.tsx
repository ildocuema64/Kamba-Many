import React from 'react';

export interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
    };

    return (
        <div
            className={`loading-spinner ${sizeClasses[size]} ${className}`}
            role="status"
            aria-label="Carregando..."
        >
            <span className="sr-only">Carregando...</span>
        </div>
    );
};

export default Spinner;
