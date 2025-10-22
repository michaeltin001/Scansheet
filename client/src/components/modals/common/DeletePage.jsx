import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/icon/icon.js";

const DeletePage = ({
    title,
    onClose,
    onDeleteCurrent,
    onDeleteSelected
}) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                onDeleteCurrent();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onDeleteCurrent]);

    return (
        <div
            className="relative bg-[var(--theme-card-bg)] p-6 rounded-xl border border-[var(--theme-outline)] backdrop-blur-lg h-full flex flex-col items-center justify-center overflow-y-auto"
        >
            <div className="absolute top-6 right-6 z-10">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <md-outlined-icon-button onClick={onClose}>
                        <md-icon>close</md-icon>
                    </md-outlined-icon-button>
                </motion.div>
            </div>

            <h1 className="text-3xl font-bold mb-6 text-center text-[var(--theme-text)]">{title}</h1>
            <p className="text-lg text-[var(--theme-text)] opacity-75 text-center mb-8">
                Please choose a deletion option.
            </p>
            <div className="w-full max-w-sm flex flex-col gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <md-filled-button
                        onClick={onDeleteCurrent}
                        class="w-full"
                        style={{ '--md-sys-color-primary': '#ef4444' }}
                    >
                        Delete Selected on Current Page (Default)
                    </md-filled-button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <md-outlined-button
                        onClick={onDeleteSelected}
                        class="w-full"
                        style={{ '--md-sys-color-primary': '#ef4444', '--md-sys-color-outline': '#ef4444' }}
                    >
                        Delete Selected Across All Pages
                    </md-outlined-button>
                </motion.div>
            </div>
        </div>
    );
};

export default DeletePage;
