import React from 'react';
import StatusMessage from '../../ui/StatusMessage';
import { motion } from 'framer-motion';
import "@material/web/button/filled-button.js";
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/icon/icon.js";

const DeleteEntryPage = ({ statusMessage, setStatusMessage, onClose, entries, onSuccess }) => {

    const handleDelete = async () => {
        const codesToDelete = entries.map(entry => entry.code);
        const endpoint = codesToDelete.length > 1 ? '/api/entries/delete' : `/api/entry/${codesToDelete[0]}`;
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
            setStatusMessage('Could not delete entries.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleDelete();
    };

    const entryCount = entries.length;
    const title = entryCount > 1 ? 'Delete Entries' : 'Delete Entry';

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
                    {entryCount > 1 
                        ? `Are you sure you want to delete ${entryCount} entries? `
                        : `Are you sure you want to delete 1 entry? `
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

export default DeleteEntryPage;
