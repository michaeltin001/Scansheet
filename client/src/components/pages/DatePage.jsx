import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StatusMessage from '../ui/StatusMessage';
import CategoryFilterPage from '../modals/filter/CategoryFilterPage';
import DeleteScanPage from '../modals/scan/DeleteScanPage';
import NewScanPage from '../modals/scan/NewScanPage';
import EditScanPage from '../modals/scan/EditScanPage';
import ExportOptionsPage from '../modals/common/ExportOptionsPage';
import CategorySelectionPage from '../modals/filter/CategorySelectionPage';
import { useOverflow } from '../../hooks/useOverflow';
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";
import "@material/web/iconbutton/filled-icon-button.js";

const DatePage = ({ statusMessage, setStatusMessage }) => {
    const { date } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [scans, setScans] = useState([]);
    const [totalScans, setTotalScans] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [scansPerPage, setScansPerPage] = useState(() => {
        const saved = localStorage.getItem('scansPerPage');
        return saved ? parseInt(saved, 10) : 50;
    });
    const [sortOption, setSortOption] = useState(() => {
        const savedSortOption = localStorage.getItem('scanSortOption');
        return savedSortOption || 'date-desc';
    });
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isScansPerPageOpen, setIsScansPerPageOpen] = useState(false);
    const [isNewScanModalOpen, setIsNewScanModalOpen] = useState(false);
    const [isEditScanModalOpen, setIsEditScanModalOpen] = useState(false);
    const [scanToEdit, setScanToEdit] = useState(null);
    const [isDeleteScanModalOpen, setIsDeleteScanModalOpen] = useState(false);
    const [scanToDelete, setScanToDelete] = useState(null);
    const [contentBoxBounds, setContentBoxBounds] = useState(null);
    const [isDateFilterActive, setIsDateFilterActive] = useState(false);
    const [isCategoryFilterModalOpen, setIsCategoryFilterModalOpen] = useState(false);
    const [isCategorySelectionOpen, setIsCategorySelectionOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportType, setExportType] = useState(null);
    const [exportTitle, setExportTitle] = useState('');
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [selectedCategory, setSelectedCategory] = useState(() => {
        return localStorage.getItem('selectedCategory') || '';
    });
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
    const [downloadMenuPosition, setDownloadMenuPosition] = useState({});
    const [downloadIconPosition, setDownloadIconPosition] = useState({});
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const [optionsMenuPosition, setOptionsMenuPosition] = useState({});
    const [optionsIconPosition, setOptionsIconPosition] = useState({});
    const contentBoxRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const dateFilterRef = useRef(null);
    const downloadButtonRef = useRef(null);
    const optionsButtonRef = useRef(null);
    const firstPageButtonRef = useRef(null);
    const prevPageButtonRef = useRef(null);
    const nextPageButtonRef = useRef(null);
    const lastPageButtonRef = useRef(null);

    const { isOverflowingTop, isOverflowingBottom } = useOverflow(scrollContainerRef, scans);
    const totalPages = Math.ceil(totalScans / scansPerPage);

    const updateBounds = () => {
        if (contentBoxRef.current) {
            setContentBoxBounds(contentBoxRef.current.getBoundingClientRect());
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const categoriesResponse = await fetch('/api/categories');
                const categoriesData = await categoriesResponse.json();
                if (categoriesResponse.ok) {
                    setAllCategories(categoriesData.data);
                    setSelectedCategories(new Set(categoriesData.data.map(c => c.code)));
                    if (!localStorage.getItem('selectedCategory')) {
                        const generalCategory = categoriesData.data.find(c => c.name === 'General');
                        if (generalCategory) {
                            setSelectedCategory(generalCategory.code);
                        }
                    }
                }

            } catch (error) {
                setStatusMessage(error.message);
                navigate('/dates');
            }
        };

        fetchInitialData();
    }, [date]);

    useEffect(() => {
        localStorage.setItem('selectedCategory', selectedCategory);
    }, [selectedCategory]);

    useEffect(() => {
        window.addEventListener('resize', updateBounds);
        return () => {
            window.removeEventListener('resize', updateBounds);
        };
    }, []);

    useEffect(() => {
        fetchScans();
    }, [currentPage, sortOption, scansPerPage, selectedCategories]);

    useEffect(() => {
        localStorage.setItem('scanSortOption', sortOption);
    }, [sortOption]);

    useEffect(() => {
        localStorage.setItem('scansPerPage', String(scansPerPage));
    }, [scansPerPage]);

    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                setIsDownloadMenuOpen(false);
                setIsCategoryFilterModalOpen(false);
                setIsNewScanModalOpen(false);
                setIsEditScanModalOpen(false);
                setIsOptionsMenuOpen(false);
                setIsDeleteScanModalOpen(false);
                setIsCategorySelectionOpen(false);
            }
        };
        document.addEventListener("keydown", handleEscKey);
        return () => {
            document.removeEventListener("keydown", handleEscKey);
        };
    }, []);

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
        if (!isOptionsMenuOpen) return;

        const handleReposition = () => {
            if (optionsButtonRef.current) {
                const rect = optionsButtonRef.current.getBoundingClientRect();
                setOptionsIconPosition({ top: rect.top, left: rect.left });
                setOptionsMenuPosition({
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
    }, [isOptionsMenuOpen]);

    const formattedDisplayDate = () => {
        if (!date) return '';
        const [year, month, day] = date.split('-');
        return `${month}/${day}/${year}`;
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dayOfMonth = String(date.getDate()).padStart(2, '0');
        return `${month}/${dayOfMonth}/${year}`;
    };

    const formatTime24Hour = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const fetchScans = async () => {
        if (selectedCategories.size === 0) {
            setScans([]);
            setTotalScans(0);
            return;
        }

        const order = sortOption === 'date-asc' ? 'ASC' : 'DESC';
        const params = new URLSearchParams({
            order,
            page: currentPage,
            limit: scansPerPage,
        });

        if (allCategories.length > 0 && selectedCategories.size < allCategories.length) {
            params.append('categories', Array.from(selectedCategories).join(','));
        }

        try {
            const response = await fetch(`/api/scans/${date}?${params.toString()}`);
            const data = await response.json();
            if (response.ok) {
                setScans(data.data);
                setTotalScans(data.total);
            }
        } catch (error) {
            setStatusMessage('Could not load scan history.');
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

    const handleOptionsMenuToggle = (event) => {
        if (isOptionsMenuOpen) {
            setIsOptionsMenuOpen(false);
        } else {
            const rect = event.currentTarget.getBoundingClientRect();
            setOptionsIconPosition({ top: rect.top, left: rect.left });
            setOptionsMenuPosition({
                top: rect.bottom + 8,
                left: rect.right - 224,
            });
            setIsOptionsMenuOpen(true);
        }
    };

    const handleExport = (options) => {
        if (exportType === 'pdf') {
            handleExportPDF(options);
        } else if (exportType === 'csv') {
            handleExportCSV(options);
        }
        setIsExportModalOpen(false);
    };

    const handleExportPDF = async ({ removeDuplicates, alphabetize, compareFilePath, compareFileName }) => {
        const order = sortOption === 'date-asc' ? 'ASC' : 'DESC';

        const requestBody = {
            order,
            removeDuplicates,
            alphabetize,
            compareFilePath,
            compareFileName,
        };

        if (allCategories.length > 0 && selectedCategories.size < allCategories.length) {
            requestBody.categories = Array.from(selectedCategories).join(',');
        }

        try {
            const response = await fetch(`/api/dates/export-pdf/${date}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                const disposition = response.headers.get('content-disposition');
                let filename = `scans_${date}.pdf`;
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
                setStatusMessage(`Successfully generated PDF.`);
            } else {
                const errorData = await response.json();
                setStatusMessage(errorData.error || 'Could not generate PDF.');
            }
        } catch (error) {
            setStatusMessage('Could not generate PDF.');
        } finally {
            setIsDownloadMenuOpen(false);
        }
    };

    const handleExportCSV = async ({ removeDuplicates, alphabetize, compareFilePath, compareFileName }) => {
        const order = sortOption === 'date-asc' ? 'ASC' : 'DESC';

        const requestBody = {
            order,
            removeDuplicates,
            alphabetize,
            compareFilePath,
            compareFileName,
        };

        if (allCategories.length > 0 && selectedCategories.size < allCategories.length) {
            requestBody.categories = Array.from(selectedCategories).join(',');
        }

        try {
            const response = await fetch(`/api/dates/export-csv/${date}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                const disposition = response.headers.get('content-disposition');
                let filename = `scans_${date}.csv`;
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
                setStatusMessage(`Successfully exported scans.`);
            } else {
                const errorData = await response.json();
                setStatusMessage(errorData.error || 'Could not download scans.');
            }
        } catch (error) {
            setStatusMessage('Could not download scans.');
        } finally {
            setIsDownloadMenuOpen(false);
        }
    };

    const handleRestoreCategories = () => {
        setSelectedCategories(new Set(allCategories.map(c => c.code)));
    }

    const openCategoryFilterModal = () => {
        updateBounds();
        setIsCategoryFilterModalOpen(true);
    };

    const openDeleteScanModal = (scan) => {
        setScanToDelete(scan.date);
        updateBounds();
        setIsDeleteScanModalOpen(true);
    };

    const handleDeleteScanSuccess = () => {
        setIsDeleteScanModalOpen(false);
        setScanToDelete(null);
        fetchScans();
        setTimeout(() => {
            setStatusMessage("Successfully deleted scan.");
        }, 500);
    };

    const openNewScanModal = () => {
        updateBounds();
        setIsNewScanModalOpen(true);
    };

    const handleNewScanSuccess = () => {
        setIsNewScanModalOpen(false);
        fetchScans();
        setTimeout(() => {
            setStatusMessage("Successfully created scan.");
        }, 500);
    };

    const openCategorySelectionModal = () => {
        setIsNewScanModalOpen(false);
        setIsCategorySelectionOpen(true);
    };

    const openEditScanModal = (scan) => {
        setScanToEdit(scan);
        updateBounds();
        setIsEditScanModalOpen(true);
    };

    const handleEditScanSuccess = () => {
        setIsEditScanModalOpen(false);
        setScanToEdit(null);
        fetchScans();
        setTimeout(() => {
            setStatusMessage("Successfully updated scan.");
        }, 500);
    };

    const openExportModal = (type) => {
        updateBounds();
        setExportType(type);
        setExportTitle(type === 'pdf' ? 'Export to PDF' : 'Export to CSV');
        setIsExportModalOpen(true);
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
        isCategoryFilterModalOpen ||
        isDeleteScanModalOpen ||
        isNewScanModalOpen ||
        isEditScanModalOpen ||
        isExportModalOpen ||
        isCategorySelectionOpen;

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
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <md-outlined-icon-button onClick={() => navigate(location.state?.from || '/dates')}>
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
                    <h1 className="text-3xl font-bold text-[var(--theme-text)]">{formattedDisplayDate()}</h1>
                    <div className="absolute right-0 flex items-center gap-2">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            {isDateFilterActive ? (
                                <md-filled-icon-button onClick={() => {
                                    setIsDateFilterActive(false);
                                    handleRestoreCategories();
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
                                <md-icon-button onClick={openCategoryFilterModal}>
                                    <md-icon>menu</md-icon>
                                </md-icon-button>
                                <input
                                    type="date"
                                    value={date || ''}
                                    disabled
                                    className="p-1.5 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                                />
                                <span className="text-[var(--theme-text)]">to</span>
                                <input
                                    type="date"
                                    value={date || ''}
                                    disabled
                                    className="p-1.5 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                                />
                                <div className="absolute right-0 z-10 flex items-center gap-2">
                                    <md-icon-button onClick={handleRestoreCategories}>
                                        <md-icon>history</md-icon>
                                    </md-icon-button>
                                    <md-icon-button onClick={handleRestoreCategories}>
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
                        {scans.map((scan, index) => {
                            const scanDate = new Date(scan.date);
                            const formattedScanDate = formatDate(scanDate);
                            const formattedTime = formatTime24Hour(scanDate);

                            return (
                                <motion.div
                                    key={index}
                                    whileHover={{ boxShadow: "inset 0 0 0 2px var(--theme-primary)" }}
                                    className="border border-[var(--theme-outline)] rounded-lg p-4 flex justify-between items-center"
                                >
                                    <div>
                                        <p className="opacity-70 text-xs">Category: {scan.category_name}</p>
                                        <p className="font-semibold text-lg">{scan.entry_name}</p>
                                        <p className="font-semibold text-lg font-tabular-nums">{`${formattedScanDate} at ${formattedTime}`}</p>
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()} className="flex gap-2 items-center">
                                        <md-icon-button onClick={() => openEditScanModal(scan)}>
                                            <md-icon>edit</md-icon>
                                        </md-icon-button>
                                        <md-icon-button onClick={() => openDeleteScanModal(scan)}>
                                            <md-icon>delete</md-icon>
                                        </md-icon-button>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {scans.length === 0 && (
                            <p className="text-center p-8 text-[var(--theme-text)] opacity-70">No scan history available.</p>
                        )}
                    </div>
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
                            Results: {totalScans}
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
                                value={scansPerPage}
                                onChange={(e) => {
                                    setScansPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
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
            </div>
        </main>
        {createPortal(
            <AnimatePresence>
                {isCategoryFilterModalOpen && contentBoxBounds && (
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCategoryFilterModalOpen(false)}
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
                            <CategoryFilterPage
                                onClose={() => setIsCategoryFilterModalOpen(false)}
                                allCategories={allCategories}
                                selectedCategories={selectedCategories}
                                setSelectedCategories={setSelectedCategories}
                                onBack={() => {
                                    setIsCategoryFilterModalOpen(false);
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
                                    <a href="#" onClick={(e) => { e.preventDefault(); openExportModal('pdf'); setIsDownloadMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                                        <md-icon>picture_as_pdf</md-icon>
                                        <span>Export to PDF</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); openExportModal('csv'); setIsDownloadMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
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
                {isDeleteScanModalOpen && contentBoxBounds && (
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsDeleteScanModalOpen(false)}
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
                            <DeleteScanPage
                                statusMessage={statusMessage}
                                setStatusMessage={setStatusMessage}
                                onClose={() => setIsDeleteScanModalOpen(false)}
                                scanTimestamp={scanToDelete}
                                onSuccess={handleDeleteScanSuccess}
                            />
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
                                mode="date"
                                prefilledDate={date}
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
                {isEditScanModalOpen && contentBoxBounds && (
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsEditScanModalOpen(false)}
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
                            <EditScanPage
                                statusMessage={statusMessage}
                                setStatusMessage={setStatusMessage}
                                onClose={() => setIsEditScanModalOpen(false)}
                                scan={scanToEdit}
                                onUpdate={handleEditScanSuccess}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.getElementById('portal-root')
        )}
        {createPortal(
            <AnimatePresence>
                {isExportModalOpen && contentBoxBounds && (
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsExportModalOpen(false)}
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
                            <ExportOptionsPage
                                statusMessage={statusMessage}
                                setStatusMessage={setStatusMessage}
                                onClose={() => setIsExportModalOpen(false)}
                                onExport={handleExport}
                                title={exportTitle}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.getElementById('portal-root')
        )}
        {createPortal(
            <AnimatePresence>
                {isOptionsMenuOpen && (
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOptionsMenuOpen(false)}
                    >
                        <motion.div
                            className="absolute"
                            style={{ top: `${optionsIconPosition.top}px`, left: `${optionsIconPosition.left}px` }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <md-outlined-icon-button onClick={() => setIsOptionsMenuOpen(false)}>
                                <md-icon>more_vert</md-icon>
                            </md-outlined-icon-button>
                        </motion.div>
                        <motion.div
                            style={{ top: `${optionsMenuPosition.top}px`, left: `${optionsMenuPosition.left}px` }}
                            className="absolute w-56 bg-[var(--theme-card-bg)] border border-[var(--theme-outline)] rounded-md shadow-lg z-50"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ul className="py-1">
                                <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); openNewScanModal(); setIsOptionsMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
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
    </>
    );
};

export default DatePage;
