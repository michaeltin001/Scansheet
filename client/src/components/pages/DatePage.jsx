import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import StatusMessage from '../ui/StatusMessage';
import DateToolbar from './DatePage/DateToolbar';
import DateScanList from './DatePage/DateScanList';
import DatePagination from './DatePage/DatePagination';
import DateModals from './DatePage/DateModals';
import DateMenus from './DatePage/DateMenus';
import { useOverflow } from '../../hooks/useOverflow';
import "@material/web/icon/icon.js";

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
                closeAllModalsAndMenus();
            }
        };
        document.addEventListener("keydown", handleEscKey);
        return () => {
            document.removeEventListener("keydown", handleEscKey);
        };
    }, []);

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

    const closeAllModalsAndMenus = () => {
        setIsDownloadMenuOpen(false);
        setIsCategoryFilterModalOpen(false);
        setIsNewScanModalOpen(false);
        setIsEditScanModalOpen(false);
        setIsOptionsMenuOpen(false);
        setIsDeleteScanModalOpen(false);
        setIsCategorySelectionOpen(false);
        setIsExportModalOpen(false);
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

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleScansPerPageChange = (newLimit) => {
        setScansPerPage(newLimit);
        setCurrentPage(1);
    };

    const handleSortChange = (newSortOption) => {
        setSortOption(newSortOption);
        setCurrentPage(1);
    };

    let shadowClass = '';
    if (isOverflowingTop && isOverflowingBottom) {
        shadowClass = 'scroll-shadow-both';
    } else if (isOverflowingTop) {
        shadowClass = 'scroll-shadow-top';
    } else if (isOverflowingBottom) {
        shadowClass = 'scroll-shadow-bottom';
    }

    const modalStates = {
        isCategoryFilterModalOpen,
        isDeleteScanModalOpen,
        isNewScanModalOpen,
        isEditScanModalOpen,
        isExportModalOpen,
        isCategorySelectionOpen,
    };

    const modalHandlers = {
        closeCategoryFilterModal: () => setIsCategoryFilterModalOpen(false),
        setSelectedCategories,
        closeDeleteScanModal: () => setIsDeleteScanModalOpen(false),
        handleDeleteScanSuccess,
        closeNewScanModal: () => setIsNewScanModalOpen(false),
        handleNewScanSuccess,
        openCategorySelectionModal,
        setSelectedCategory,
        closeCategorySelectionModal: () => setIsCategorySelectionOpen(false),
        openNewScanModal,
        closeEditScanModal: () => setIsEditScanModalOpen(false),
        handleEditScanSuccess,
        closeExportModal: () => setIsExportModalOpen(false),
        handleExport,
        exportTitle,
    };

    const anyModalIsOpen = Object.values(modalStates).some(state => state);

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

                    <DateToolbar
                        date={date}
                        isDateFilterActive={isDateFilterActive}
                        handleRestoreCategories={handleRestoreCategories}
                        setIsDateFilterActive={setIsDateFilterActive}
                        handleDownloadMenuToggle={handleDownloadMenuToggle}
                        isDownloadMenuOpen={isDownloadMenuOpen}
                        downloadButtonRef={downloadButtonRef}
                        handleOptionsMenuToggle={handleOptionsMenuToggle}
                        isOptionsMenuOpen={isOptionsMenuOpen}
                        optionsButtonRef={optionsButtonRef}
                        dateFilterRef={dateFilterRef}
                        openCategoryFilterModal={openCategoryFilterModal}
                        formattedDisplayDate={formattedDisplayDate}
                    />

                    <div
                        ref={scrollContainerRef}
                        className={`flex-1 overflow-y-auto ${shadowClass}`}
                    >
                        <DateScanList
                            scans={scans}
                            formatDate={formatDate}
                            formatTime24Hour={formatTime24Hour}
                            onEditClick={openEditScanModal}
                            onDeleteClick={openDeleteScanModal}
                            totalScans={totalScans}
                        />
                    </div>

                    <DatePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalScans={totalScans}
                        scansPerPage={scansPerPage}
                        sortOption={sortOption}
                        onPageChange={handlePageChange}
                        onScansPerPageChange={handleScansPerPageChange}
                        onSortChange={handleSortChange}
                    />
                </div>
            </main>

            <DateModals
                statusMessage={statusMessage}
                setStatusMessage={setStatusMessage}
                contentBoxBounds={contentBoxBounds}
                modalStates={modalStates}
                modalHandlers={modalHandlers}
                scanToDelete={scanToDelete}
                scanToEdit={scanToEdit}
                allCategories={allCategories}
                selectedCategories={selectedCategories}
                selectedCategory={selectedCategory}
                date={date}
            />

            <DateMenus
                isDownloadMenuOpen={isDownloadMenuOpen}
                closeDownloadMenu={() => setIsDownloadMenuOpen(false)}
                downloadIconPosition={downloadIconPosition}
                downloadMenuPosition={downloadMenuPosition}
                openExportPDFModal={() => { openExportModal('pdf'); setIsDownloadMenuOpen(false); }}
                openExportCSVModal={() => { openExportModal('csv'); setIsDownloadMenuOpen(false); }}
                isOptionsMenuOpen={isOptionsMenuOpen}
                closeOptionsMenu={() => setIsOptionsMenuOpen(false)}
                optionsIconPosition={optionsIconPosition}
                optionsMenuPosition={optionsMenuPosition}
                openNewScanModal={openNewScanModal}
            />
        </>
    );
};

export default DatePage;
