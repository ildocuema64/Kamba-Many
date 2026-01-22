import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type UserRole, LEGACY_ROLE_MAP, normalizeRole } from '@/lib/auth/permissions';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
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
    requestPasswordReset: (email: string) => Promise<void>;
    resetPassword: (token: string, newPassword: string) => Promise<void>;
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
                        // 2. Validate password (suporta hash SHA-256 e texto plano para retrocompatibilidade)
                        const CryptoJS = (await import('crypto-js')).default;
                        const hashedInput = CryptoJS.SHA256(password).toString();
                        const isValid = dbUser.password_hash === hashedInput || dbUser.password_hash === password;

                        // Verifica também se o utilizador está ativo
                        const isActive = (dbUser as any).is_active !== 0;

                        if (!isActive) {
                            throw new Error('Conta desactivada. Contacte o administrador.');
                        }

                        if (isValid) {
                            const user: User = {
                                id: dbUser.id,
                                email: dbUser.email,
                                name: dbUser.full_name,
                                role: normalizeRole(dbUser.role), // Normaliza role do DB
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
                            role: 'SUPERADMIN',
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

            requestPasswordReset: async (email: string) => {
                set({ isLoading: true });
                try {
                    // Start simulation
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    const importDb = (await import('@/lib/db/sqlite')).default;

                    // 1. Check if user exists
                    const dbUser = importDb.queryOne<{ id: string }>(
                        `SELECT id FROM users WHERE email = ?`,
                        [email]
                    );

                    if (!dbUser) {
                        // Security: Do not reveal if user exists or not, just pretend success
                        // But for dev mode, we might want to log it
                        console.log(`Password reset requested for non-existent email: ${email}`);
                        set({ isLoading: false });
                        return;
                    }

                    // 2. Generate Token
                    const token = crypto.randomUUID();
                    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

                    // 3. Save to DB
                    importDb.run(`
                        INSERT INTO password_resets (id, user_id, email, expires_at)
                        VALUES (?, ?, ?, ?)
                    `, [token, dbUser.id, email, expiresAt]);

                    // 4. "Send" Email (Simulate by console log)
                    console.info(`
=========================================================
[SIMULATED EMAIL] Password Reset Request
To: ${email}
Link: http://localhost:3000/reset-password?token=${token}
Token: ${token}
=========================================================
                    `);

                    set({ isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    console.error('Reset password request error:', error);
                    throw error;
                }
            },

            resetPassword: async (token: string, newPassword: string) => {
                set({ isLoading: true });
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    const importDb = (await import('@/lib/db/sqlite')).default;

                    // 1. Find valid token
                    const resetRecord = importDb.queryOne<{ id: string; user_id: string; expires_at: string }>(
                        `SELECT * FROM password_resets WHERE id = ?`,
                        [token]
                    );

                    if (!resetRecord) {
                        throw new Error('Token inválido ou expirado');
                    }

                    const now = new Date().toISOString();
                    if (resetRecord.expires_at < now) {
                        throw new Error('Token expirado');
                    }

                    // 2. Hash new password
                    const CryptoJS = (await import('crypto-js')).default;
                    const passwordHash = CryptoJS.SHA256(newPassword).toString();

                    // 3. Update User Password
                    importDb.run(`
                        UPDATE users SET password_hash = ?, updated_at = datetime('now')
                        WHERE id = ?
                    `, [passwordHash, resetRecord.user_id]);

                    // 4. Consume Token (Delete it)
                    importDb.run(`DELETE FROM password_resets WHERE id = ?`, [token]);

                    // Clear any previous user state just in case
                    set({ user: null, isAuthenticated: false, isLoading: false });

                } catch (error) {
                    set({ isLoading: false });
                    console.error('Reset password error:', error);
                    throw error;
                }
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
