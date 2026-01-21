'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNotificationStore, NotificationType } from '@/store/notificationStore';

const NotificationBell: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();

    // Carregar notificações ao iniciar
    useEffect(() => {
        useNotificationStore.getState().fetchNotifications();

        // Opcional: Polling simples a cada 30 segundos
        const interval = setInterval(() => {
            useNotificationStore.getState().fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Função para formatar tempo relativo
    const formatRelativeTime = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `Há ${diffMins} min`;
        if (diffHours < 24) return `Há ${diffHours}h`;
        if (diffDays === 1) return 'Ontem';
        return `Há ${diffDays} dias`;
    };

    // Ícone baseado no tipo de notificação
    const getIcon = (type: NotificationType) => {
        const iconClass = 'w-5 h-5';
        switch (type) {
            case 'success':
                return <CheckCircle className={`${iconClass} text-green-500`} />;
            case 'warning':
                return <AlertTriangle className={`${iconClass} text-amber-500`} />;
            case 'error':
                return <AlertCircle className={`${iconClass} text-red-500`} />;
            default:
                return <Info className={`${iconClass} text-blue-500`} />;
        }
    };

    // Cor de fundo baseada no tipo
    const getBgColor = (type: NotificationType, read: boolean) => {
        if (read) return 'bg-gray-50';
        switch (type) {
            case 'success':
                return 'bg-green-50';
            case 'warning':
                return 'bg-amber-50';
            case 'error':
                return 'bg-red-50';
            default:
                return 'bg-blue-50';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                aria-label="Notificações"
            >
                <Bell className="w-6 h-6 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            <h3 className="font-semibold">Notificações</h3>
                            {unreadCount > 0 && (
                                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                                    {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Actions Bar */}
                    {notifications.length > 0 && unreadCount > 0 && (
                        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1.5 transition-colors"
                            >
                                <Check className="w-4 h-4" />
                                Marcar todas como lidas
                            </button>
                        </div>
                    )}

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-12 px-4 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Bell className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">Nenhuma notificação</p>
                                <p className="text-gray-400 text-sm mt-1">
                                    Você está em dia com tudo!
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`group relative px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50 ${getBgColor(notification.type, notification.read)}`}
                                >
                                    <div className="flex gap-3">
                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                                    {formatRelativeTime(notification.createdAt)}
                                                </span>
                                            </div>
                                            <p className={`text-sm mt-0.5 line-clamp-2 ${notification.read ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {notification.message}
                                            </p>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 transition-colors"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        Marcar como lida
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => removeNotification(notification.id)}
                                                    className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Remover
                                                </button>
                                            </div>
                                        </div>

                                        {/* Unread Indicator */}
                                        {!notification.read && (
                                            <div className="flex-shrink-0">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    // Aqui poderia navegar para uma página de todas as notificações
                                    setIsOpen(false);
                                }}
                                className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                            >
                                Ver todas as notificações
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
