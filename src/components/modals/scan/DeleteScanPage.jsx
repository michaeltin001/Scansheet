import React from 'react';
import StatusMessage from '../../ui/StatusMessage';
import { motion } from 'framer-motion';
import "@material/web/button/filled-button.js";
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/icon/icon.js";

const DeleteScanPage = ({ statusMessage, setStatusMessage, onClose, scanTimestamp, onSuccess }) => {

    const handleDelete = async () => {
        if (!scanTimestamp) {
            setStatusMessage("No scan selected.");
            return;
        }

        try {
            const response = await fetch(`/api/scan/${scanTimestamp}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            setStatusMessage(data.message || data.error);
            if (response.ok) onSuccess();
        } catch (error) {
            setStatusMessage('Could not delete scan.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleDelete();
    };

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
            <h1 className="text-3xl font-bold mb-6 text-center text-[var(--theme-text)]">Delete Scan</h1>
            <p className="text-lg text-[var(--theme-text)] opacity-75 text-center mb-8">
                <span>
                    Are you sure you want to delete this scan?
                </span>{" "}
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

export default DeleteScanPage;
