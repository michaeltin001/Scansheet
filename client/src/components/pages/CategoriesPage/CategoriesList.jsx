import React from 'react';
import CategoryItem from './CategoryItem';
import CategoryItemGeneral from './CategoryItemGeneral';

const CategoriesList = ({
    allCategories,
    selectedCategories,
    onToggleSelect,
    onEditClick,
    onDeleteClick,
    totalCategories
}) => {
    const generalCategory = allCategories.find(c => c.name === 'General');
    const otherCategories = allCategories.filter(c => c.name !== 'General');

    return (
        <div className="flex flex-col gap-4">
            {generalCategory && <CategoryItemGeneral category={generalCategory} />}
            {otherCategories.map((category) => {
                const isSelected = selectedCategories.has(category.code);
                return (
                    <CategoryItem
                        key={category.code}
                        category={category}
                        isSelected={isSelected}
                        onToggleSelect={onToggleSelect}
                        onEditClick={onEditClick}
                        onDeleteClick={onDeleteClick}
                    />
                );
            })}
            {totalCategories === 0 && (
                <p className="text-center p-8 text-[var(--theme-text)] opacity-70">No categories found.</p>
            )}
        </div>
    );
};

export default CategoriesList;
