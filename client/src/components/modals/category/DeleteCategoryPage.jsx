import React from 'react';
import StatusMessage from '../../ui/StatusMessage';
import { motion } from 'framer-motion';
import "@material/web/button/filled-button.js";
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/icon/icon.js";

const DeleteCategoryPage = ({ statusMessage, setStatusMessage, onClose, categories, onSuccess }) => {

    const handleDelete = async () => {
        const codesToDelete = categories.map(category => category.code);
        const endpoint = codesToDelete.length > 1 ? '/api/categories/delete' : `/api/category/${codesToDelete[0]}`;
        const method = codesToDelete.length > 1 ? 'POST' : 'DELETE';
        const body = codesToDelete.length > 1 ? JSON.stringify({ codes: codesToDelete }) : null;

        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: body,
            });
            const data = await response.json();
            setStatusMessage(data.message);
            if (response.ok) onSuccess();
        } catch (error) {
            setStatusMessage('Could not delete categories.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleDelete();
    };

    const categoryCount = categories.length;
    const title = categoryCount > 1 ? 'Delete Categories' : 'Delete Category';

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

            <StatusMessage message={statusMessage} onDismiss={() => setStatusMessage("")} />
            <h1 className="text-3xl font-bold mb-6 text-center text-[var(--theme-text)]">{title}</h1>
            <p className="text-lg text-[var(--theme-text)] opacity-75 text-center mb-8">
                <span>
                    {categoryCount > 1
                        ? `Are you sure you want to delete ${categoryCount} categories? `
                        : `Are you sure you want to delete 1 category? `
                    }
                </span>
                <span className="font-semibold text-red-500">
                    This action cannot be undone.
                </span>
            </p>
            <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-6">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <md-filled-button
                        type="submit"
                        class="w-full"
                        style={{ '--md-sys-color-primary': '#ef4444' }}
                    >
                        Delete
                    </md-filled-button>
                </motion.div>
            </form>
        </div>
    );
};

export default DeleteCategoryPage;
