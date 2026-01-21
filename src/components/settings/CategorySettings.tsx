'use client';

import React, { useEffect, useState } from 'react';
import { useCategoryStore } from '@/store/categoryStore';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Table } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Layers, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Category } from '@/types';
import { useDataRefresh } from '@/hooks/useDataRefresh';

const CategorySettings: React.FC = () => {
    const { categories, isLoading, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategoryStore();
    const { user } = useAuthStore();
    const toast = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const refreshKey = useDataRefresh();

    useEffect(() => {
        if (user?.organization_id) {
            fetchCategories(user.organization_id);
        }
    }, [user?.organization_id, fetchCategories, refreshKey]);

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || ''
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.organization_id) return;

        const normalizedName = formData.name.trim();

        if (!normalizedName) {
            toast.error('Erro', 'O nome da categoria é obrigatório.');
            return;
        }

        // Check for duplicate names
        const isDuplicate = categories.some(cat =>
            cat.name.toLowerCase() === normalizedName.toLowerCase() &&
            cat.id !== editingCategory?.id
        );

        if (isDuplicate) {
            toast.error('Erro', 'Já existe uma categoria com este nome.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Artificial delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));

            if (editingCategory) {
                await updateCategory(editingCategory.id, {
                    name: normalizedName,
                    description: formData.description.trim()
                });
                toast.success('Sucesso', 'Categoria atualizada com sucesso.');
            } else {
                await createCategory({
                    organization_id: user.organization_id,
                    name: normalizedName,
                    description: formData.description.trim(),
                    is_active: true
                });
                toast.success('Sucesso', 'Categoria criada com sucesso.');
            }
            handleCloseModal();
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Ocorreu um erro ao salvar a categoria.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (category: Category) => {
        if (!confirm(`Tem certeza que deseja eliminar a categoria "${category.name}"?`)) return;

        try {
            await deleteCategory(category.id);
            toast.success('Sucesso', 'Categoria eliminada com sucesso.');
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Não foi possível eliminar a categoria.');
        }
    };

    const columns = [
        {
            header: 'Nome',
            key: 'name',
            render: (category: Category) => (
                <div className="font-medium text-gray-900">{category.name}</div>
            )
        },
        {
            header: 'Descrição',
            key: 'description',
            render: (category: Category) => (
                <span className="text-gray-500 text-sm truncate max-w-xs block">
                    {category.description || '-'}
                </span>
            )
        },
        {
            header: 'Ações',
            key: 'actions',
            render: (category: Category) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleOpenModal(category)}
                        className="p-1 hover:bg-gray-100 rounded text-blue-600 transition-colors"
                        title="Editar"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => handleDelete(category)}
                        className="p-1 hover:bg-gray-100 rounded text-red-600 transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-gray-400" />
                        <h2 className="text-lg font-semibold text-gray-900">Categorias de Produtos</h2>
                    </div>
                    <Button onClick={() => handleOpenModal()} size="sm">
                        <Plus size={18} className="mr-1" />
                        Nova Categoria
                    </Button>
                </div>

                <div className="space-y-4">
                    <Table
                        columns={columns}
                        data={categories}
                        loading={isLoading}
                        emptyState={{
                            title: "Nenhuma categoria encontrada",
                            description: "Crie categorias para organizar seus produtos.",
                            actionLabel: "Criar Categoria",
                            onAction: () => handleOpenModal()
                        }}
                    />
                </div>
            </Card>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <Input
                                label="Nome da Categoria"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Ex: Bebidas, Comida, Serviços..."
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição (Opcional)
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Descrição breve da categoria..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={isSubmitting}
                                >
                                    {editingCategory ? 'Guardar' : 'Criar'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default CategorySettings;
