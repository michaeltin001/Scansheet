import React from 'react';
import MenuWrapper from '../../ui/MenuWrapper';
import "@material/web/icon/icon.js";

const CategoriesMenus = ({
    isAddMenuOpen,
    closeAddMenu,
    addIconPosition,
    addMenuPosition,
    openNewCategoryModal,
    handleUploadClick,
    isDownloadMenuOpen,
    closeDownloadMenu,
    downloadIconPosition,
    downloadMenuPosition,
    openExportPDFModal,
    openExportCSVModal,
    selectedCategoriesCount
}) => {
    return (
        <>
            <MenuWrapper
                isOpen={isAddMenuOpen}
                onClose={closeAddMenu}
                iconPosition={addIconPosition}
                menuPosition={addMenuPosition}
                icon="add"
            >
                <ul className="py-1">
                    <li>
                        <a href="#" onClick={(e) => { e.preventDefault(); openNewCategoryModal(); closeAddMenu(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                            <md-icon>add_circle</md-icon>
                            <span>Create New Category</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleUploadClick(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                            <md-icon>csv</md-icon>
                            <span>Import from CSV</span>
                        </a>
                    </li>
                </ul>
            </MenuWrapper>

            <MenuWrapper
                isOpen={isDownloadMenuOpen}
                onClose={closeDownloadMenu}
                iconPosition={downloadIconPosition}
                menuPosition={downloadMenuPosition}
                icon="download"
            >
                 <ul className="py-1">
                    <li>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                openExportPDFModal();
                                closeDownloadMenu();
                            }}
                            className={`flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] ${selectedCategoriesCount > 0 ? 'hover:bg-[var(--theme-highlight)]' : 'opacity-50 cursor-not-allowed'}`}
                        >
                            <md-icon>picture_as_pdf</md-icon>
                            <span>Export to PDF</span>
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                openExportCSVModal();
                                closeDownloadMenu();
                            }}
                            className={`flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] ${selectedCategoriesCount > 0 ? 'hover:bg-[var(--theme-highlight)]' : 'opacity-50 cursor-not-allowed'}`}
                        >
                            <md-icon>csv</md-icon>
                            <span>Export to CSV</span>
                        </a>
                    </li>
                </ul>
            </MenuWrapper>
        </>
    );
};

export default CategoriesMenus;
