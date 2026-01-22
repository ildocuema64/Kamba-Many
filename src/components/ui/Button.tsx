import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', isLoading = false, children, className = '', disabled, ...props }, ref) => {
        const baseClasses = 'font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed';

        const variantClasses = {
            primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] active:scale-95',
            secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
            outline: 'border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white',
            danger: 'bg-red-600 text-white hover:bg-red-700',
            success: 'bg-green-600 text-white hover:bg-green-700',
            ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        };

        const sizeClasses = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2',
            lg: 'px-6 py-3 text-lg',
        };

        const spinnerColorClass = {
            primary: 'border-white/30 border-t-white',
            secondary: 'border-gray-400/30 border-t-gray-600',
            outline: 'border-current/30 border-t-current',
            danger: 'border-white/30 border-t-white',
            success: 'border-white/30 border-t-white',
            ghost: 'border-gray-400/30 border-t-gray-600',
        };

        return (
            <button
                ref={ref}
                className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <div className={`mr-2 h-4 w-4 animate-spin rounded-full border-2 ${spinnerColorClass[variant]}`}></div>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
