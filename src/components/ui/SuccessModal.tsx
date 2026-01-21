'use client';

import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    onAction: () => void;
    actionLabel?: string;
    showSecondaryAction?: boolean;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
    isOpen,
    onClose,
    title = 'Sucesso!',
    message,
    onAction,
    actionLabel = 'Continuar',
    showSecondaryAction = false,
    secondaryActionLabel = 'Cancelar',
    onSecondaryAction
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} size="sm">
            <div className="flex flex-col items-center text-center p-4">
                {/* Animated Success Icon */}
                <div className="w-20 h-20 mb-6 rounded-full bg-green-100 flex items-center justify-center animate-bounce-slow">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 mb-8 max-w-xs">{message}</p>

                <div className="flex flex-col gap-3 w-full">
                    <Button
                        type="button"
                        variant="primary"
                        onClick={onAction}
                        className="w-full justify-center text-lg py-3"
                    >
                        {actionLabel}
                    </Button>

                    {showSecondaryAction && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onSecondaryAction || onClose}
                            className="w-full justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        >
                            {secondaryActionLabel}
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default SuccessModal;
