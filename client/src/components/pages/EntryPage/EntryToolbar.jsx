import React, { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";
import "@material/web/iconbutton/filled-icon-button.js";

const EntryToolbar = ({
    entryName,
    isDateFilterActive,
    handleRestoreDefaultDates,
    setIsDateFilterActive,
    handleDownloadMenuToggle,
    isDownloadMenuOpen,
    downloadButtonRef,
    handleOptionsMenuToggle,
    isOptionsMenuOpen,
    optionsButtonRef,
    dateFilterRef,
    startDate,
    endDate,
    handleStartDateChange,
    handleEndDateChange,
    openFilterModal,
    handleClearDates,
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <>
            <div className="relative flex justify-center items-center mb-6">
                <div className="absolute left-0 flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <md-outlined-icon-button onClick={() => navigate(location.state?.from || '/entries')}>
                            <md-icon>arrow_back</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <md-outlined-icon-button
                            ref={downloadButtonRef}
                            onClick={handleDownloadMenuToggle}
                            style={{ visibility: isDownloadMenuOpen ? 'hidden' : 'visible' }}
                        >
                            <md-icon>download</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                </div>
                <h1 className="text-3xl font-bold text-[var(--theme-text)]">{entryName}</h1>
                <div className="absolute right-0 flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        {isDateFilterActive ? (
                            <md-filled-icon-button onClick={() => {
                                setIsDateFilterActive(false);
                                handleRestoreDefaultDates();
                            }}>
                                <md-icon>search</md-icon>
                            </md-filled-icon-button>
                        ) : (
                            <md-outlined-icon-button onClick={() => setIsDateFilterActive(true)}>
                                <md-icon>search</md-icon>
                            </md-outlined-icon-button>
                        )}
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <md-outlined-icon-button
                            ref={optionsButtonRef}
                            onClick={handleOptionsMenuToggle}
                            style={{ visibility: isOptionsMenuOpen ? 'hidden' : 'visible' }}
                        >
                            <md-icon>more_vert</md-icon>
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
                            <md-icon-button onClick={openFilterModal}>
                                <md-icon>menu</md-icon>
                            </md-icon-button>
                            <input
                                id="start-date-input"
                                type="date"
                                value={startDate || ''}
                                onChange={handleStartDateChange}
                                className="p-1.5 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                            />
                            <span className="text-[var(--theme-text)]">to</span>
                            <input
                                id="end-date-input"
                                type="date"
                                value={endDate || ''}
                                min={startDate || ''}
                                onChange={handleEndDateChange}
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

export default EntryToolbar;
