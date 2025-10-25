import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";

const DateItem = ({
    dateString,
    isSelected,
    onToggleSelect,
    onDeleteClick,
    formatDate
}) => {
    const navigate = useNavigate();
    const date = new Date(dateString);
    const formattedDate = formatDate(date);

    return (
        <motion.div
            key={dateString}
            whileHover={{ boxShadow: "inset 0 0 0 2px var(--theme-primary)" }}
            className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer transition-colors ${
                isSelected
                    ? 'bg-[var(--theme-highlight)] border-[var(--theme-primary)]'
                    : 'border-[var(--theme-outline)]'
            }`}
            onClick={() => onToggleSelect(dateString)}
        >
            <div className="flex items-center gap-4">
                <div onClick={(e) => e.stopPropagation()}>
                    <md-icon-button onClick={() => onToggleSelect(dateString)}>
                        <md-icon>{isSelected ? 'check_box' : 'check_box_outline_blank'}</md-icon>
                    </md-icon-button>
                </div>
                <div>
                    <p className="font-semibold text-lg font-tabular-nums">{formattedDate}</p>
                </div>
            </div>

            <div onClick={(e) => e.stopPropagation()} className="flex gap-2 items-center">
                <md-icon-button onClick={() => navigate(`/dates/${dateString}`, { state: { from: '/dates' } })}>
                    <md-icon>calendar_today</md-icon>
                </md-icon-button>
                <md-icon-button onClick={() => onDeleteClick(dateString)}>
                    <md-icon>delete</md-icon>
                </md-icon-button>
            </div>
        </motion.div>
    );
};

export default DateItem;
