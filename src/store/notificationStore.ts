import { create } from 'zustand';
import { NotificationRepository, NotificationEntity } from '@/lib/db/repositories/NotificationRepository';
import { useAuthStore } from './authStore';

export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    createdAt: Date;
    read: boolean;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
}

interface NotificationActions {
    fetchNotifications: () => Promise<void>;
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    removeNotification: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            const user = useAuthStore.getState().user;
            const entities = await NotificationRepository.getByUser(user?.id);
            const unreadCount = await NotificationRepository.getUnreadCount(user?.id);

            const notifications: Notification[] = entities.map(entity => ({
                id: entity.id,
                title: entity.title,
                message: entity.message,
                type: entity.type,
                createdAt: new Date(entity.created_at),
                read: entity.is_read === 1
            }));

            set({ notifications, unreadCount, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            set({ isLoading: false });
        }
    },

    addNotification: async (notification) => {
        try {
            const user = useAuthStore.getState().user;
            const entity = await NotificationRepository.create({
                title: notification.title,
                message: notification.message,
                type: notification.type,
                user_id: user?.id || '',
                organization_id: user?.organization_id || ''
            });

            const newNotification: Notification = {
                id: entity.id,
                title: entity.title,
                message: entity.message,
                type: entity.type,
                createdAt: new Date(entity.created_at),
                read: false,
            };

            set((state) => ({
                notifications: [newNotification, ...state.notifications],
                unreadCount: state.unreadCount + 1,
            }));
        } catch (error) {
            console.error('Failed to add notification:', error);
        }
    },

    markAsRead: async (id) => {
        try {
            await NotificationRepository.markAsRead(id);
            set((state) => {
                const notification = state.notifications.find(n => n.id === id);
                if (!notification || notification.read) return state;

                return {
                    notifications: state.notifications.map(n =>
                        n.id === id ? { ...n, read: true } : n
                    ),
                    unreadCount: Math.max(0, state.unreadCount - 1),
                };
            });
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    },

    markAllAsRead: async () => {
        try {
            const user = useAuthStore.getState().user;
            await NotificationRepository.markAllAsRead(user?.id);
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, read: true })),
                unreadCount: 0,
            }));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    },

    removeNotification: async (id) => {
        try {
            await NotificationRepository.delete(id);
            set((state) => {
                const notification = state.notifications.find(n => n.id === id);
                const wasUnread = notification && !notification.read;

                return {
                    notifications: state.notifications.filter(n => n.id !== id),
                    unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
                };
            });
        } catch (error) {
            console.error('Failed to remove notification:', error);
        }
    },

    clearAll: async () => {
        try {
            const user = useAuthStore.getState().user;
            await NotificationRepository.clearAll(user?.id);
            set({ notifications: [], unreadCount: 0 });
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    },
}));
