import React, { useEffect } from 'react';
import { useCategoryStore } from '@/store/categoryStore';
import Select, { SelectProps } from '@/components/ui/Select';
import { useAuthStore } from '@/store/authStore';

interface CategorySelectorProps extends Omit<SelectProps, 'options'> { }

const CategorySelector: React.FC<CategorySelectorProps> = (props) => {
    const { categories, fetchCategories, isLoading } = useCategoryStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (user?.organization_id && categories.length === 0) {
            fetchCategories(user.organization_id);
        }
    }, [user?.organization_id, categories.length, fetchCategories]);

    const options = [
        { value: '', label: 'Sem Categoria' },
        ...categories.map(c => ({ value: c.id, label: c.name }))
    ];

    return (
        <Select
            options={options}
            disabled={isLoading}
            {...props}
        />
    );
};

export default CategorySelector;
