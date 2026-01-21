import React from 'react';

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                )}
                <input
                    type="date"
                    ref={ref}
                    className={`
                        w-full px-4 py-2 border rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent 
                        transition-all bg-white
                        ${error ? 'border-red-500' : 'border-gray-300'}
                        ${className}
                    `}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
            </div>
        );
    }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;
