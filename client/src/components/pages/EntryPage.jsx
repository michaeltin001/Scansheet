import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StatusMessage from '../ui/StatusMessage';
import EditEntryPage from '../modals/entry/EditEntryPage';
import EditScanPage from '../modals/scan/EditScanPage';
import DeleteEntryPage from '../modals/entry/DeleteEntryPage';
import DeleteScanPage from '../modals/scan/DeleteScanPage';
import EntryQRCodePage from '../modals/entry/EntryQRCodePage';
import DayFilterPage from '../modals/filter/DayFilterPage';
import CategoryFilterPage from '../modals/filter/CategoryFilterPage';
import NewScanPage from '../modals/scan/NewScanPage';
import FilterPage from '../modals/filter/FilterPage';
import CategorySelectionPage from '../modals/filter/CategorySelectionPage';
import { useOverflow } from '../../hooks/useOverflow';
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";
import "@material/web/iconbutton/filled-icon-button.js";

const EntryPage = ({ statusMessage, setStatusMessage }) => {
    const { code } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [entry, setEntry] = useState(null);
    const [name, setName] = useState('');
    const [isEditEntryModalOpen, setIsEditEntryModalOpen] = useState(false);
    const [isNewScanModalOpen, setIsNewScanModalOpen] = useState(false);
    const [isEditScanModalOpen, setIsEditScanModalOpen] = useState(false);
    const [scanToEdit, setScanToEdit] = useState(null);
    const [isDeleteEntryModalOpen, setIsDeleteEntryModalOpen] = useState(false);
    const [isDeleteScanModalOpen, setIsDeleteScanModalOpen] = useState(false);
    const [scanToDelete, setScanToDelete] = useState(null);
    const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
    const [contentBoxBounds, setContentBoxBounds] = useState(null);
    const [isDateFilterActive, setIsDateFilterActive] = useState(false);
    const [isDayFilterModalOpen, setIsDayFilterModalOpen] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [defaultStartDate, setDefaultStartDate] = useState(null);
    const [defaultEndDate, setDefaultEndDate] = useState(null);
    const [selectedDays, setSelectedDays] = useState(new Set([0, 1, 2, 3, 4, 5, 6]));
    const [isCategoryFilterModalOpen, setIsCategoryFilterModalOpen] = useState(false);
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [isCategorySelectionOpen, setIsCategorySelectionOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(() => {
        return localStorage.getItem('selectedCategory') || '';
    });

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
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

    const [scans, setScans] = useState([]);
    const { isOverflowingTop, isOverflowingBottom } = useOverflow(scrollContainerRef, scans);
    const [totalScans, setTotalScans] = useState(0);
    const [sortOption, setSortOption] = useState(() => {
        const savedSortOption = localStorage.getItem('scanSortOption');
        return savedSortOption || 'date-desc';
    });
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [scansPerPage, setScansPerPage] = useState(() => {
        const saved = localStorage.getItem('scansPerPage');
        return saved ? parseInt(saved, 10) : 50;
    });
    const [isScansPerPageOpen, setIsScansPerPageOpen] = useState(false);
    const totalPages = Math.ceil(totalScans / scansPerPage);

    const updateBounds = () => {
        if (contentBoxRef.current) {
            setContentBoxBounds(contentBoxRef.current.getBoundingClientRect());
        }
    };

    const handleQRCodeUpdate = (newEntry) => {
        setIsQRCodeModalOpen(false);
        navigate(`/entries/${newEntry.code}`, { state: { showQRCode: true } });
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            await fetchEntry();
            await fetchDateRange();

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
            }
        };

        fetchInitialData();
    }, [code]);

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
        if (entry) {
            fetchScans();
        }
    }, [entry, currentPage, sortOption, scansPerPage, startDate, endDate, selectedDays, selectedCategories]);

    useEffect(() => {
        localStorage.setItem('scanSortOption', sortOption);
    }, [sortOption]);

    useEffect(() => {
        localStorage.setItem('scansPerPage', String(scansPerPage));
    }, [scansPerPage]);

    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                setIsEditEntryModalOpen(false);
                setIsDeleteEntryModalOpen(false);
                setIsQRCodeModalOpen(false);
                setIsDeleteScanModalOpen(false);
                setIsEditScanModalOpen(false);
                setIsOptionsMenuOpen(false);
                setIsDownloadMenuOpen(false);
                setIsDayFilterModalOpen(false);
                setIsCategoryFilterModalOpen(false);
                setIsNewScanModalOpen(false);
                setIsFilterModalOpen(false);
                setIsCategorySelectionOpen(false);
            }
        };
        document.addEventListener("keydown", handleEscKey);
        return () => {
            document.removeEventListener("keydown", handleEscKey);
        };
    }, [isDateFilterActive]);

    useEffect(() => {
        if (entry && location.state?.showQRCode) {
            openQRCodeModal();
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [entry, location.state]);

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

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dayOfMonth = String(date.getDate()).padStart(2, '0');
        return `${month}/${dayOfMonth}/${year}`;
    };

    const formatTime12Hour = (date) => {
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const paddedHours = String(hours).padStart(2, '0');
        return `${paddedHours}:${minutes}:${seconds} ${ampm}`;
    };

    const formatTime24Hour = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const fetchScans = async () => {
        if (selectedDays.size === 0 || selectedCategories.size === 0) {
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

        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        if (selectedDays.size < 7) {
            params.append('days', Array.from(selectedDays).join(','));
        }

        if (allCategories.length > 0 && selectedCategories.size < allCategories.length) {
            params.append('categories', Array.from(selectedCategories).join(','));
        }

        try {
            const response = await fetch(`/api/entry/${code}/scans?${params.toString()}`);
            const data = await response.json();
            if (response.ok) {
                setScans(data.data);
                setTotalScans(data.total);
            }
        } catch (error) {
            setStatusMessage('Could not load scan history.');
        }
    };

    const fetchEntry = async () => {
        try {
            const entryResponse = await fetch(`/api/entry/${code}`);
            const entryData = await entryResponse.json();

            if (!entryResponse.ok) {
                throw new Error(entryData.error || 'Failed to fetch entry.');
            }

            setEntry(entryData.data);
            setName(entryData.data.name);
        } catch (error) {
            setStatusMessage(error.message);
            navigate('/entries');
        }
    };

    const fetchDateRange = async () => {
        try {
            const dateRangeResponse = await fetch(`/api/entry/${code}/date-range`);
            const dateRangeData = await dateRangeResponse.json();

            if (dateRangeResponse.ok && dateRangeData.data.minDate) {
                const { minDate, maxDate } = dateRangeData.data;
                setStartDate(minDate);
                setEndDate(maxDate);
                setDefaultStartDate(minDate);
                setDefaultEndDate(maxDate);
            }
        } catch (error) {
            console.error("Failed to fetch date range:", error);
        }
    };

    const handleCopyCode = async () => {
        if (entry && entry.code) {
            try {
                await navigator.clipboard.writeText(entry.code);
                setStatusMessage("Copied code to clipboard.");
            } catch (err) {
                setStatusMessage("Could not copy code.");
            }
        }
    };

    const handleClearDates = () => {
        setStartDate(null);
        setEndDate(null);
        setSelectedDays(new Set([0, 1, 2, 3, 4, 5, 6]));
        setSelectedCategories(new Set(allCategories.map(c => c.code)));
        // const startDateInput = document.getElementById('start-date-input');
        // const endDateInput = document.getElementById('end-date-input');
        // if (startDateInput) startDateInput.value = '';
        // if (endDateInput) endDateInput.value = '';
    };

    const handleDelete = async (code) => {
        if (confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
            try {
                const response = await fetch(`/api/entry/${code}`, { method: 'DELETE' });
                const data = await response.json();
                setStatusMessage(data.message);
                if (response.ok) {
                    fetchEntries();
                }
            } catch (error) {
                setStatusMessage('Failed to delete entry.');
            }
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

    const handleExportCSV = async () => {
        const order = sortOption === 'date-asc' ? 'ASC' : 'DESC';

        const requestBody = {
            order,
            startDate,
            endDate,
        };

        if (selectedDays.size < 7) {
            requestBody.days = Array.from(selectedDays).join(',');
        }

        if (allCategories.length > 0 && selectedCategories.size < allCategories.length) {
            requestBody.categories = Array.from(selectedCategories).join(',');
        }

        try {
            const response = await fetch(`/api/entry/export-csv/${code}`, {
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
                let filename = `${entry.name.replace(/\s+/g, '_')}_${entry.code}.csv`;
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

const handleExportPDF = async () => {
        const order = sortOption === 'date-asc' ? 'ASC' : 'DESC';

        const requestBody = {
            order,
            startDate,
            endDate,
        };

        if (selectedDays.size < 7) {
            requestBody.days = Array.from(selectedDays).join(',');
        }

        if (allCategories.length > 0 && selectedCategories.size < allCategories.length) {
            requestBody.categories = Array.from(selectedCategories).join(',');
        }

        try {
            const response = await fetch(`/api/entry/export-pdf/${code}`, {
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
                let filename = `${entry.name.replace(/\s+/g, '_')}_${entry.code}.pdf`;
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

    const openDeleteScanModal = (scan) => {
        setScanToDelete(scan.date);
        updateBounds();
        setIsDeleteScanModalOpen(true);
    };

    const handleDeleteScanSuccess = () => {
        setIsDeleteScanModalOpen(false);
        setScanToDelete(null);
        fetchScans();
        setStatusMessage("Successfully deleted scan.");
    };

    const handleDeleteSuccess = () => {
        setIsDeleteEntryModalOpen(false);
        navigate('/entries');
    };

    const handleEditSuccess = () => {
        setIsEditEntryModalOpen(false);
        fetchEntry();
    };

    const handleRestoreDefaultDates = () => {
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        setSelectedDays(new Set([0, 1, 2, 3, 4, 5, 6]));
        setSelectedCategories(new Set(allCategories.map(c => c.code)));
    };

    const openEditEntryModal = () => {
        updateBounds();
        setIsEditEntryModalOpen(true);
    };

    const openNewScanModal = () => {
        updateBounds();
        setIsNewScanModalOpen(true);
    };

    const handleNewScanSuccess = () => {
        setIsNewScanModalOpen(false);
        fetchScans();
        fetchDateRange();
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
        fetchDateRange();
        setStatusMessage("Successfully updated scan.");
    };

    const openDeleteEntryModal = () => {
        updateBounds();
        setIsDeleteEntryModalOpen(true);
    };

    const openQRCodeModal = () => {
        updateBounds();
        setIsQRCodeModalOpen(true);
    };

    const openDayFilterModal = () => {
        updateBounds();
        setIsDayFilterModalOpen(true);
    };

    const openCategoryFilterModal = () => {
        updateBounds();
        setIsCategoryFilterModalOpen(true);
    };

    const openFilterModal = () => {
        updateBounds();
        setIsFilterModalOpen(true);
    };

    if (!entry) {
        return <div className="flex-1 flex items-center justify-center"><p>Loading...</p></div>;
    }

    let shadowClass = '';
    if (isOverflowingTop && isOverflowingBottom) {
        shadowClass = 'scroll-shadow-both';
    } else if (isOverflowingTop) {
        shadowClass = 'scroll-shadow-top';
    } else if (isOverflowingBottom) {
        shadowClass = 'scroll-shadow-bottom';
    }

    const anyModalIsOpen =
        isEditEntryModalOpen ||
        isNewScanModalOpen ||
        isEditScanModalOpen ||
        isDeleteEntryModalOpen ||
        isDeleteScanModalOpen ||
        isQRCodeModalOpen ||
        isDayFilterModalOpen ||
        isCategoryFilterModalOpen ||
        isCategorySelectionOpen ||
        isFilterModalOpen;

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
                            <md-outlined-icon-button onClick={() => navigate('/entries')}>
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
                    <h1 className="text-3xl font-bold text-[var(--theme-text)]">{entry.name}</h1>
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
                                    id="end-date-input"
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
                        {scans.map((scan, index) => {
                            const date = new Date(scan.date);
                            const formattedDate = formatDate(date);
                            const formattedTime = formatTime24Hour(date);

                            return (
                                <motion.div
                                    key={index}
                                    whileHover={{ boxShadow: "inset 0 0 0 2px var(--theme-primary)" }}
                                    className="border border-[var(--theme-outline)] rounded-lg p-4 flex justify-between items-center"
                                >
                                    <div>
                                        <p className="opacity-70 text-xs">Category: {scan.category}</p>
                                        <p className="font-semibold text-lg">{entry.name}</p>
                                        <p className="font-semibold text-lg font-tabular-nums">{`${formattedDate} at ${formattedTime}`}</p>
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
                    {isEditEntryModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditEntryModalOpen(false)}
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
                                <EditEntryPage
                                    statusMessage={statusMessage}
                                    setStatusMessage={setStatusMessage}
                                    onClose={() => setIsEditEntryModalOpen(false)}
                                    entry={entry}
                                    onUpdate={handleEditSuccess}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.getElementById('portal-root')
            )}
            {createPortal(
                <AnimatePresence>
                    {isDeleteEntryModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDeleteEntryModalOpen(false)}
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
                                <DeleteEntryPage
                                    statusMessage={statusMessage}
                                    setStatusMessage={setStatusMessage}
                                    onClose={() => setIsDeleteEntryModalOpen(false)}
                                    entries={[entry]}
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
                    {isQRCodeModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsQRCodeModalOpen(false)}
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
                                <EntryQRCodePage
                                    onClose={() => setIsQRCodeModalOpen(false)}
                                    entry={entry}
                                    onQRCodeUpdate={handleQRCodeUpdate}
                                    statusMessage={statusMessage}
                                    setStatusMessage={setStatusMessage}
                                />
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
                                    mode="entry"
                                    entryCode={code}
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
                                    showBackButton={true}
                                    onBack={() => {
                                        setIsDayFilterModalOpen(false);
                                        openFilterModal();
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
                                    showBackButton={true}
                                    onBack={() => {
                                        setIsCategoryFilterModalOpen(false);
                                        openFilterModal();
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
                    {isFilterModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFilterModalOpen(false)}
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
                                <FilterPage
                                    onClose={() => setIsFilterModalOpen(false)}
                                    onDayFilter={() => {
                                        setIsFilterModalOpen(false);
                                        openDayFilterModal();
                                    }}
                                    onCategoryFilter={() => {
                                        setIsFilterModalOpen(false);
                                        openCategoryFilterModal();
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
                                    <div className="my-1 border-t border-[var(--theme-outline)]"></div>
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); openEditEntryModal(); setIsOptionsMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                                            <md-icon>edit</md-icon>
                                            <span>Edit Entry</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); handleCopyCode(); setIsOptionsMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                                            <md-icon>content_copy</md-icon>
                                            <span>Copy QR Code</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); openQRCodeModal(); setIsOptionsMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                                            <md-icon>qr_code_2</md-icon>
                                            <span>View QR Code</span>
                                        </a>
                                    </li>
                                    <div className="my-1 border-t border-[var(--theme-outline)]"></div>
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); openDeleteEntryModal(); setIsOptionsMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-[var(--theme-highlight)]">
                                            <md-icon>delete</md-icon>
                                            <span>Delete Entry</span>
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

export default EntryPage;
