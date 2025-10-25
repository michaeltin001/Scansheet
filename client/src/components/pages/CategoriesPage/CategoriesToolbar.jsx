import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";
import "@material/web/iconbutton/filled-icon-button.js";

const CategoriesToolbar = ({
    selectedCategories,
    allCategories,
    onClearSelection,
    onSelectAll,
    getSelectAllIcon,
    onDownloadMenuToggle,
    onDeleteClick,
    isSearchActive,
    searchQuery,
    onSearchToggle,
    onSearchChange,
    onAddMenuToggle,
    isAddMenuOpen,
    isDownloadMenuOpen,
    addButtonRef,
    downloadButtonRef
}) => {
    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);
    const clearSearchButtonRef = useRef(null);
    const clearSelectionButtonRef = useRef(null);
    const deleteButtonRef = useRef(null);
    const selectAllButtonRef = useRef(null);

    useEffect(() => {
        const isDisabled = selectedCategories.size === 0;
        if (downloadButtonRef.current) {
            downloadButtonRef.current.disabled = isDisabled;
        }
        if (deleteButtonRef.current) {
            deleteButtonRef.current.disabled = isDisabled;
        }
        if (clearSelectionButtonRef.current) {
            clearSelectionButtonRef.current.disabled = isDisabled;
        }
    }, [selectedCategories, downloadButtonRef, deleteButtonRef, clearSelectionButtonRef]);

    useEffect(() => {
        if (selectAllButtonRef.current) {
            const selectableCategories = allCategories.filter(c => c.name !== 'General');
            selectAllButtonRef.current.disabled = selectableCategories.length === 0;
        }
    }, [allCategories]);

    useEffect(() => {
        if (clearSearchButtonRef.current) {
            clearSearchButtonRef.current.disabled = searchQuery === "";
        }
    }, [searchQuery]);

    return (
        <>
            <div className="relative flex justify-center items-center mb-6">
                <div className="absolute left-0 flex items-center gap-2">
                    <motion.div
                        whileHover={selectedCategories.size > 0 ? { scale: 1.05 } : {}}
                        whileTap={selectedCategories.size > 0 ? { scale: 0.95 } : {}}
                    >
                        <md-outlined-icon-button
                            ref={clearSelectionButtonRef}
                            onClick={onClearSelection}
                        >
                            <md-icon>history</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                    <motion.div
                        whileHover={allCategories.length > 1 ? { scale: 1.05 } : {}}
                        whileTap={allCategories.length > 1 ? { scale: 0.95 } : {}}
                    >
                        <md-outlined-icon-button ref={selectAllButtonRef} onClick={onSelectAll}>
                            <md-icon>{getSelectAllIcon()}</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                    <motion.div
                        whileHover={selectedCategories.size > 0 ? { scale: 1.05 } : {}}
                        whileTap={selectedCategories.size > 0 ? { scale: 0.95 } : {}}
                    >
                        <md-outlined-icon-button
                            ref={downloadButtonRef}
                            onClick={onDownloadMenuToggle}
                            style={{ visibility: isDownloadMenuOpen ? 'hidden' : 'visible' }}
                        >
                            <md-icon>download</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                    <motion.div
                        whileHover={selectedCategories.size > 0 ? { scale: 1.05 } : {}}
                        whileTap={selectedCategories.size > 0 ? { scale: 0.95 } : {}}
                    >
                        <md-outlined-icon-button
                            ref={deleteButtonRef}
                            onClick={onDeleteClick}
                        >
                            <md-icon>delete</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                </div>
                <h1 className="text-3xl font-bold text-[var(--theme-text)]">Categories</h1>
                <div className="absolute right-0 flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        {isSearchActive ? (
                            <md-filled-icon-button onClick={() => onSearchToggle(false)}>
                                <md-icon>search</md-icon>
                            </md-filled-icon-button>
                        ) : (
                            <md-outlined-icon-button onClick={() => onSearchToggle(true)}>
                                <md-icon>search</md-icon>
                            </md-outlined-icon-button>
                        )}
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <md-outlined-icon-button
                            ref={addButtonRef}
                            onClick={onAddMenuToggle}
                            style={{ visibility: isAddMenuOpen ? 'hidden' : 'visible' }}
                        >
                            <md-icon>add</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isSearchActive && (
                    <motion.div
                        ref={searchContainerRef}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ transformOrigin: 'top' }}
                        className="mb-6 p-4 border border-[var(--theme-outline)] rounded-xl bg-[var(--theme-card-bg)] shadow-[0_10px_15px_-3px_var(--theme-shadow-color)]"
                    >
                        <div className="relative flex items-center">
                            <input
                                ref={searchInputRef}
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full py-[7px] pl-4 pr-12 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute right-0 z-10 flex items-center pr-2"
                            >
                                <md-icon-button
                                    ref={clearSearchButtonRef}
                                    onClick={() => onSearchChange("")}
                                    disabled={!searchQuery}
                                >
                                    <md-icon>close</md-icon>
                                </md-icon-button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default CategoriesToolbar;
