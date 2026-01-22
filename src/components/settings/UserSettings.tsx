'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { User, Save, Lock } from 'lucide-react';
import db from '@/lib/db/sqlite';
import { useDataRefresh } from '@/hooks/useDataRefresh';

const UserSettings: React.FC = () => {
    const toast = useToast();
    const { user, setUser } = useAuthStore();
    const refreshKey = useDataRefresh();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load user data from DB
    React.useEffect(() => {
        if (!user?.id) return;

        try {
            const dbUser = db.queryOne<{ full_name: string; email: string }>(
                `SELECT full_name, email FROM users WHERE id = ?`,
                [user.id]
            );

            if (dbUser) {
                setFormData(prev => ({
                    ...prev,
                    fullName: dbUser.full_name,
                    email: dbUser.email
                }));
            } else {
                // Initial state from authStore if not in DB yet
                setFormData(prev => ({
                    ...prev,
                    fullName: user.name,
                    email: user.email
                }));
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }
    }, [user?.id, refreshKey, user?.name, user?.email]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validatePassword = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (formData.newPassword || formData.confirmPassword) {
            // In a real app we'd verify currentPassword hash
            if (!formData.currentPassword) {
                newErrors.currentPassword = 'Password actual é obrigatória';
            }
            if (formData.newPassword.length < 6) {
                newErrors.newPassword = 'Password deve ter pelo menos 6 caracteres';
            }
            if (formData.newPassword !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords não coincidem';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!user?.id) return;
        if (!validatePassword()) return;

        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            // Upsert Logic for User
            const existingUser = db.queryOne<{ id: string }>(`SELECT id FROM users WHERE id = ?`, [user.id]);

            if (!existingUser) {
                // Create if missing
                db.run(`
                    INSERT INTO users (id, organization_id, email, password_hash, full_name, role, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                `, [
                    user.id,
                    user.organization_id || 'default-org-001',
                    formData.email,
                    formData.newPassword || 'Ildo7..Marques', // Default known password if created now
                    formData.fullName,
                    (user.role as string) === 'vendedor' ? 'CASHIER' : user.role.toUpperCase() // Fix CHECK constraint
                ]);
            } else {
                // Update
                let sql = `UPDATE users SET full_name = ?, email = ?, updated_at = datetime('now')`;
                const params = [formData.fullName, formData.email];

                if (formData.newPassword) {
                    sql += `, password_hash = ?`;
                    params.push(formData.newPassword); // In real app, hash this!
                }

                sql += ` WHERE id = ?`;
                params.push(user.id);

                db.run(sql, params);
            }

            // Update AuthStore to reflect changes in UI immediately
            setUser({
                ...user,
                name: formData.fullName,
                email: formData.email
            });

            toast.success('Perfil Actualizado', 'As suas informações foram guardadas com sucesso.');
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error('Erro', 'Não foi possível actualizar o perfil.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Perfil do Utilizador</h2>
            </div>

            <div className="space-y-6">
                {/* Profile Info */}
                <div className="space-y-4">
                    <Input
                        label="Nome Completo"
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        placeholder="O seu nome completo"
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="email@exemplo.com"
                    />
                </div>

                {/* Password Change */}
                <div className="border-t pt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock className="w-4 h-4 text-gray-400" />
                        <h3 className="font-medium text-gray-900">Alterar Password</h3>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Password Actual"
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => handleChange('currentPassword', e.target.value)}
                            error={errors.currentPassword}
                            placeholder="••••••••"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nova Password"
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => handleChange('newPassword', e.target.value)}
                                error={errors.newPassword}
                                placeholder="••••••••"
                            />

                            <Input
                                label="Confirmar Password"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                error={errors.confirmPassword}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Alterações
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default UserSettings;
