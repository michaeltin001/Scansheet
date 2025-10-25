import React from 'react';
import { motion } from 'framer-motion';
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";

const DateScanItem = ({
    scan,
    formatDate,
    formatTime24Hour,
    onEditClick,
    onDeleteClick
}) => {
    const scanDate = new Date(scan.date);
    const formattedScanDate = formatDate(scanDate);
    const formattedTime = formatTime24Hour(scanDate);

    return (
        <motion.div
            key={scan.date}
            whileHover={{ boxShadow: "inset 0 0 0 2px var(--theme-primary)" }}
            className="border border-[var(--theme-outline)] rounded-lg p-4 flex justify-between items-center"
        >
            <div>
                <p className="opacity-70 text-xs">Category: {scan.category_name}</p>
                <p className="font-semibold text-lg">{scan.entry_name}</p>
                <p className="font-semibold text-lg font-tabular-nums">{`${formattedScanDate} at ${formattedTime}`}</p>
            </div>
            <div onClick={(e) => e.stopPropagation()} className="flex gap-2 items-center">
                <md-icon-button onClick={() => onEditClick(scan)}>
                    <md-icon>edit</md-icon>
                </md-icon-button>
                <md-icon-button onClick={() => onDeleteClick(scan)}>
                    <md-icon>delete</md-icon>
                </md-icon-button>
            </div>
        </motion.div>
    );
};

export default DateScanItem;
