import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";

const EntryItem = ({
    entry,
    isSelected,
    onToggleSelect,
    onEditClick,
    onCopyClick,
    onQRCodeClick,
    onDeleteClick
}) => {
    const navigate = useNavigate();

    return (
        <motion.div
            key={entry.code}
            whileHover={{ boxShadow: "inset 0 0 0 2px var(--theme-primary)" }}
            className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer transition-colors ${
                isSelected
                    ? 'bg-[var(--theme-highlight)] border-[var(--theme-primary)]'
                    : 'border-[var(--theme-outline)]'
            }`}
            onClick={() => onToggleSelect(entry.code)}
        >
            <div className="flex items-center gap-4">
                <div onClick={(e) => e.stopPropagation()}>
                    <md-icon-button onClick={() => onToggleSelect(entry.code)}>
                        <md-icon>{isSelected ? 'check_box' : 'check_box_outline_blank'}</md-icon>
                    </md-icon-button>
                </div>
                <div>
                    <p className="font-semibold text-lg">{entry.name}</p>
                </div>
            </div>

            <div onClick={(e) => e.stopPropagation()} className="flex gap-2 items-center">
                <md-icon-button onClick={() => navigate(`/entries/${entry.code}`)}>
                    <md-icon>account_circle</md-icon>
                </md-icon-button>
                <md-icon-button onClick={() => onEditClick(entry)}>
                    <md-icon>edit</md-icon>
                </md-icon-button>
                <md-icon-button onClick={() => onCopyClick(entry)}>
                    <md-icon>content_copy</md-icon>
                </md-icon-button>
                <md-icon-button onClick={() => onQRCodeClick(entry)}>
                    <md-icon>qr_code_2</md-icon>
                </md-icon-button>
                <md-icon-button onClick={() => onDeleteClick(entry)}>
                    <md-icon>delete</md-icon>
                </md-icon-button>
            </div>
        </motion.div>
    );
};

export default EntryItem;
