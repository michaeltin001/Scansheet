import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/icon/icon.js";

const EntryPagination = ({
    currentPage,
    totalPages,
    totalScans,
    scansPerPage,
    sortOption,
    onPageChange,
    onScansPerPageChange,
    onSortChange
}) => {
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isScansPerPageOpen, setIsScansPerPageOpen] = useState(false);

    const firstPageButtonRef = useRef(null);
    const prevPageButtonRef = useRef(null);
    const nextPageButtonRef = useRef(null);
    const lastPageButtonRef = useRef(null);

    useEffect(() => {
        const isFirstPage = currentPage === 1;
        const isLastPage = currentPage === totalPages || totalPages === 0;

        if (firstPageButtonRef.current) {
            firstPageButtonRef.current.disabled = isFirstPage;
        }
        if (prevPageButtonRef.current) {
            prevPageButtonRef.current.disabled = isFirstPage;
        }
        if (nextPageButtonRef.current) {
            nextPageButtonRef.current.disabled = isLastPage;
        }
        if (lastPageButtonRef.current) {
            lastPageButtonRef.current.disabled = isLastPage;
        }
    }, [currentPage, totalPages]);

    return (
        <div className="mt-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <motion.div
                    whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
                    whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
                >
                    <md-outlined-icon-button ref={firstPageButtonRef} onClick={() => onPageChange(1)}>
                        <md-icon>keyboard_double_arrow_left</md-icon>
                    </md-outlined-icon-button>
                </motion.div>
                <motion.div
                    whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
                    whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
                >
                    <md-outlined-icon-button ref={prevPageButtonRef} onClick={() => onPageChange(p => p - 1)}>
                        <md-icon>keyboard_arrow_left</md-icon>
                    </md-outlined-icon-button>
                </motion.div>
                <span className="text-sm font-medium text-[var(--theme-text)]">
                    Page {currentPage} of {totalPages > 0 ? totalPages : 1}
                </span>
                <motion.div
                    whileHover={currentPage < totalPages ? { scale: 1.05 } : {}}
                    whileTap={currentPage < totalPages ? { scale: 0.95 } : {}}
                >
                    <md-outlined-icon-button ref={nextPageButtonRef} onClick={() => onPageChange(p => p + 1)}>
                        <md-icon>keyboard_arrow_right</md-icon>
                    </md-outlined-icon-button>
                </motion.div>
                <motion.div
                    whileHover={currentPage < totalPages ? { scale: 1.05 } : {}}
                    whileTap={currentPage < totalPages ? { scale: 0.95 } : {}}
                >
                    <md-outlined-icon-button ref={lastPageButtonRef} onClick={() => onPageChange(totalPages)}>
                        <md-icon>keyboard_double_arrow_right</md-icon>
                    </md-outlined-icon-button>
                </motion.div>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--theme-text)]">
                    Results: {totalScans}
                </span>
                <div className="relative">
                    <select
                        value={sortOption}
                        onChange={(e) => onSortChange(e.target.value)}
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        onBlur={() => setIsSortOpen(false)}
                        className="appearance-none p-2 pl-3 pr-8 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                    >
                        <option value="date-desc">Newest</option>
                        <option value="date-asc">Oldest</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                        <md-icon>{isSortOpen ? 'unfold_less' : 'unfold_more'}</md-icon>
                    </div>
                </div>
                <div className="relative">
                    <select
                        value={scansPerPage}
                        onChange={(e) => onScansPerPageChange(Number(e.target.value))}
                        onClick={() => setIsScansPerPageOpen(!isScansPerPageOpen)}
                        onBlur={() => setIsScansPerPageOpen(false)}
                        className="appearance-none p-2 pl-3 pr-8 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                        <md-icon>{isScansPerPageOpen ? 'unfold_less' : 'unfold_more'}</md-icon>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EntryPagination;
