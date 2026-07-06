import React, { useState, useEffect, useRef, useCallback } from 'react';
import StatusMessage from '../../ui/StatusMessage';
import { motion } from 'framer-motion';
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/icon/icon.js";
import "@material/web/button/filled-button.js";

const ScannerPage = ({ statusMessage, setStatusMessage, onClose, onCategorySelect, allCategories, selectedCategory }) => {
    const [scannedCode, setScannedCode] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('selectedCategory', selectedCategory);
    }, [selectedCategory]);

    const submitScan = useCallback(async (codeToSubmit) => {
        if (!codeToSubmit.trim()) return;

        try {
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeToSubmit, category_code: selectedCategory }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Scan failed.');
            }
            setStatusMessage(data.message);
        } catch (error) {
            setStatusMessage(error.message);
        } finally {
            setScannedCode('');
        }
    }, [setStatusMessage, selectedCategory]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.value = scannedCode;
        }
    }, [scannedCode]);

    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (scannedCode.length === 36) {
            submitScan(scannedCode);
        }
    }, [scannedCode, submitScan]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        submitScan(scannedCode);
    };

    const selectedCategoryName = allCategories.find(c => c.code === selectedCategory)?.name || 'Select a Category';

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
            <h1 className="text-3xl font-bold mb-6 text-center text-[var(--theme-text)]">Scan Code</h1>
            <form onSubmit={handleFormSubmit} className="w-full max-w-sm flex flex-col gap-4">
                <md-outlined-text-field
                    ref={inputRef}
                    class="w-full"
                    placeholder="Code"
                    onInput={(e) => setScannedCode(e.target.value)}
                    onBlur={() => inputRef.current?.focus()}
                ></md-outlined-text-field>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <md-outlined-button class="w-full" type="button" onClick={onCategorySelect}>
                        {selectedCategoryName}
                    </md-outlined-button>
                </motion.div>
            </form>
        </div>
    );
};

export default ScannerPage;
