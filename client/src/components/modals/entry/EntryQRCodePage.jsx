import React, { useState, useEffect } from 'react';
import StatusMessage from '../../ui/StatusMessage';
import { motion } from 'framer-motion';
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";

const EntryQRCodePage = ({ onClose, entry, onQRCodeUpdate, statusMessage, setStatusMessage }) => {

    const [currentEntry, setCurrentEntry] = useState(entry);
    const [displayedImage, setDisplayedImage] = useState(entry ? entry.code_png : "");

    useEffect(() => {
        if (!currentEntry) return;
        if (currentEntry.code_png !== displayedImage) {
            const img = new Image();
            img.src = currentEntry.code_png;
            img.onload = () => {
                setDisplayedImage(currentEntry.code_png);
            };
        }
    }, [currentEntry]);

    const handleCopyCode = async () => {
        if (currentEntry && currentEntry.code) {
            try {
                await navigator.clipboard.writeText(currentEntry.code);
                setStatusMessage("Copied code to clipboard.");
            } catch (err) {
                setStatusMessage("Could not copy code.");
            }
        }
    };

    const handleGenerateNewQR = async () => {
        try {
            const response = await fetch(`/api/entry/qrcode/${currentEntry.code}`, { method: 'PUT' });
            const data = await response.json();
            setStatusMessage(data.message);
            if (response.ok) {
                setCurrentEntry(prev => ({ ...prev, ...data.data }));
                if (onQRCodeUpdate) {
                    onQRCodeUpdate({ ...currentEntry, ...data.data });
                }
            }
        } catch (error) {
            setStatusMessage('Could not generate new QR code.');
        }
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(`/api/entry/download/${currentEntry.code}`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                const disposition = response.headers.get('content-disposition');
                let filename = `${currentEntry.name.replace(/\s+/g, '_')}_${currentEntry.code}.png`;
                if (disposition && disposition.includes('attachment')) {
                    const filenameMatch = /filename="([^"]+)"/.exec(disposition);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1];
                    }
                }
                
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                setStatusMessage("Successfully exported PNG.");
            } else {
                setStatusMessage("Could not download PNG.");
            }
        } catch (error) {
            setStatusMessage("An error occurred during download.");
        }
    };

    const handlePrintBadge = async () => {
        try {
            const response = await fetch(`/api/entry/print/${currentEntry.code}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                const disposition = response.headers.get('content-disposition');
                let filename = `${currentEntry.name.replace(/\s+/g, '_')}_${currentEntry.code}.pdf`;
                 if (disposition && disposition.includes('attachment')) {
                    const filenameMatch = /filename="([^"]+)"/.exec(disposition);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1];
                    }
                }

                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                setStatusMessage("Successfully generated PDF.");
            } else {
                setStatusMessage("Could not generate PDF.");
            }
        } catch (error) {
            setStatusMessage("Could not generate PDF.");
        }
    };

    if (!currentEntry) return null;

    return (
        <div
            className="relative bg-[var(--theme-card-bg)] p-6 rounded-xl border border-[var(--theme-outline)] backdrop-blur-lg h-full flex flex-col overflow-hidden"
        >
            <StatusMessage message={statusMessage} onDismiss={() => setStatusMessage("")} />
            <div className="relative flex justify-center items-center mb-6">
                <div className="absolute left-0 flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <md-outlined-icon-button onClick={handleGenerateNewQR}>
                            <md-icon>refresh</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <md-outlined-icon-button onClick={handleDownload}>
                            <md-icon>image</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <md-outlined-icon-button onClick={handlePrintBadge}>
                            <md-icon>print</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                </div>
                <h1 className="text-3xl font-bold text-[var(--theme-text)] text-center">{currentEntry.name}</h1>
                <div className="absolute right-0">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <md-outlined-icon-button onClick={onClose}>
                            <md-icon>close</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-0 overflow-y-auto">
                 <div className="w-full max-w-72 aspect-square bg-white p-2 rounded-lg border-4 border-[var(--theme-outline)]">
                    <img src={displayedImage} alt="QR Code" className="w-full h-full" />
                 </div>
                 <div className="flex items-center justify-center gap-2">
                     <p
                         className="text-base p-2 rounded-md cursor-pointer transition-colors hover:bg-[var(--theme-highlight)]"
                         onClick={handleCopyCode}
                     >
                         {currentEntry.code}
                     </p>
                 </div>
            </div>
        </div>
    );
};

export default EntryQRCodePage;
