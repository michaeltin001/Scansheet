import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StatusMessage from '../ui/StatusMessage';
import DayFilterPage from '../modals/filter/DayFilterPage';
import DeletePage from '../modals/common/DeletePage';
import DeleteDatePage from '../modals/date/DeleteDatePage';
import NewScanPage from '../modals/scan/NewScanPage';
import CategorySelectionPage from '../modals/filter/CategorySelectionPage';
import ExportToCSVPage from '../modals/common/ExportToCSVPage';
import ExportToPDFPage from '../modals/common/ExportToPDFPage';
import { useOverflow } from '../../hooks/useOverflow';
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";
import "@material/web/button/filled-button.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/iconbutton/filled-icon-button.js";

const DatesPage = ({ statusMessage, setStatusMessage }) => {
    const [allDates, setAllDates] = useState([]);
    const [totalDates, setTotalDates] = useState(0);
    const [isDateFilterActive, setIsDateFilterActive] = useState(false);
    const [sortOption, setSortOption] = useState(() => {
        const savedSortOption = localStorage.getItem('dateSortOption');
        return savedSortOption || 'date-desc';
    });
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [selectedDates, setSelectedDates] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [datesPerPage, setDatesPerPage] = useState(() => {
        const saved = localStorage.getItem('datesPerPage');
        return saved ? parseInt(saved, 10) : 50;
    });
    const [isDatesPerPageOpen, setIsDatesPerPageOpen] = useState(false);
    const [isDeleteDateModalOpen, setIsDeleteDateModalOpen] = useState(false);
    const [isDayFilterModalOpen, setIsDayFilterModalOpen] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [addMenuPosition, setAddMenuPosition] = useState({});
    const [addIconPosition, setAddIconPosition] = useState({});
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
    const [downloadMenuPosition, setDownloadMenuPosition] = useState({});
    const [downloadIconPosition, setDownloadIconPosition] = useState({});
    const [isExportCSVModalOpen, setIsExportCSVModalOpen] = useState(false);
    const [isExportPDFModalOpen, setIsExportPDFModalOpen] = useState(false);
    const [contentBoxBounds, setContentBoxBounds] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [defaultStartDate, setDefaultStartDate] = useState(null);
    const [defaultEndDate, setDefaultEndDate] = useState(null);
    const [selectedDays, setSelectedDays] = useState(new Set([0, 1, 2, 3, 4, 5, 6]));
    const [isDeleteOptionsModalOpen, setIsDeleteOptionsModalOpen] = useState(false);
    const [isNewScanModalOpen, setIsNewScanModalOpen] = useState(false);
    const [isCategorySelectionOpen, setIsCategorySelectionOpen] = useState(false);
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(() => {
        return localStorage.getItem('selectedCategory') || '';
    });

    const [datesToDelete, setDatesToDelete] = useState([]);
    const contentBoxRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const addButtonRef = useRef(null);
    const downloadButtonRef = useRef(null);
    const dateFilterRef = useRef(null);
    const clearSelectionButtonRef = useRef(null);
    const deleteButtonRef = useRef(null);
    const selectAllButtonRef = useRef(null);

    const firstPageButtonRef = useRef(null);
    const prevPageButtonRef = useRef(null);
    const nextPageButtonRef = useRef(null);
    const lastPageButtonRef = useRef(null);

    const { isOverflowingTop, isOverflowingBottom } = useOverflow(scrollContainerRef, allDates);
    const navigate = useNavigate();
    const totalPages = Math.ceil(totalDates / datesPerPage);

    const updateBounds = () => {
        if (contentBoxRef.current) {
            setContentBoxBounds(contentBoxRef.current.getBoundingClientRect());
        }
    };

    const fetchDateRange = async () => {
        try {
            const response = await fetch(`/api/dates/range`);
            const data = await response.json();
            if (response.ok && data.data.minDate) {
                const { minDate, maxDate } = data.data;
                setStartDate(minDate);
                setEndDate(maxDate);
                setDefaultStartDate(minDate);
                setDefaultEndDate(maxDate);
            }
        } catch (error) {
            console.error("Failed to fetch date range:", error)
        }
    };

    const selectedDatesOnCurrentPage = useMemo(() => {
        const paginatedDates = new Set(allDates);
        return Array.from(selectedDates).filter(date => paginatedDates.has(date));
    }, [allDates, selectedDates]);

    useEffect(() => {
        localStorage.setItem('dateSortOption', sortOption);
    }, [sortOption]);

    useEffect(() => {
        localStorage.setItem('datesPerPage', String(datesPerPage));
    }, [datesPerPage]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const categoriesResponse = await fetch('/api/categories');
                const categoriesData = await categoriesResponse.json();
                if (categoriesResponse.ok) {
                    setAllCategories(categoriesData.data);
                    if (!localStorage.getItem('selectedCategory')) {
                        const generalCategory = categoriesData.data.find(c => c.name === 'General');
                        if (generalCategory) {
                            setSelectedCategory(generalCategory.code);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        localStorage.setItem('selectedCategory', selectedCategory);
    }, [selectedCategory]);

    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                setIsDayFilterModalOpen(false);
                setIsDeleteDateModalOpen(false);
                setIsDeleteOptionsModalOpen(false);
                setIsAddMenuOpen(false);
                setIsNewScanModalOpen(false);
                setIsCategorySelectionOpen(false);
                setIsDownloadMenuOpen(false);
                setIsExportCSVModalOpen(false);
                setIsExportPDFModalOpen(false);
            }
        };
        document.addEventListener("keydown", handleEscKey);
        return () => {
            document.removeEventListener("keydown", handleEscKey);
        };
    }, [isDateFilterActive]);

    useEffect(() => {
        window.addEventListener('resize', updateBounds);
        return () => {
            window.removeEventListener('resize', updateBounds);
        };
    }, []);

    useEffect(() => {
        fetchDates();
    }, [sortOption, currentPage, datesPerPage, startDate, endDate, selectedDays]);

    useEffect(() => {
        fetchDateRange();
    }, []);

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
    }, [selectedDates]);

    useEffect(() => {
        if (selectAllButtonRef.current) {
            selectAllButtonRef.current.disabled = allDates.length === 0;
        }
    }, [allDates]);

    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    useEffect(() => {
        if (!isAddMenuOpen) return;

        const handleReposition = () => {
            if (addButtonRef.current) {
                const rect = addButtonRef.current.getBoundingClientRect();
                setAddIconPosition({ top: rect.top, left: rect.left });
                setAddMenuPosition({
                    top: rect.bottom + 8,
                    left: rect.right - 224,
                });
            }
        };

        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);
        
        return () => {
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
        };
    }, [isAddMenuOpen]);

    useEffect(() => {
        if (!isDownloadMenuOpen) return;

        const handleReposition = () => {
            if (downloadButtonRef.current) {
                const rect = downloadButtonRef.current.getBoundingClientRect();
                setDownloadIconPosition({ top: rect.top, left: rect.left });
                setDownloadMenuPosition({
                    top: rect.bottom + 8,
                    left: rect.left,
                });
            }
        };

        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);
        
        return () => {
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
        };
    }, [isDownloadMenuOpen]);

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

    const formatDate = (date) => {
        const correctedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        const year = correctedDate.getFullYear();
        const month = String(correctedDate.getMonth() + 1).padStart(2, '0');
        const dayOfMonth = String(correctedDate.getDate()).padStart(2, '0');
        return `${month}/${dayOfMonth}/${year}`;
    };

    const fetchDates = async () => {
        if (selectedDays.size === 0) {
            setAllDates([]);
            setTotalDates(0);
            return;
        }

        const order = sortOption === 'date-asc' ? 'ASC' : 'DESC';
        const params = new URLSearchParams({
            order,
            page: currentPage,
            limit: datesPerPage,
        });

        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        if (selectedDays.size < 7) {
            params.append('days', Array.from(selectedDays).join(','));
        }

        try {
            const response = await fetch(`/api/dates?${params.toString()}`);
            const data = await response.json();
            
            if (response.ok) {
                setAllDates(data.data);
                setTotalDates(data.total);
            } else {
                setStatusMessage('Failed to fetch dates.');
            }
        } catch (error) {
            setStatusMessage('Could not fetch dates.');
        }
    };

    const getSelectAllIcon = () => {
        const paginatedDates = new Set(allDates);
        if (paginatedDates.size === 0) return 'check_box_outline_blank';

        const selectedOnPageCount = Array.from(selectedDates).filter(date => paginatedDates.has(date)).length;

        if (selectedOnPageCount === paginatedDates.size) {
            return 'check_box';
        } else if (selectedOnPageCount > 0) {
            return 'indeterminate_check_box';
        } else {
            return 'check_box_outline_blank';
        }
    };

    const handleToggleSelect = (date) => {
        setSelectedDates(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(date)) {
                newSelected.delete(date);
            } else {
                newSelected.add(date);
            }
            return newSelected;
        });
    };

    const handleSelectAll = () => {
        const paginatedDates = new Set(allDates);
        const selectedOnPageCount = Array.from(selectedDates).filter(date => paginatedDates.has(date)).length;

        if (selectedOnPageCount === paginatedDates.size) {
            setSelectedDates(prev => {
                const newSet = new Set(prev);
                paginatedDates.forEach(date => newSet.delete(date));
                return newSet;
            });
        } else {
            setSelectedDates(prev => new Set([...prev, ...paginatedDates]));
        }
    };

    const handleRestoreDefaultDates = () => {
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        setSelectedDays(new Set([0, 1, 2, 3, 4, 5, 6]));
    };

    const handleClearSelection = () => {
        setSelectedDates(new Set());
    };

    const handleAddMenuToggle = (event) => {
        if (isAddMenuOpen) {
            setIsAddMenuOpen(false);
        } else {
            const rect = event.currentTarget.getBoundingClientRect();
            setAddIconPosition({ top: rect.top, left: rect.left });
            setAddMenuPosition({
                top: rect.bottom + 8,
                left: rect.right - 224,
            });
            setIsAddMenuOpen(true);
        }
    };

    const handleDownloadMenuToggle = (event) => {
        if (isDownloadMenuOpen) {
            setIsDownloadMenuOpen(false);
        } else {
            const rect = event.currentTarget.getBoundingClientRect();
            setDownloadIconPosition({ top: rect.top, left: rect.left });
            setDownloadMenuPosition({
                top: rect.bottom + 8,
                left: rect.left,
            });
            setIsDownloadMenuOpen(true);
        }
    };

    const handleClearDates = () => {
        setStartDate(null);
        setEndDate(null);
        setSelectedDays(new Set([0, 1, 2, 3, 4, 5, 6]));
    };

    const handleDeleteSuccess = () => {
        setIsDeleteDateModalOpen(false);
        const deletedDates = new Set(datesToDelete);
        setSelectedDates(prevSelected => {
            const newSelected = new Set(prevSelected);
            deletedDates.forEach(date => newSelected.delete(date));
            return newSelected;
        });
        setDatesToDelete([]);
        fetchDates();
    };

    const handleDeleteClick = () => {
        if (selectedDates.size > 0) {
            updateBounds();
            setIsDeleteOptionsModalOpen(true);
        } else {
            setStatusMessage("No dates selected.");
        }
    };

    const handleDeleteClickDate = (date) => {
        updateBounds();
        setDatesToDelete([date]);
        setIsDeleteDateModalOpen(true);
    };

    const handleDeleteCurrentPage = () => {
        setDatesToDelete(selectedDatesOnCurrentPage);
        setIsDeleteOptionsModalOpen(false);
        setIsDeleteDateModalOpen(true);
    };

    const handleDeleteAllSelected = () => {
        setDatesToDelete(Array.from(selectedDates));
        setIsDeleteOptionsModalOpen(false);
        setIsDeleteDateModalOpen(true);
    };

    const openDayFilterModal = () => {
        updateBounds();
        setIsDayFilterModalOpen(true);
    };

    const openNewScanModal = () => {
        updateBounds();
        setIsNewScanModalOpen(true);
    };

    const handleNewScanSuccess = () => {
        setIsNewScanModalOpen(false);
        fetchDateRange();
        fetchDates();
    };

    const openCategorySelectionModal = () => {
        setIsNewScanModalOpen(false);
        setIsCategorySelectionOpen(true);
    };

    const handleExportCSV = async (datesToExport) => {
        if (!datesToExport || datesToExport.length === 0) {
            setStatusMessage("No dates selected for export.");
            return;
        }

        const order = sortOption === 'date-asc' ? 'ASC' : 'DESC';

        try {
            const response = await fetch('/api/dates/export-csv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dates: datesToExport, order }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                const disposition = response.headers.get('content-disposition');
                let filename = 'dates.csv';
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
                const count = datesToExport.length;
                setStatusMessage(`Successfully exported ${count} dates.`);
            } else {
                const errorData = await response.json();
                setStatusMessage(errorData.error || 'Could not export dates to CSV.');
            }
        } catch (error) {
            setStatusMessage('Could not export dates to CSV.');
        }
    };

    const handleExportPDF = async (datesToExport) => {
        if (!datesToExport || datesToExport.length === 0) {
            setStatusMessage("No dates selected for export.");
            return;
        }

        const order = sortOption === 'date-asc' ? 'ASC' : 'DESC';

        try {
            const response = await fetch('/api/dates/export-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dates: datesToExport, order }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                const disposition = response.headers.get('content-disposition');
                let filename = 'dates.pdf';
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
                const count = datesToExport.length;
                setStatusMessage(`Successfully exported ${count} dates.`);
            } else {
                const errorData = await response.json();
                setStatusMessage(errorData.error || 'Could not export dates to PDF.');
            }
        } catch (error) {
            setStatusMessage('Could not export dates to PDF.');
        }
    };

    const handleExportCSVCurrentPage = () => {
        handleExportCSV(selectedDatesOnCurrentPage);
        setIsExportCSVModalOpen(false);
    };

    const handleExportCSVAllSelected = () => {
        handleExportCSV(Array.from(selectedDates));
        setIsExportCSVModalOpen(false);
    };

    const handleExportPDFCurrentPage = () => {
        handleExportPDF(selectedDatesOnCurrentPage);
        setIsExportPDFModalOpen(false);
    };

    const handleExportPDFAllSelected = () => {
        handleExportPDF(Array.from(selectedDates));
        setIsExportPDFModalOpen(false);
    };

    const openExportCSVModal = () => {
        if (selectedDates.size > 0) {
            updateBounds();
            setIsExportCSVModalOpen(true);
        } else {
            setStatusMessage("No dates selected.");
        }
    };

    const openExportPDFModal = () => {
        if (selectedDates.size > 0) {
            updateBounds();
            setIsExportPDFModalOpen(true);
        } else {
            setStatusMessage("No dates selected.");
        }
    };

    let shadowClass = '';
    if (isOverflowingTop && isOverflowingBottom) {
        shadowClass = 'scroll-shadow-both';
    } else if (isOverflowingTop) {
        shadowClass = 'scroll-shadow-top';
    } else if (isOverflowingBottom) {
        shadowClass = 'scroll-shadow-bottom';
    }

    const anyModalIsOpen =
        isDeleteDateModalOpen ||
        isDayFilterModalOpen ||
        isDeleteOptionsModalOpen ||
        isNewScanModalOpen ||
        isCategorySelectionOpen ||
        isExportCSVModalOpen ||
        isExportPDFModalOpen;


    return (
        <>
            <main className="container mx-auto p-6 flex-1 flex flex-col min-h-0">
                <div
                    ref={contentBoxRef}
                    className="content-box-fix relative bg-[var(--theme-card-bg)] p-6 rounded-xl border border-[var(--theme-outline)] backdrop-blur-lg flex-1 flex flex-col overflow-hidden"
                >
                    {!anyModalIsOpen && (
                        <StatusMessage message={statusMessage} onDismiss={() => setStatusMessage("")} />
                    )}
                    <div className="relative flex justify-center items-center mb-6">
                        <div className="absolute left-0 flex items-center gap-2">
                            <motion.div
                                whileHover={selectedDates.size > 0 ? { scale: 1.05 } : {}}
                                whileTap={selectedDates.size > 0 ? { scale: 0.95 } : {}}
                            >
                                    <md-outlined-icon-button
                                        ref={clearSelectionButtonRef}
                                        onClick={handleClearSelection}
                                    >
                                    <md-icon>history</md-icon>
                                </md-outlined-icon-button>
                            </motion.div>
                            <motion.div
                                whileHover={allDates.length > 0 ? { scale: 1.05 } : {}}
                                whileTap={allDates.length > 0 ? { scale: 0.95 } : {}}
                            >
                                <md-outlined-icon-button ref={selectAllButtonRef} onClick={handleSelectAll}>
                                    <md-icon>{getSelectAllIcon()}</md-icon>
                                </md-outlined-icon-button>
                            </motion.div>
                            <motion.div
                                whileHover={selectedDates.size > 0 ? { scale: 1.05 } : {}}
                                whileTap={selectedDates.size > 0 ? { scale: 0.95 } : {}}
                            >
                                <md-outlined-icon-button
                                    ref={downloadButtonRef}
                                    onClick={handleDownloadMenuToggle}
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
                                    onClick={handleDeleteClick}
                                >
                                    <md-icon>delete</md-icon>
                                </md-outlined-icon-button>
                            </motion.div>
                        </div>
                        <h1 className="text-3xl font-bold text-[var(--theme-text)]">Dates</h1>
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
                                    ref={addButtonRef}
                                    onClick={handleAddMenuToggle}
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
                                        onChange={(e) => {
                                            const newStartDate = e.target.value;
                                            setStartDate(newStartDate);
                                            if (endDate && newStartDate > endDate) {
                                                setEndDate(newStartDate);
                                            }
                                        }}
                                        className="p-1.5 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                                    />
                                    <span className="text-[var(--theme-text)]">to</span>
                                    <input
                                        type="date"
                                        value={endDate || ''}
                                        min={startDate || ''}
                                        onChange={(e) => setEndDate(e.target.value)}
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

                    <div
                        ref={scrollContainerRef}
                        className={`flex-1 overflow-y-auto ${shadowClass}`}
                    >
                        <div className="flex flex-col gap-4">
                            {allDates.map((dateString) => {
                                const isSelected = selectedDates.has(dateString);
                                const date = new Date(dateString);
                                const formattedDate = formatDate(date);

                                return (
                                    <motion.div
                                        key={dateString}
                                        whileHover={{ boxShadow: "inset 0 0 0 2px var(--theme-primary)" }}
                                        className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'bg-[var(--theme-highlight)] border-[var(--theme-primary)]'
                                                : 'border-[var(--theme-outline)]'
                                        }`}
                                        onClick={() => handleToggleSelect(dateString)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <md-icon-button onClick={() => handleToggleSelect(dateString)}>
                                                    <md-icon>{isSelected ? 'check_box' : 'check_box_outline_blank'}</md-icon>
                                                </md-icon-button>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-lg font-tabular-nums">{formattedDate}</p>
                                            </div>
                                        </div>

                                        <div onClick={(e) => e.stopPropagation()} className="flex gap-2 items-center">
                                            <md-icon-button onClick={() => navigate(`/dates/${dateString}`, { state: { from: '/dates' } })}>
                                                <md-icon>calendar_today</md-icon>
                                            </md-icon-button>
                                            <md-icon-button onClick={() => handleDeleteClickDate(dateString)}>
                                                <md-icon>delete</md-icon>
                                            </md-icon-button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                         {totalDates === 0 && (
                            <p className="text-center p-8 text-[var(--theme-text)] opacity-70">No dates found.</p>
                        )}
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <motion.div
                                whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
                                whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
                            >
                                <md-outlined-icon-button ref={firstPageButtonRef} onClick={() => setCurrentPage(1)}>
                                    <md-icon>keyboard_double_arrow_left</md-icon>
                                </md-outlined-icon-button>
                            </motion.div>
                            <motion.div
                                whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
                                whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
                            >
                                <md-outlined-icon-button ref={prevPageButtonRef} onClick={() => setCurrentPage(p => p - 1)}>
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
                                <md-outlined-icon-button ref={nextPageButtonRef} onClick={() => setCurrentPage(p => p + 1)}>
                                    <md-icon>keyboard_arrow_right</md-icon>
                                </md-outlined-icon-button>
                            </motion.div>
                            <motion.div
                                whileHover={currentPage < totalPages ? { scale: 1.05 } : {}}
                                whileTap={currentPage < totalPages ? { scale: 0.95 } : {}}
                            >
                                <md-outlined-icon-button ref={lastPageButtonRef} onClick={() => setCurrentPage(totalPages)}>
                                    <md-icon>keyboard_double_arrow_right</md-icon>
                                </md-outlined-icon-button>
                            </motion.div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--theme-text)]">
                                Results: {totalDates}
                            </span>
                            <div className="relative">
                                <select
                                    value={sortOption}
                                    onChange={(e) => {
                                        setSortOption(e.target.value);
                                        setCurrentPage(1);
                                    }}
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
                                    value={datesPerPage}
                                    onChange={(e) => {
                                        setDatesPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    onClick={() => setIsDatesPerPageOpen(!isDatesPerPageOpen)}
                                    onBlur={() => setIsDatesPerPageOpen(false)}
                                    className="appearance-none p-2 pl-3 pr-8 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                                >
                                    <option value="5">5</option>
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                                    <md-icon>{isDatesPerPageOpen ? 'unfold_less' : 'unfold_more'}</md-icon>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {createPortal(
                <AnimatePresence>
                    {isDayFilterModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDayFilterModalOpen(false)}
                        >
                            <motion.div
                                style={{
                                    position: 'fixed',
                                    top: contentBoxBounds.top + (contentBoxBounds.height * 0.15),
                                    left: contentBoxBounds.left + (contentBoxBounds.width * 0.15),
                                    width: contentBoxBounds.width * 0.7,
                                    height: contentBoxBounds.height * 0.7,
                                }}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <DayFilterPage
                                    onClose={() => setIsDayFilterModalOpen(false)}
                                    selectedDays={selectedDays}
                                    setSelectedDays={setSelectedDays}
                                    onBack={() => {
                                        setIsDayFilterModalOpen(false);
                                    }}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.getElementById('portal-root')
            )}
            {createPortal(
                <AnimatePresence>
                    {isDeleteOptionsModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDeleteOptionsModalOpen(false)}
                        >
                            <motion.div
                                style={{
                                    position: 'fixed',
                                    top: contentBoxBounds.top + (contentBoxBounds.height * 0.15),
                                    left: contentBoxBounds.left + (contentBoxBounds.width * 0.15),
                                    width: contentBoxBounds.width * 0.7,
                                    height: contentBoxBounds.height * 0.7,
                                }}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <DeletePage
                                    title="Delete Scans by Date"
                                    onClose={() => setIsDeleteOptionsModalOpen(false)}
                                    onDeleteCurrent={handleDeleteCurrentPage}
                                    onDeleteSelected={handleDeleteAllSelected}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.getElementById('portal-root')
            )}
            {createPortal(
                <AnimatePresence>
                    {isDeleteDateModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDeleteDateModalOpen(false)}
                        >
                            <motion.div
                                style={{
                                    position: 'fixed',
                                    top: contentBoxBounds.top + (contentBoxBounds.height * 0.15),
                                    left: contentBoxBounds.left + (contentBoxBounds.width * 0.15),
                                    width: contentBoxBounds.width * 0.7,
                                    height: contentBoxBounds.height * 0.7,
                                }}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <DeleteDatePage
                                    statusMessage={statusMessage}
                                    setStatusMessage={setStatusMessage}
                                    onClose={() => setIsDeleteDateModalOpen(false)}
                                    dates={datesToDelete}
                                    onSuccess={handleDeleteSuccess}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.getElementById('portal-root')
            )}
            {createPortal(
                <AnimatePresence>
                    {isAddMenuOpen && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddMenuOpen(false)}
                        >
                            <motion.div
                                className="absolute"
                                style={{ top: `${addIconPosition.top}px`, left: `${addIconPosition.left}px` }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <md-outlined-icon-button onClick={() => setIsAddMenuOpen(false)}>
                                    <md-icon>add</md-icon>
                                </md-outlined-icon-button>
                            </motion.div>
                            <motion.div
                                style={{ top: `${addMenuPosition.top}px`, left: `${addMenuPosition.left}px` }}
                                className="absolute w-56 bg-[var(--theme-card-bg)] border border-[var(--theme-outline)] rounded-md shadow-lg z-50"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.1 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ul className="py-1">
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); openNewScanModal(); setIsAddMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                                            <md-icon>add_circle</md-icon>
                                            <span>Create New Scan</span>
                                        </a>
                                    </li>
                                </ul>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.getElementById('portal-root')
            )}
            {createPortal(
                <AnimatePresence>
                    {isNewScanModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsNewScanModalOpen(false)}
                        >
                            <motion.div
                                style={{
                                    position: 'fixed',
                                    top: contentBoxBounds.top + (contentBoxBounds.height * 0.15),
                                    left: contentBoxBounds.left + (contentBoxBounds.width * 0.15),
                                    width: contentBoxBounds.width * 0.7,
                                    height: contentBoxBounds.height * 0.7,
                                }}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <NewScanPage
                                    statusMessage={statusMessage}
                                    setStatusMessage={setStatusMessage}
                                    onClose={() => setIsNewScanModalOpen(false)}
                                    onSuccess={handleNewScanSuccess}
                                    onCategorySelect={openCategorySelectionModal}
                                    allCategories={allCategories}
                                    selectedCategory={selectedCategory}
                                    setSelectedCategory={setSelectedCategory}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.getElementById('portal-root')
            )}
             {createPortal(
                <AnimatePresence>
                    {isCategorySelectionOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCategorySelectionOpen(false)}
                        >
                            <motion.div
                                style={{
                                    position: 'fixed',
                                    top: contentBoxBounds.top + (contentBoxBounds.height * 0.15),
                                    left: contentBoxBounds.left + (contentBoxBounds.width * 0.15),
                                    width: contentBoxBounds.width * 0.7,
                                    height: contentBoxBounds.height * 0.7,
                                }}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <CategorySelectionPage
                                    allCategories={allCategories}
                                    selectedCategory={selectedCategory}
                                    setSelectedCategory={setSelectedCategory}
                                    onClose={() => setIsCategorySelectionOpen(false)}
                                    onBack={() => {
                                        setIsCategorySelectionOpen(false);
                                        setIsNewScanModalOpen(true);
                                    }}
                                    showBackButton={true}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.getElementById('portal-root')
            )}
            {createPortal(
                <AnimatePresence>
                    {isDownloadMenuOpen && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDownloadMenuOpen(false)}
                        >
                            <motion.div
                                className="absolute"
                                style={{ top: `${downloadIconPosition.top}px`, left: `${downloadIconPosition.left}px` }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <md-outlined-icon-button onClick={() => setIsDownloadMenuOpen(false)}>
                                    <md-icon>download</md-icon>
                                </md-outlined-icon-button>
                            </motion.div>
                            <motion.div
                                style={{ top: `${downloadMenuPosition.top}px`, left: `${downloadMenuPosition.left}px` }}
                                className="absolute w-56 bg-[var(--theme-card-bg)] border border-[var(--theme-outline)] rounded-md shadow-lg z-50"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.1 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ul className="py-1">
                                    <li>
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                openExportPDFModal();
                                                setIsDownloadMenuOpen(false);
                                            }}
                                            className={`flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] ${selectedDates.size > 0 ? 'hover:bg-[var(--theme-highlight)]' : 'opacity-50 cursor-not-allowed'}`}
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
                                                setIsDownloadMenuOpen(false);
                                            }}
                                            className={`flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] ${selectedDates.size > 0 ? 'hover:bg-[var(--theme-highlight)]' : 'opacity-50 cursor-not-allowed'}`}
                                        >
                                            <md-icon>csv</md-icon>
                                            <span>Export to CSV</span>
                                        </a>
                                    </li>
                                </ul>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.getElementById('portal-root')
            )}
             {createPortal(
                <AnimatePresence>
                    {isExportCSVModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsExportCSVModalOpen(false)}
                        >
                            <motion.div
                                style={{
                                    position: 'fixed',
                                    top: contentBoxBounds.top + (contentBoxBounds.height * 0.15),
                                    left: contentBoxBounds.left + (contentBoxBounds.width * 0.15),
                                    width: contentBoxBounds.width * 0.7,
                                    height: contentBoxBounds.height * 0.7,
                                }}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExportToCSVPage
                                    statusMessage={statusMessage}
                                    setStatusMessage={setStatusMessage}
                                    onClose={() => setIsExportCSVModalOpen(false)}
                                    onExportCurrent={handleExportCSVCurrentPage}
                                    onExportSelected={handleExportCSVAllSelected}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.getElementById('portal-root')
            )}

            {createPortal(
                <AnimatePresence>
                    {isExportPDFModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsExportPDFModalOpen(false)}
                        >
                            <motion.div
                                style={{
                                    position: 'fixed',
                                    top: contentBoxBounds.top + (contentBoxBounds.height * 0.15),
                                    left: contentBoxBounds.left + (contentBoxBounds.width * 0.15),
                                    width: contentBoxBounds.width * 0.7,
                                    height: contentBoxBounds.height * 0.7,
                                }}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExportToPDFPage
                                    statusMessage={statusMessage}
                                    setStatusMessage={setStatusMessage}
                                    onClose={() => setIsExportPDFModalOpen(false)}
                                    onExportCurrent={handleExportPDFCurrentPage}
                                    onExportSelected={handleExportPDFAllSelected}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.getElementById('portal-root')
            )}
        </>
    );
};

export default DatesPage;
