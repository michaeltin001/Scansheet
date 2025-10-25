import React from 'react';
import { motion } from 'framer-motion';
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";

const CategoryItem = ({
    category,
    isSelected,
    onToggleSelect,
    onEditClick,
    onDeleteClick
}) => {
    return (
        <motion.div
            key={category.code}
            whileHover={{ boxShadow: "inset 0 0 0 2px var(--theme-primary)" }}
            className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer transition-colors ${
                isSelected
                    ? 'bg-[var(--theme-highlight)] border-[var(--theme-primary)]'
                    : 'border-[var(--theme-outline)]'
            }`}
            onClick={() => onToggleSelect(category.code)}
        >
            <div className="flex items-center gap-4">
                <div onClick={(e) => e.stopPropagation()}>
                    <md-icon-button onClick={() => onToggleSelect(category.code)}>
                        <md-icon>{isSelected ? 'check_box' : 'check_box_outline_blank'}</md-icon>
                    </md-icon-button>
                </div>
                <div>
                    <p className="font-semibold text-lg">{category.name}</p>
                </div>
            </div>

            <div onClick={(e) => e.stopPropagation()} className="flex gap-2 items-center">
                <md-icon-button onClick={() => onEditClick(category)}>
                    <md-icon>edit</md-icon>
                </md-icon-button>
                <md-icon-button onClick={() => onDeleteClick(category)}>
                    <md-icon>delete</md-icon>
                </md-icon-button>
            </div>
        </motion.div>
    );
};

export default CategoryItem;
