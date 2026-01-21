import React from 'react';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false, onClick }) => {
    const baseClasses = 'bg-white rounded-lg shadow-md border border-gray-200 p-6';
    const hoverClasses = hover ? 'transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer' : '';

    return (
        <div
            className={`${baseClasses} ${hoverClasses} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;
