import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";
import "@material/web/iconbutton/filled-icon-button.js";

const DatesToolbar = ({
    selectedDates,
    allDates,
    onClearSelection,
    onSelectAll,
    getSelectAllIcon,
    onDownloadMenuToggle,
    onDeleteClick,
    isDateFilterActive,
    onDateFilterToggle,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onAddMenuToggle,
    isAddMenuOpen,
    isDownloadMenuOpen,
    addButtonRef,
    downloadButtonRef,
    openDayFilterModal,
    handleRestoreDefaultDates,
    handleClearDates
}) => {
    const dateFilterRef = useRef(null);
    const clearSelectionButtonRef = useRef(null);
    const deleteButtonRef = useRef(null);
    const selectAllButtonRef = useRef(null);

    useEffect(() => {
        const isDisabled = selectedDates.size === 0;
        if (downloadButtonRef.current) {
            downloadButtonRef.current.disabled = isDisabled;
        }
        if (deleteButtonRef.current) {
            deleteButtonRef.current.disabled = isDisabled;
        }
        if (clearSelectionButtonRef.current) {
            clearSelectionButtonRef.current.disabled = isDisabled;
        }
    }, [selectedDates, downloadButtonRef, deleteButtonRef, clearSelectionButtonRef]);

    useEffect(() => {
        if (selectAllButtonRef.current) {
            selectAllButtonRef.current.disabled = allDates.length === 0;
        }
    }, [allDates]);

    return (
        <>
            <div className="relative flex justify-center items-center mb-6">
                <div className="absolute left-0 flex items-center gap-2">
                    <motion.div
                        whileHover={selectedDates.size > 0 ? { scale: 1.05 } : {}}
                        whileTap={selectedDates.size > 0 ? { scale: 0.95 } : {}}
                    >
                        <md-outlined-icon-button
                            ref={clearSelectionButtonRef}
                            onClick={onClearSelection}
                        >
                            <md-icon>history</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                    <motion.div
                        whileHover={allDates.length > 0 ? { scale: 1.05 } : {}}
                        whileTap={allDates.length > 0 ? { scale: 0.95 } : {}}
                    >
                        <md-outlined-icon-button ref={selectAllButtonRef} onClick={onSelectAll}>
                            <md-icon>{getSelectAllIcon()}</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                    <motion.div
                        whileHover={selectedDates.size > 0 ? { scale: 1.05 } : {}}
                        whileTap={selectedDates.size > 0 ? { scale: 0.95 } : {}}
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
                        whileHover={selectedDates.size > 0 ? { scale: 1.05 } : {}}
                        whileTap={selectedDates.size > 0 ? { scale: 0.95 } : {}}
                    >
                        <md-outlined-icon-button
                            ref={deleteButtonRef}
                            onClick={onDeleteClick}
                        >
                            <md-icon>delete</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                </div>
                <h1 className="text-3xl font-bold text-[var(--theme-text)]">Dates</h1>
                <div className="absolute right-0 flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        {isDateFilterActive ? (
                            <md-filled-icon-button onClick={() => onDateFilterToggle(false)}>
                                <md-icon>search</md-icon>
                            </md-filled-icon-button>
                        ) : (
                            <md-outlined-icon-button onClick={() => onDateFilterToggle(true)}>
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
                {isDateFilterActive && (
                    <motion.div
                        ref={dateFilterRef}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ transformOrigin: 'top' }}
                        className="mb-6 p-4 border border-[var(--theme-outline)] rounded-xl bg-[var(--theme-card-bg)] shadow-[0_10px_15px_-3px_var(--theme-shadow-color)]"
                    >
                        <div className="relative flex flex-wrap items-center gap-2">
                            <md-icon-button onClick={openDayFilterModal}>
                                <md-icon>menu</md-icon>
                            </md-icon-button>
                            <input
                                type="date"
                                value={startDate || ''}
                                onChange={onStartDateChange}
                                className="p-1.5 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                            />
                            <span className="text-[var(--theme-text)]">to</span>
                            <input
                                type="date"
                                value={endDate || ''}
                                min={startDate || ''}
                                onChange={onEndDateChange}
                                className="p-1.5 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                            />
                            <div className="absolute right-0 z-10 flex items-center gap-2">
                                <md-icon-button onClick={handleRestoreDefaultDates}>
                                    <md-icon>history</md-icon>
                                </md-icon-button>
                                <md-icon-button onClick={handleClearDates}>
                                    <md-icon>close</md-icon>
                                </md-icon-button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default DatesToolbar;
