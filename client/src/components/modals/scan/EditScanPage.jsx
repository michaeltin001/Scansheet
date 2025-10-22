import React, { useState, useEffect, useRef } from 'react';
import StatusMessage from '../../ui/StatusMessage';
import { motion } from 'framer-motion';
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/button/filled-button.js";
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/icon/icon.js";

const EditScanPage = ({ statusMessage, setStatusMessage, onClose, scan, onUpdate }) => {
    const [scanDate, setScanDate] = useState('');
    const [scanTime, setScanTime] = useState('');
    const [maxTime, setMaxTime] = useState('');
    const dateInputRef = useRef(null);

    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    useEffect(() => {
        if (scan) {
            const date = new Date(scan.date);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            setScanDate(`${year}-${month}-${day}`);

            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            setScanTime(`${hours}:${minutes}:${seconds}`);
        }
    }, [scan]);

    useEffect(() => {
        if (scanDate === today) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            setMaxTime(`${hours}:${minutes}:${seconds}`);
        } else {
            setMaxTime('');
        }
    }, [scanDate, today]);

    useEffect(() => {
        setTimeout(() => {
            if (dateInputRef.current) {
                dateInputRef.current.focus();
            }
        }, 100);
    }, []);

    const handleUpdate = async () => {
        if (!scanDate || !scanTime) {
            setStatusMessage("Date and time cannot be empty.");
            return;
        }

        const selectedDateTime = new Date(`${scanDate}T${scanTime}`);
        if (selectedDateTime > new Date()) {
            setStatusMessage("Cannot select a future date or time.");
            return;
        }

        try {
            const response = await fetch(`/api/scan/${scan.date}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: scanDate, time: scanTime }),
            });
            const data = await response.json();
            setStatusMessage(data.message || data.error);
            if (response.ok) onUpdate();
        } catch (error) {
            setStatusMessage('Could not update scan.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleUpdate();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
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
            <h1 className="text-3xl font-bold mb-6 text-center text-[var(--theme-text)]">Edit Scan</h1>
            <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-6" noValidate>
                <input
                    ref={dateInputRef}
                    type="date"
                    value={scanDate}
                    max={today}
                    onChange={(e) => setScanDate(e.target.value)}
                    className="p-3 w-full rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                    onKeyDown={handleKeyDown}
                    required
                />
                <input
                    type="time"
                    step="1"
                    value={scanTime}
                    max={maxTime || null}
                    onChange={(e) => setScanTime(e.target.value)}
                    className="p-3 w-full rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                    onKeyDown={handleKeyDown}
                    required
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <md-filled-button type="submit" class="w-full">
                        Update
                    </md-filled-button>
                </motion.div>
            </form>
        </div>
    );
};

export default EditScanPage;
