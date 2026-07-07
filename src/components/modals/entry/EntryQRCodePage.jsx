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
            const { invoke } = await import('@tauri-apps/api/core');
            const data = await invoke('update_entry_qrcode', { code: currentEntry.code });
            setStatusMessage(data.message);
            setCurrentEntry(prev => ({ ...prev, ...data.data }));
            if (onQRCodeUpdate) {
                onQRCodeUpdate({ ...currentEntry, ...data.data });
            }
        } catch (error) {
            setStatusMessage('Could not generate new QR code.');
        }
    };

    const handleDownload = async () => {
        try {
            const { save } = await import('@tauri-apps/plugin-dialog');
            const { writeFile } = await import('@tauri-apps/plugin-fs');

            // Strip prefix from base64 string
            const base64Data = currentEntry.code_png.replace(/^data:image\/png;base64,/, "");
            const binaryString = window.atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const defaultFilename = `${currentEntry.name.replace(/\s+/g, '_')}_${currentEntry.code}.png`;
            
            const filePath = await save({
                filters: [{ name: 'PNG', extensions: ['png'] }],
                defaultPath: defaultFilename
            });

            if (filePath) {
                await writeFile(filePath, bytes);
                setStatusMessage("Successfully exported PNG.");
            }
        } catch (error) {
            setStatusMessage("An error occurred during download.");
        }
    };

    const handlePrintBadge = async () => {
        try {
            const { jsPDF } = await import('jspdf');
            const { save } = await import('@tauri-apps/plugin-dialog');
            const { writeFile } = await import('@tauri-apps/plugin-fs');

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'letter'
            });

            const margin = 36;
            let currentY = margin;

            doc.setFontSize(14);
            doc.text(currentEntry.name, margin, currentY);
            currentY += 20;

            const base64Data = currentEntry.code_png.replace(/^data:image\/png;base64,/, "");
            doc.addImage(base64Data, 'PNG', margin, currentY, 150, 150);

            const pdfBytes = doc.output('arraybuffer');

            const defaultFilename = `${currentEntry.name.replace(/\s+/g, '_')}_${currentEntry.code}.pdf`;
            
            const filePath = await save({
                filters: [{ name: 'PDF', extensions: ['pdf'] }],
                defaultPath: defaultFilename
            });

            if (filePath) {
                await writeFile(filePath, new Uint8Array(pdfBytes));
                setStatusMessage("Successfully generated PDF.");
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
