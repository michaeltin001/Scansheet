import React from 'react';
import MenuWrapper from '../../ui/MenuWrapper';
import "@material/web/icon/icon.js";

const EntryMenus = ({
    isDownloadMenuOpen,
    closeDownloadMenu,
    downloadIconPosition,
    downloadMenuPosition,
    handleExportPDF,
    handleExportCSV,
    isOptionsMenuOpen,
    closeOptionsMenu,
    optionsIconPosition,
    optionsMenuPosition,
    openNewScanModal,
    openEditEntryModal,
    handleCopyCode,
    openQRCodeModal,
    openDeleteEntryModal
}) => {
    return (
        <>
            <MenuWrapper
                isOpen={isDownloadMenuOpen}
                onClose={closeDownloadMenu}
                iconPosition={downloadIconPosition}
                menuPosition={downloadMenuPosition}
                icon="download"
            >
                <ul className="py-1">
                    <li>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleExportPDF(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                            <md-icon>picture_as_pdf</md-icon>
                            <span>Export to PDF</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleExportCSV(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                            <md-icon>csv</md-icon>
                            <span>Export to CSV</span>
                        </a>
                    </li>
                </ul>
            </MenuWrapper>

            <MenuWrapper
                isOpen={isOptionsMenuOpen}
                onClose={closeOptionsMenu}
                iconPosition={optionsIconPosition}
                menuPosition={optionsMenuPosition}
                icon="more_vert"
            >
                <ul className="py-1">
                    <li>
                        <a href="#" onClick={(e) => { e.preventDefault(); openNewScanModal(); closeOptionsMenu(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                            <md-icon>add_circle</md-icon>
                            <span>Create New Scan</span>
                        </a>
                    </li>
                    <div className="my-1 border-t border-[var(--theme-outline)]"></div>
                    <li>
                        <a href="#" onClick={(e) => { e.preventDefault(); openEditEntryModal(); closeOptionsMenu(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                            <md-icon>edit</md-icon>
                            <span>Edit Entry</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleCopyCode(); closeOptionsMenu(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                            <md-icon>content_copy</md-icon>
                            <span>Copy QR Code</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" onClick={(e) => { e.preventDefault(); openQRCodeModal(); closeOptionsMenu(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                            <md-icon>qr_code_2</md-icon>
                            <span>View QR Code</span>
                        </a>
                    </li>
                    <div className="my-1 border-t border-[var(--theme-outline)]"></div>
                    <li>
                        <a href="#" onClick={(e) => { e.preventDefault(); openDeleteEntryModal(); closeOptionsMenu(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-[var(--theme-highlight)]">
                            <md-icon>delete</md-icon>
                            <span>Delete Entry</span>
                        </a>
                    </li>
                </ul>
            </MenuWrapper>
        </>
    );
};

export default EntryMenus;
