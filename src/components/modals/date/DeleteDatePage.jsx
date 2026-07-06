import React, { useState, useRef, useEffect } from 'react';
import StatusMessage from '../../ui/StatusMessage';
import { motion } from 'framer-motion';
import "@material/web/button/filled-button.js";
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/icon/icon.js";
import "@material/web/textfield/outlined-text-field.js";

const DeleteDatePage = ({ statusMessage, setStatusMessage, onClose, dates, onSuccess }) => {
    const [confirmationText, setConfirmationText] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 100);
    }, []);

    const handleDelete = async () => {
        if (confirmationText !== "I understand") {
            setStatusMessage("Try again!");
            return;
        }

        const datesToDelete = dates.map(date => date);
        const endpoint = datesToDelete.length > 1 ? '/api/scans/dates/delete' : `/api/scans/date/${datesToDelete[0]}`;
        const method = datesToDelete.length > 1 ? 'POST' : 'DELETE';
        const body = datesToDelete.length > 1 ? JSON.stringify({ dates: datesToDelete }) : null;

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
            setStatusMessage('Could not delete scans.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleDelete();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    const dateCount = dates.length;
    const title = dateCount > 1 ? 'Delete Dates' : 'Delete Date';

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
            <p className="text-lg text-[var(--theme-text)] opacity-75 text-center mb-8 max-w-md">
                <span>
                    <strong className="font-bold">WARNING:</strong> You are about to delete <strong className="font-bold">ALL</strong> recorded scans across {dateCount} {dateCount > 1 ? 'dates' : 'date'}. This action is <strong className="font-bold">PERMANENT</strong> and <strong className="font-bold">CANNOT</strong> be undone! If you wish to proceed, please type "I understand" in the box below.
                </span>
            </p>
            <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-6" noValidate>
                <md-outlined-text-field
                    ref={inputRef}
                    class="w-full"
                    placeholder="Type here"
                    value={confirmationText}
                    onInput={(e) => setConfirmationText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    required
                ></md-outlined-text-field>
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

export default DeleteDatePage;
