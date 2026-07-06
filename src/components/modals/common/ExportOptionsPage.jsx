import React, { useState, useEffect, useRef } from 'react';
import StatusMessage from '../../ui/StatusMessage';
import { motion } from 'framer-motion';
import "@material/web/button/filled-button.js";
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/iconbutton/filled-icon-button.js";
import "@material/web/icon/icon.js";

const ExportOptionsPage = ({
    statusMessage,
    setStatusMessage,
    onClose,
    onExport,
    title,
}) => {
    const [removeDuplicates, setRemoveDuplicates] = useState(false);
    const [alphabetize, setAlphabetize] = useState(false);
    const [compareFile, setCompareFile] = useState({ path: null, name: null });
    const fileInputRef = useRef(null);

    const handleDeleteCompareFile = async (showStatus = true) => {
        if (!compareFile.path) return;

        const path = compareFile.path;
        setCompareFile({ path: null, name: null });

        try {
            const response = await fetch('/api/dates/compare-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: path }),
            });
            const data = await response.json();
            if (showStatus) {
                if (response.ok) {
                    setStatusMessage("Comparison file removed.");
                } else {
                    setStatusMessage(data.error || "Could not remove file.");
                }
            }
        } catch (error) {
            if (showStatus) {
                setStatusMessage("Error removing file.");
            }
        }
    };

    const handleClose = () => {
        if (compareFile.path) {
            handleDeleteCompareFile(false);
        }
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onExport({
            removeDuplicates,
            alphabetize,
            compareFilePath: compareFile.path,
            compareFileName: compareFile.name
        });
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                onExport({
                    removeDuplicates,
                    alphabetize,
                    compareFilePath: compareFile.path,
                    compareFileName: compareFile.name
                });
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [removeDuplicates, alphabetize, compareFile, onExport]);

    const handleCompareClick = () => {
        if (compareFile.path) {
            handleDeleteCompareFile(true);
        } else {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append('compareFile', file);

        try {
            const response = await fetch('/api/dates/compare-upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                setCompareFile({ path: data.filePath, name: data.originalName });
                setStatusMessage("Comparison file uploaded.");
            } else {
                throw new Error(data.error || 'File upload failed.');
            }
        } catch (error) {
            setStatusMessage(error.message);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
        }
    };

    const isCompareActive = !!compareFile.path;

    return (
        <div
            className="relative bg-[var(--theme-card-bg)] p-6 rounded-xl border border-[var(--theme-outline)] backdrop-blur-lg h-full flex flex-col items-center justify-center overflow-y-auto"
        >
            <div className="absolute top-6 left-6 z-10">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    {isCompareActive ? (
                        <md-filled-icon-button onClick={handleCompareClick}>
                            <md-icon>compare</md-icon>
                        </md-filled-icon-button>
                    ) : (
                        <md-outlined-icon-button onClick={handleCompareClick}>
                            <md-icon>compare</md-icon>
                        </md-outlined-icon-button>
                    )}
                </motion.div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    style={{ display: 'none' }}
                />
            </div>

            <div className="absolute top-6 right-6 z-10">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <md-outlined-icon-button onClick={handleClose}>
                        <md-icon>close</md-icon>
                    </md-outlined-icon-button>
                </motion.div>
            </div>

            <StatusMessage message={statusMessage} onDismiss={() => setStatusMessage("")} />
            <h1 className="text-3xl font-bold mb-6 text-center text-[var(--theme-text)]">{title}</h1>
            <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
                <label className={`flex items-center gap-4 p-4 border border-[var(--theme-outline)] rounded-xl text-lg text-[var(--theme-text)] transition-colors ${isCompareActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--theme-highlight)]'}`}>
                    <input
                        type="checkbox"
                        className="h-5 w-5"
                        checked={removeDuplicates}
                        onChange={(e) => setRemoveDuplicates(e.target.checked)}
                        disabled={isCompareActive}
                    />
                    <span>Remove Duplicates</span>
                </label>
                <label className={`flex items-center gap-4 p-4 border border-[var(--theme-outline)] rounded-xl text-lg text-[var(--theme-text)] transition-colors ${isCompareActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--theme-highlight)]'}`}>
                    <input
                        type="checkbox"
                        className="h-5 w-5"
                        checked={alphabetize}
                        onChange={(e) => setAlphabetize(e.target.checked)}
                        disabled={isCompareActive}
                    />
                    <span>Alphabetize (A-Z)</span>
                </label>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="pt-2">
                    <md-filled-button type="submit" class="w-full">
                        {isCompareActive ? 'Compare' : 'Export'}
                    </md-filled-button>
                </motion.div>
            </form>
        </div>
    );
};

export default ExportOptionsPage;
