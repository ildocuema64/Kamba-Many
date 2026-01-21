'use client';

import React, { useEffect, useState, useCallback } from 'react';
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

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    speedX: number;
    speedY: number;
    rotation: number;
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
    const [particles, setParticles] = useState<Particle[]>([]);
    const [showContent, setShowContent] = useState(false);

    const colors = ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#fbbf24', '#34d399'];

    const generateParticles = useCallback(() => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < 50; i++) {
            newParticles.push({
                id: i,
                x: 50 + (Math.random() - 0.5) * 20,
                y: 40,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 10 + 4,
                speedX: (Math.random() - 0.5) * 15,
                speedY: Math.random() * -12 - 4,
                rotation: Math.random() * 360
            });
        }
        setParticles(newParticles);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => setShowContent(true), 50);
            setTimeout(() => generateParticles(), 300);
        } else {
            setShowContent(false);
            setParticles([]);
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, generateParticles]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop with blur effect */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Confetti Particles */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {particles.map((particle) => (
                    <div
                        key={particle.id}
                        className="absolute animate-confetti"
                        style={{
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                            width: `${particle.size}px`,
                            height: `${particle.size}px`,
                            backgroundColor: particle.color,
                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                            transform: `rotate(${particle.rotation}deg)`,
                            '--tx': `${particle.speedX * 20}px`,
                            '--ty': `${particle.speedY * 30}px`,
                        } as React.CSSProperties}
                    />
                ))}
            </div>

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className={`relative w-full max-w-md transform transition-all duration-500 ease-out ${showContent
                            ? 'scale-100 opacity-100 translate-y-0'
                            : 'scale-90 opacity-0 translate-y-8'
                        }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Gradient glow effect behind modal */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 rounded-2xl blur-lg opacity-30 animate-pulse-slow" />

                    {/* Modal content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Top gradient accent */}
                        <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400" />

                        <div className="flex flex-col items-center text-center p-8">
                            {/* Animated Success Icon with ring effect */}
                            <div className="relative mb-6">
                                {/* Pulsing ring */}
                                <div className="absolute inset-0 w-24 h-24 rounded-full bg-green-400/20 animate-ping-slow" />

                                {/* Icon container with gradient */}
                                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                                    {/* Animated checkmark */}
                                    <svg
                                        className="w-12 h-12 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            className="animate-draw-check"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                            style={{
                                                strokeDasharray: 24,
                                                strokeDashoffset: 24,
                                            }}
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Title with gradient text */}
                            <h3 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-3">
                                {title}
                            </h3>

                            {/* Message */}
                            <p className="text-gray-500 mb-8 max-w-xs leading-relaxed">
                                {message}
                            </p>

                            {/* Action buttons */}
                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={onAction}
                                    className="group relative w-full py-3.5 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                                >
                                    {/* Button shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                    <span className="relative flex items-center justify-center gap-2">
                                        {actionLabel}
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                </button>

                                {showSecondaryAction && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={onSecondaryAction || onClose}
                                        className="w-full justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 py-3 rounded-xl transition-all duration-200"
                                    >
                                        {secondaryActionLabel}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global styles for animations */}
            <style jsx>{`
                @keyframes draw-check {
                    to {
                        stroke-dashoffset: 0;
                    }
                }
                
                @keyframes ping-slow {
                    0% {
                        transform: scale(1);
                        opacity: 0.3;
                    }
                    50% {
                        transform: scale(1.3);
                        opacity: 0;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 0.3;
                    }
                }
                
                @keyframes pulse-slow {
                    0%, 100% {
                        opacity: 0.3;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
                
                @keyframes confetti {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(400px) translateX(var(--tx)) rotate(720deg);
                        opacity: 0;
                    }
                }
                
                .animate-draw-check {
                    animation: draw-check 0.5s ease-out 0.3s forwards;
                }
                
                .animate-ping-slow {
                    animation: ping-slow 2s ease-in-out infinite;
                }
                
                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }
                
                .animate-confetti {
                    animation: confetti 2.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default SuccessModal;
