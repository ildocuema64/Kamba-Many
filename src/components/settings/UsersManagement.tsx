'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Users, UserPlus, Edit2, Trash2, Save, X, Shield, Eye, EyeOff } from 'lucide-react';
import db from '@/lib/db/sqlite';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import {
    type UserRole,
    ROLE_LABELS,
    ROLE_COLORS,
    isAdminRole
} from '@/lib/auth/permissions';

interface DbUser {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    is_active: number;
    created_at: string;
    last_login: string | null;
}

interface UserFormData {
    id?: string;
    email: string;
    full_name: string;
    role: UserRole;
    password: string;
    confirmPassword: string;
}

const emptyFormData: UserFormData = {
    email: '',
    full_name: '',
    role: 'CASHIER',
    password: '',
    confirmPassword: '',
};

/**
 * Hash de password usando SHA-256
 */
function hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
}

const UsersManagement: React.FC = () => {
    const toast = useToast();
    const { user: currentUser } = useAuthStore();
    const { isAdmin, isSuperAdmin, canDelete } = usePermissions();

    const [users, setUsers] = useState<DbUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<DbUser | null>(null);
    const [formData, setFormData] = useState<UserFormData>(emptyFormData);
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Carregar utilizadores
    const loadUsers = async () => {
        if (!currentUser?.organization_id) return;

        setIsLoading(true);
        try {
            const result = db.query<DbUser>(
                `SELECT id, email, full_name, role, is_active, created_at, last_login 
                 FROM users 
                 WHERE organization_id = ?
                 ORDER BY created_at DESC`,
                [currentUser.organization_id]
            );
            setUsers(result);
        } catch (error) {
            console.error('Erro ao carregar utilizadores:', error);
            toast.error('Erro', 'Não foi possível carregar os utilizadores.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [currentUser?.organization_id]);

    // Abrir modal para novo utilizador
    const handleNew = () => {
        setEditingUser(null);
        setFormData(emptyFormData);
        setErrors({});
        setIsModalOpen(true);
    };

    // Abrir modal para editar
    const handleEdit = (user: DbUser) => {
        setEditingUser(user);
        setFormData({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            password: '',
            confirmPassword: '',
        });
        setErrors({});
        setIsModalOpen(true);
    };

    // Alternar estado ativo
    const handleToggleActive = async (user: DbUser) => {
        // Não pode desativar a si mesmo
        if (user.id === currentUser?.id) {
            toast.error('Erro', 'Não pode desactivar a sua própria conta.');
            return;
        }

        try {
            const newStatus = user.is_active === 1 ? 0 : 1;
            db.run(
                `UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE id = ?`,
                [newStatus, user.id]
            );
            await loadUsers();
            toast.success('Sucesso', `Utilizador ${newStatus ? 'activado' : 'desactivado'} com sucesso.`);
        } catch (error) {
            console.error('Erro ao alterar estado:', error);
            toast.error('Erro', 'Não foi possível alterar o estado do utilizador.');
        }
    };

    // Eliminar utilizador
    const handleDelete = async (user: DbUser) => {
        // Não pode eliminar a si mesmo
        if (user.id === currentUser?.id) {
            toast.error('Erro', 'Não pode eliminar a sua própria conta.');
            return;
        }

        if (!confirm(`Tem certeza que deseja eliminar o utilizador "${user.full_name}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            db.run(`DELETE FROM users WHERE id = ?`, [user.id]);
            await loadUsers();
            toast.success('Sucesso', 'Utilizador eliminado com sucesso.');
        } catch (error) {
            console.error('Erro ao eliminar:', error);
            toast.error('Erro', 'Não foi possível eliminar o utilizador.');
        }
    };

    // Validar formulário
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!formData.full_name) {
            newErrors.full_name = 'Nome é obrigatório';
        }

        // Password obrigatória para novo utilizador
        if (!editingUser) {
            if (!formData.password) {
                newErrors.password = 'Password é obrigatória';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Password deve ter pelo menos 6 caracteres';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords não coincidem';
            }
        } else if (formData.password) {
            // Se está a editar e preencheu password, validar
            if (formData.password.length < 6) {
                newErrors.password = 'Password deve ter pelo menos 6 caracteres';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords não coincidem';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Guardar utilizador
    const handleSave = async () => {
        if (!validateForm() || !currentUser?.organization_id) return;

        setIsSaving(true);
        try {
            if (editingUser) {
                // Atualizar existente
                let sql = `UPDATE users SET full_name = ?, email = ?, role = ?, updated_at = datetime('now')`;
                const params: any[] = [formData.full_name, formData.email, formData.role];

                if (formData.password) {
                    sql += `, password_hash = ?`;
                    params.push(hashPassword(formData.password));
                }

                sql += ` WHERE id = ?`;
                params.push(editingUser.id);

                db.run(sql, params);
                toast.success('Sucesso', 'Utilizador actualizado com sucesso.');
            } else {
                // Criar novo
                const id = uuidv4();
                db.run(`
                    INSERT INTO users (id, organization_id, email, password_hash, full_name, role, is_active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
                `, [
                    id,
                    currentUser.organization_id,
                    formData.email,
                    hashPassword(formData.password),
                    formData.full_name,
                    formData.role,
                ]);
                toast.success('Sucesso', 'Utilizador criado com sucesso.');
            }

            setIsModalOpen(false);
            await loadUsers();
        } catch (error: any) {
            console.error('Erro ao guardar:', error);
            if (error.message?.includes('UNIQUE')) {
                toast.error('Erro', 'Já existe um utilizador com este email.');
            } else {
                toast.error('Erro', 'Não foi possível guardar o utilizador.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Roles disponíveis (SUPERADMIN só pode ser criado por outro SUPERADMIN)
    const availableRoles: UserRole[] = isSuperAdmin
        ? ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'VIEWER']
        : ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'];

    // Filter users: Hide SUPERADMIN from non-SuperAdmins
    const visibleUsers = users.filter(u => isSuperAdmin || u.role !== 'SUPERADMIN');

    if (!isAdmin) {
        return (
            <Card>
                <div className="text-center py-8">
                    <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Acesso Restrito</h3>
                    <p className="text-gray-500">Apenas administradores podem gerir utilizadores.</p>
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-400" />
                        <h2 className="text-lg font-semibold text-gray-900">Gestão de Utilizadores</h2>
                    </div>
                    <Button variant="primary" onClick={handleNew}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Novo Utilizador
                    </Button>
                </div>

                {/* Lista de Utilizadores */}
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : visibleUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Nenhum utilizador encontrado.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nome</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Estado</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleUsers.map((user) => {
                                    const colors = ROLE_COLORS[user.role] || ROLE_COLORS.VIEWER;
                                    const isCurrentUser = user.id === currentUser?.id;

                                    return (
                                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                        {user.full_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user.full_name}</p>
                                                        {isCurrentUser && (
                                                            <span className="text-xs text-blue-600">(Você)</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">{user.email}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
                                                    {ROLE_LABELS[user.role]}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {!isCurrentUser && (
                                                        <>
                                                            <button
                                                                onClick={() => handleToggleActive(user)}
                                                                className={`p-2 rounded-lg transition-colors ${user.is_active
                                                                    ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                                                                    : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                                                                    }`}
                                                                title={user.is_active ? 'Desactivar' : 'Activar'}
                                                            >
                                                                {user.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                            {canDelete('users') && (
                                                                <button
                                                                    onClick={() => handleDelete(user)}
                                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal de Criação/Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-4 space-y-4">
                            <Input
                                label="Nome Completo"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                error={errors.full_name}
                                placeholder="Nome do utilizador"
                            />

                            <Input
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                error={errors.email}
                                placeholder="email@exemplo.com"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Perfil/Role
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {availableRoles.map((role) => (
                                        <option key={role} value={role}>
                                            {ROLE_LABELS[role]}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Input
                                label={editingUser ? "Nova Password (deixe vazio para manter)" : "Password"}
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                error={errors.password}
                                placeholder="••••••••"
                            />

                            <Input
                                label="Confirmar Password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                error={errors.confirmPassword}
                                placeholder="••••••••"
                            />

                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={showPassword}
                                    onChange={() => setShowPassword(!showPassword)}
                                    className="rounded"
                                />
                                Mostrar password
                            </label>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50 rounded-b-xl">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                Guardar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UsersManagement;
