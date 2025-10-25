import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusMessage from '../ui/StatusMessage';
import DatesToolbar from './DatesPage/DatesToolbar';
import DatesList from './DatesPage/DatesList';
import DatesPagination from './DatesPage/DatesPagination';
import DatesModals from './DatesPage/DatesModals';
import DatesMenus from './DatesPage/DatesMenus';
import { useOverflow } from '../../hooks/useOverflow';
import "@material/web/icon/icon.js";

const DatesPage = ({ statusMessage, setStatusMessage }) => {
    const [allDates, setAllDates] = useState([]);
    const [totalDates, setTotalDates] = useState(0);
    const [isDateFilterActive, setIsDateFilterActive] = useState(false);
    const [sortOption, setSortOption] = useState(() => {
        const savedSortOption = localStorage.getItem('dateSortOption');
        return savedSortOption || 'date-desc';
    });
    const [selectedDates, setSelectedDates] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [datesPerPage, setDatesPerPage] = useState(() => {
        const saved = localStorage.getItem('datesPerPage');
        return saved ? parseInt(saved, 10) : 50;
    });
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

    const { isOverflowingTop, isOverflowingBottom } = useOverflow(scrollContainerRef, allDates);
    const navigate = useNavigate();
    const totalPages = Math.ceil(totalDates / datesPerPage);

    const selectedDatesOnCurrentPage = useMemo(() => {
        const paginatedDates = new Set(allDates);
        return Array.from(selectedDates).filter(date => paginatedDates.has(date));
    }, [allDates, selectedDates]);

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
                closeAllModalsAndMenus();
            }
        };
        document.addEventListener("keydown", handleEscKey);
        return () => {
            document.removeEventListener("keydown", handleEscKey);
        };
    }, []);

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


    const closeAllModalsAndMenus = () => {
        setIsDayFilterModalOpen(false);
        setIsDeleteDateModalOpen(false);
        setIsDeleteOptionsModalOpen(false);
        setIsAddMenuOpen(false);
        setIsNewScanModalOpen(false);
        setIsCategorySelectionOpen(false);
        setIsDownloadMenuOpen(false);
        setIsExportCSVModalOpen(false);
        setIsExportPDFModalOpen(false);
    };

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
        const count = datesToDelete.length;
        const message = count > 1
            ? `Successfully deleted scans for ${count} dates.`
            : "Successfully deleted scans for 1 date.";
        setDatesToDelete([]);
        fetchDates();
        setTimeout(() => {
            setStatusMessage(message);
        }, 500);
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
        setTimeout(() => {
            setStatusMessage("Successfully created scan.");
        }, 500);
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

    const handleDateFilterToggle = (isActive) => {
        setIsDateFilterActive(isActive);
        if (!isActive) {
            handleRestoreDefaultDates();
        }
    };

    const handleStartDateChange = (e) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);
        if (endDate && newStartDate > endDate) {
            setEndDate(newStartDate);
        }
    };

    const handleEndDateChange = (e) => {
        setEndDate(e.target.value);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleDatesPerPageChange = (newLimit) => {
        setDatesPerPage(newLimit);
        setCurrentPage(1);
    };

    const handleSortChange = (newSortOption) => {
        setSortOption(newSortOption);
        setCurrentPage(1);
    };

    const modalStates = {
        isDayFilterModalOpen,
        isDeleteDateModalOpen,
        isDeleteOptionsModalOpen,
        isNewScanModalOpen,
        isCategorySelectionOpen,
        isExportCSVModalOpen,
        isExportPDFModalOpen,
    };

    const modalHandlers = {
        closeDayFilterModal: () => setIsDayFilterModalOpen(false),
        setSelectedDays,
        closeDeleteDateModal: () => setIsDeleteDateModalOpen(false),
        handleDeleteSuccess,
        closeDeleteOptionsModal: () => setIsDeleteOptionsModalOpen(false),
        handleDeleteCurrentPage,
        handleDeleteAllSelected,
        closeNewScanModal: () => setIsNewScanModalOpen(false),
        handleNewScanSuccess,
        openCategorySelectionModal,
        setSelectedCategory,
        closeCategorySelectionModal: () => setIsCategorySelectionOpen(false),
        openNewScanModal,
        closeExportCSVModal: () => setIsExportCSVModalOpen(false),
        handleExportCSVCurrentPage,
        handleExportCSVAllSelected,
        closeExportPDFModal: () => setIsExportPDFModalOpen(false),
        handleExportPDFCurrentPage,
        handleExportPDFAllSelected,
    };

    let shadowClass = '';
    if (isOverflowingTop && isOverflowingBottom) {
        shadowClass = 'scroll-shadow-both';
    } else if (isOverflowingTop) {
        shadowClass = 'scroll-shadow-top';
    } else if (isOverflowingBottom) {
        shadowClass = 'scroll-shadow-bottom';
    }

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

                    <DatesToolbar
                        selectedDates={selectedDates}
                        allDates={allDates}
                        onClearSelection={handleClearSelection}
                        onSelectAll={handleSelectAll}
                        getSelectAllIcon={getSelectAllIcon}
                        onDownloadMenuToggle={handleDownloadMenuToggle}
                        onDeleteClick={handleDeleteClick}
                        isDateFilterActive={isDateFilterActive}
                        onDateFilterToggle={handleDateFilterToggle}
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={handleStartDateChange}
                        onEndDateChange={handleEndDateChange}
                        onAddMenuToggle={handleAddMenuToggle}
                        isAddMenuOpen={isAddMenuOpen}
                        isDownloadMenuOpen={isDownloadMenuOpen}
                        addButtonRef={addButtonRef}
                        downloadButtonRef={downloadButtonRef}
                        openDayFilterModal={openDayFilterModal}
                        handleRestoreDefaultDates={handleRestoreDefaultDates}
                        handleClearDates={handleClearDates}
                    />

                    <div
                        ref={scrollContainerRef}
                        className={`flex-1 overflow-y-auto ${shadowClass}`}
                    >
                        <DatesList
                            allDates={allDates}
                            selectedDates={selectedDates}
                            onToggleSelect={handleToggleSelect}
                            onDeleteClick={handleDeleteClickDate}
                            formatDate={formatDate}
                            totalDates={totalDates}
                        />
                    </div>

                    <DatesPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalDates={totalDates}
                        datesPerPage={datesPerPage}
                        sortOption={sortOption}
                        onPageChange={handlePageChange}
                        onDatesPerPageChange={handleDatesPerPageChange}
                        onSortChange={handleSortChange}
                    />
                </div>
            </main>

            <DatesModals
                statusMessage={statusMessage}
                setStatusMessage={setStatusMessage}
                contentBoxBounds={contentBoxBounds}
                modalStates={modalStates}
                modalHandlers={modalHandlers}
                selectedDays={selectedDays}
                datesToDelete={datesToDelete}
                allCategories={allCategories}
                selectedCategory={selectedCategory}
            />

            <DatesMenus
                isAddMenuOpen={isAddMenuOpen}
                closeAddMenu={() => setIsAddMenuOpen(false)}
                addIconPosition={addIconPosition}
                addMenuPosition={addMenuPosition}
                openNewScanModal={openNewScanModal}
                isDownloadMenuOpen={isDownloadMenuOpen}
                closeDownloadMenu={() => setIsDownloadMenuOpen(false)}
                downloadIconPosition={downloadIconPosition}
                downloadMenuPosition={downloadMenuPosition}
                openExportPDFModal={openExportPDFModal}
                openExportCSVModal={openExportCSVModal}
                selectedDatesCount={selectedDates.size}
            />
        </>
    );
};

export default DatesPage;
