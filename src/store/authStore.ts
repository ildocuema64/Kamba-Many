import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'superadmin' | 'admin' | 'vendedor';
    organization_id?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,

            login: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    // Small delay for UX
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // 1. Try to find user in DB
                    const importDb = (await import('@/lib/db/sqlite')).default;

                    const dbUser = importDb.queryOne<{
                        id: string;
                        email: string;
                        full_name: string;
                        role: string;
                        password_hash: string;
                        organization_id: string;
                    }>(`SELECT * FROM users WHERE email = ?`, [email]);

                    if (dbUser) {
                        // 2. Validate password
                        // STRICT CHECK: Password must match DB hash exactly.
                        // We removed the legacy || clause to prevent old passwords from working.
                        const isValid = dbUser.password_hash === password;

                        if (isValid) {
                            const user: User = {
                                id: dbUser.id,
                                email: dbUser.email,
                                name: dbUser.full_name,
                                role: dbUser.role.toLowerCase() as any, // Map back to store type
                                organization_id: dbUser.organization_id,
                            };
                            set({ user, isAuthenticated: true, isLoading: false });
                            return;
                        } else {
                            // If user exists but password denies, FAIL here. 
                            // Do not fall through to legacy check.
                            throw new Error('Credenciais inválidas');
                        }
                    }

                    // 3. Fallback for initialization (if DB is empty or user not found)
                    if (email === 'ildocuema@gmail.com' && password === 'Ildo7..Marques') {
                        const user: User = {
                            id: '1',
                            email,
                            name: 'Super Admin',
                            role: 'superadmin',
                            organization_id: 'default-org-001',
                        };

                        // Auto-seed if not exists (Lazy seeding)
                        try {
                            importDb.run(`
                                INSERT OR IGNORE INTO users (id, organization_id, email, password_hash, full_name, role, created_at, updated_at)
                                VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                            `, [
                                user.id,
                                user.organization_id!,
                                user.email,
                                password, // Persist current password
                                user.name,
                                'SUPERADMIN'
                            ]);
                        } catch (e) {
                            console.warn('Auto-seed failed', e);
                        }

                        set({ user, isAuthenticated: true, isLoading: false });
                        return;
                    }

                    throw new Error('Credenciais inválidas');
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: () => {
                set({ user: null, isAuthenticated: false });
            },

            setUser: (user) => {
                set({ user, isAuthenticated: !!user });
            },

            setLoading: (isLoading) => {
                set({ isLoading });
            },
        }),
        {
            name: 'pos-angola-auth',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
