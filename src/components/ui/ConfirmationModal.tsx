import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    isLoading = false,
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (variant) {
            case 'danger':
                return <AlertTriangle className="w-12 h-12 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
            default:
                return <AlertTriangle className="w-12 h-12 text-blue-500" />;
        }
    };

    const getHeaderColor = () => {
        switch (variant) {
            case 'danger':
                return 'bg-red-50 text-red-900';
            case 'warning':
                return 'bg-yellow-50 text-yellow-900';
            default:
                return 'bg-blue-50 text-blue-900';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-6 py-4 flex items-center justify-between ${getHeaderColor()}`}>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-black/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                        <div className={`p-3 rounded-full ${variant === 'danger' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                            {getIcon()}
                        </div>
                    </div>
                    <p className="text-gray-600 text-base leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex gap-3 justify-end">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
