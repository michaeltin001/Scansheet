import React, { useState, useEffect, useRef } from 'react';
import StatusMessage from '../../ui/StatusMessage';
import { motion } from 'framer-motion';
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/button/filled-button.js";
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/icon/icon.js";

const NewScanPage = ({
    statusMessage,
    setStatusMessage,
    onClose,
    onSuccess,
    mode = 'default', // 'default', 'entry', or 'date'
    entryCode = '',
    prefilledDate = '',
    onCategorySelect,
    allCategories,
    selectedCategory,
    setSelectedCategory
}) => {
    const [code, setCode] = useState('');
    const [scanDate, setScanDate] = useState('');
    const [scanTime, setScanTime] = useState('');
    const [maxTime, setMaxTime] = useState('');
    const inputRef = useRef(null);

    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    useEffect(() => {
        if (mode === 'entry') {
            setCode(entryCode);
        }

        if (mode === 'date') {
            setScanDate(prefilledDate);
        } else {
            setScanDate(today);
        }

        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        setScanTime(`${hours}:${minutes}:${seconds}`);

    }, [mode, entryCode, prefilledDate]);

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
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 100);
    }, []);

    const handleReset = () => {
        if (mode !== 'entry') {
            setCode('');
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
        const generalCategory = allCategories.find(c => c.name === 'General');
        if (generalCategory) {
            setSelectedCategory(generalCategory.code);
        }

        if (mode !== 'date') {
            setScanDate(today);
        }
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        setScanTime(`${hours}:${minutes}:${seconds}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!code.trim() || !selectedCategory || !scanDate || !scanTime) {
            setStatusMessage("All fields are required.");
            return;
        }

        const selectedDateTime = new Date(`${scanDate}T${scanTime}`);
        if (selectedDateTime > new Date()) {
            setStatusMessage("Cannot select a future date or time.");
            return;
        }

        try {
            const response = await fetch('/api/scan/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: code.trim(),
                    category_code: selectedCategory,
                    date: scanDate,
                    time: scanTime
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create scan.');
            }
            setStatusMessage(data.message);
            onSuccess();
        } catch (error) {
            setStatusMessage(error.message);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    const selectedCategoryName = allCategories.find(c => c.code === selectedCategory)?.name || 'Select a Category';

    return (
        <div
            className="relative bg-[var(--theme-card-bg)] p-6 rounded-xl border border-[var(--theme-outline)] backdrop-blur-lg h-full flex flex-col items-center justify-center overflow-y-auto"
        >
            <div className="absolute top-6 left-6 z-10">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <md-outlined-icon-button onClick={handleReset}>
                        <md-icon>history</md-icon>
                    </md-outlined-icon-button>
                </motion.div>
            </div>

            <div className="absolute top-6 right-6 z-10">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <md-outlined-icon-button onClick={onClose}>
                        <md-icon>close</md-icon>
                    </md-outlined-icon-button>
                </motion.div>
            </div>

            <StatusMessage message={statusMessage} onDismiss={() => setStatusMessage("")} />
            <h1 className="text-3xl font-bold mb-6 text-center text-[var(--theme-text)]">Create New Scan</h1>
            <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-6" noValidate>
                <md-outlined-text-field
                    ref={inputRef}
                    class="w-full"
                    placeholder="Code"
                    value={code}
                    onInput={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    required
                    disabled={mode === 'entry' ? true : undefined}
                ></md-outlined-text-field>
                <input
                    type="date"
                    value={scanDate}
                    max={today}
                    onChange={(e) => setScanDate(e.target.value)}
                    className="p-3 w-full rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                    onKeyDown={handleKeyDown}
                    required
                    disabled={mode === 'date' ? true : undefined}
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
                    <md-outlined-button class="w-full" type="button" onClick={onCategorySelect}>
                        {selectedCategoryName}
                    </md-outlined-button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <md-filled-button type="submit" class="w-full">
                        Create
                    </md-filled-button>
                </motion.div>
            </form>
        </div>
    );
};

export default NewScanPage;
