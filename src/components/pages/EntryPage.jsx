import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import StatusMessage from '../ui/StatusMessage';
import EntryToolbar from './EntryPage/EntryToolbar';
import EntryScanList from './EntryPage/EntryScanList';
import EntryPagination from './EntryPage/EntryPagination';
import EntryModals from './EntryPage/EntryModals';
import EntryMenus from './EntryPage/EntryMenus';
import { useOverflow } from '../../hooks/useOverflow';
import "@material/web/icon/icon.js";

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

    const [scans, setScans] = useState([]);
    const { isOverflowingTop, isOverflowingBottom } = useOverflow(scrollContainerRef, scans);
    const [totalScans, setTotalScans] = useState(0);
    const [sortOption, setSortOption] = useState(() => {
        const savedSortOption = localStorage.getItem('scanSortOption');
        return savedSortOption || 'date-desc';
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [scansPerPage, setScansPerPage] = useState(() => {
        const saved = localStorage.getItem('scansPerPage');
        return saved ? parseInt(saved, 10) : 50;
    });
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
                const categoriesData = await invoke('get_categories');
                setAllCategories(categoriesData.data);
                setSelectedCategories(new Set(categoriesData.data.map(c => c.code)));
                if (!localStorage.getItem('selectedCategory')) {
                    const generalCategory = categoriesData.data.find(c => c.name === 'General');
                    if (generalCategory) {
                        setSelectedCategory(generalCategory.code);
                    }
                }
            } catch (error) {
                 setStatusMessage(error.message || 'Failed to fetch categories.');
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
                closeAllModalsAndMenus();
            }
        };
        document.addEventListener("keydown", handleEscKey);
        return () => {
            document.removeEventListener("keydown", handleEscKey);
        };
    }, []);

    useEffect(() => {
        if (entry && location.state?.showQRCode) {
            openQRCodeModal();
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [entry, location.state]);

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
        const params = {
            code,
            order,
            page: currentPage,
            limit: scansPerPage,
        };

        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        if (selectedDays.size < 7) {
            params.days = Array.from(selectedDays).join(',');
        }

        if (allCategories.length > 0 && selectedCategories.size < allCategories.length) {
            params.categories = Array.from(selectedCategories).join(',');
        }

        try {
            const data = await invoke('get_entry_scans', params);
            setScans(data.data);
            setTotalScans(data.total);
        } catch (error) {
            setStatusMessage('Could not load scan history.');
        }
    };

    const fetchEntry = async () => {
        try {
            const entryData = await invoke('get_entry', { code });
            setEntry(entryData.data);
            setName(entryData.data.name);
        } catch (error) {
            setStatusMessage(error || 'Failed to fetch entry.');
            navigate('/entries');
        }
    };

    const fetchDateRange = async () => {
        try {
            const dateRangeData = await invoke('get_entry_date_range', { code });
            if (dateRangeData.data.minDate) {
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
        if (selectedDays.size === 0 || selectedCategories.size === 0) {
            setIsDownloadMenuOpen(false);
            setStatusMessage('No data to export based on selected filters.');
            return;
        }

        const order = sortOption === 'date-asc' ? 'ASC' : 'DESC';

        const requestBody = {
            code,
            order,
            page: 1,
            limit: -1,
        };

        if (startDate) requestBody.startDate = startDate;
        if (endDate) requestBody.endDate = endDate;
        if (selectedDays.size < 7) {
            requestBody.days = Array.from(selectedDays).join(',');
        }
        if (allCategories.length > 0 && selectedCategories.size < allCategories.length) {
            requestBody.categories = Array.from(selectedCategories).join(',');
        }

        try {
            const { save } = await import('@tauri-apps/plugin-dialog');
            const { writeFile } = await import('@tauri-apps/plugin-fs');
            const { invoke } = await import('@tauri-apps/api/core');

            const filePath = await save({
                defaultPath: `${entry.name.replace(/\s+/g, '_')}_${entry.code}.csv`,
                filters: [{ name: 'CSV', extensions: ['csv'] }]
            });

            if (!filePath) {
                setIsDownloadMenuOpen(false);
                return;
            }

            const response = await invoke('get_entry_scans', requestBody);
            const scans = response.data;
            
            let csvContent = '"Name","Date","Time","Category"\n';
            scans.forEach(scan => {
                const d = new Date(scan.date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const seconds = String(d.getSeconds()).padStart(2, '0');
                csvContent += `"${entry.name}","${year}-${month}-${day}","${hours}:${minutes}:${seconds}","${scan.category}"\n`;
            });

            await writeFile(filePath, new TextEncoder().encode(csvContent));
            setStatusMessage(`Successfully exported scans.`);
        } catch (error) {
            setStatusMessage('Could not download scans: ' + error);
        } finally {
            setIsDownloadMenuOpen(false);
        }
    };

    const handleExportPDF = async () => {
        if (selectedDays.size === 0 || selectedCategories.size === 0) {
            setIsDownloadMenuOpen(false);
            setStatusMessage('No data to export based on selected filters.');
            return;
        }

        const order = sortOption === 'date-asc' ? 'ASC' : 'DESC';

        const requestBody = {
            code,
            order,
            page: 1,
            limit: -1,
        };

        if (startDate) requestBody.startDate = startDate;
        if (endDate) requestBody.endDate = endDate;
        if (selectedDays.size < 7) {
            requestBody.days = Array.from(selectedDays).join(',');
        }
        if (allCategories.length > 0 && selectedCategories.size < allCategories.length) {
            requestBody.categories = Array.from(selectedCategories).join(',');
        }

        try {
            const { save } = await import('@tauri-apps/plugin-dialog');
            const { writeFile } = await import('@tauri-apps/plugin-fs');
            const { invoke } = await import('@tauri-apps/api/core');
            const { jsPDF } = await import('jspdf');
            await import('jspdf-autotable');

            const filePath = await save({
                defaultPath: `${entry.name.replace(/\s+/g, '_')}_${entry.code}.pdf`,
                filters: [{ name: 'PDF', extensions: ['pdf'] }]
            });

            if (!filePath) {
                setIsDownloadMenuOpen(false);
                return;
            }

            const response = await invoke('get_entry_scans', requestBody);
            const scans = response.data;
            
            const doc = new jsPDF();
            
            const tableData = scans.map(scan => {
                const d = new Date(scan.date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const seconds = String(d.getSeconds()).padStart(2, '0');
                return [entry.name, `${month}/${day}/${year}`, `${hours}:${minutes}:${seconds}`, scan.category];
            });

            doc.autoTable({
                head: [['Name', 'Date', 'Time', 'Category']],
                body: tableData,
                margin: { top: 30 }
            });

            doc.addPage();
            
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayString = selectedDays.size === 7 ? 'All' : Array.from(selectedDays).map(d => daysOfWeek[d]).join(', ');
            
            const categoryString = selectedCategories.size === allCategories.length ? 'All' : 
                allCategories.filter(c => selectedCategories.has(c.code)).map(c => c.name).join(', ');
            
            const formatYMDtoMDY = (ymd) => {
                if (!ymd) return 'N/A';
                const [y, m, d] = ymd.split('-');
                return `${m}/${d}/${y}`;
            };
            const formattedStartDate = formatYMDtoMDY(startDate);
            const formattedEndDate = formatYMDtoMDY(endDate);
            
            let y = 30;
            
            const now = new Date();
            const reportDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
            const reportTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

            doc.setFontSize(10);
            doc.text(`Generated report for ${entry.name} on ${reportDate} at ${reportTime}.`, 14, y);
            doc.text(`Successfully exported ${scans.length} scans, using the following options:`, 14, y + 10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Day(s): ${dayString}`, 14, y + 16);
            doc.text(`Categories: ${categoryString}`, 14, y + 22);
            doc.text(`Date Range: ${formattedStartDate} to ${formattedEndDate}`, 14, y + 28);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text("Scansheet v1.0.0", 14, y + 42);

            const arrayBuffer = doc.output('arraybuffer');
            await writeFile(filePath, new Uint8Array(arrayBuffer));
            
            setStatusMessage(`Successfully generated PDF.`);
        } catch (error) {
            setStatusMessage('Could not generate PDF: ' + error);
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
        setTimeout(() => {
            setStatusMessage("Successfully deleted scan.");
        }, 500);
    };

    const handleDeleteSuccess = () => {
        setIsDeleteEntryModalOpen(false);
        navigate('/entries', { state: { message: "Successfully deleted entry." } });
    };

    const handleEditSuccess = () => {
        setIsEditEntryModalOpen(false);
        fetchEntry();
        setTimeout(() => {
            setStatusMessage("Successfully updated entry.");
        }, 500);
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
        setTimeout(() => {
            setStatusMessage(`Successfully created scan for ${entry.name}.`);
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
        fetchDateRange();
        setTimeout(() => {
            setStatusMessage("Successfully updated scan.");
        }, 500);
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

    const closeAllModalsAndMenus = () => {
        setIsEditEntryModalOpen(false);
        setIsNewScanModalOpen(false);
        setIsEditScanModalOpen(false);
        setIsDeleteEntryModalOpen(false);
        setIsDeleteScanModalOpen(false);
        setIsQRCodeModalOpen(false);
        setIsDayFilterModalOpen(false);
        setIsCategoryFilterModalOpen(false);
        setIsCategorySelectionOpen(false);
        setIsFilterModalOpen(false);
        setIsDownloadMenuOpen(false);
        setIsOptionsMenuOpen(false);
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

    const modalStates = {
        isEditEntryModalOpen,
        isNewScanModalOpen,
        isEditScanModalOpen,
        isDeleteEntryModalOpen,
        isDeleteScanModalOpen,
        isQRCodeModalOpen,
        isDayFilterModalOpen,
        isCategoryFilterModalOpen,
        isCategorySelectionOpen,
        isFilterModalOpen,
    };

    const modalHandlers = {
        closeEditEntryModal: () => setIsEditEntryModalOpen(false),
        handleEditSuccess,
        closeNewScanModal: () => setIsNewScanModalOpen(false),
        handleNewScanSuccess,
        openCategorySelectionModal,
        setSelectedCategory,
        closeCategorySelectionModal: () => setIsCategorySelectionOpen(false),
        openNewScanModal,
        closeEditScanModal: () => setIsEditScanModalOpen(false),
        handleEditScanSuccess,
        closeDeleteEntryModal: () => setIsDeleteEntryModalOpen(false),
        handleDeleteSuccess,
        closeDeleteScanModal: () => setIsDeleteScanModalOpen(false),
        handleDeleteScanSuccess,
        closeQRCodeModal: () => setIsQRCodeModalOpen(false),
        handleQRCodeUpdate,
        closeDayFilterModal: () => setIsDayFilterModalOpen(false),
        setSelectedDays,
        openFilterModal,
        closeCategoryFilterModal: () => setIsCategoryFilterModalOpen(false),
        setSelectedCategories,
        closeFilterModal: () => setIsFilterModalOpen(false),
        openDayFilterModal,
        openCategoryFilterModal,
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

                    <EntryToolbar
                        entryName={entry.name}
                        isDateFilterActive={isDateFilterActive}
                        setIsDateFilterActive={setIsDateFilterActive}
                        handleRestoreDefaultDates={handleRestoreDefaultDates}
                        handleDownloadMenuToggle={handleDownloadMenuToggle}
                        isDownloadMenuOpen={isDownloadMenuOpen}
                        downloadButtonRef={downloadButtonRef}
                        handleOptionsMenuToggle={handleOptionsMenuToggle}
                        isOptionsMenuOpen={isOptionsMenuOpen}
                        optionsButtonRef={optionsButtonRef}
                        dateFilterRef={dateFilterRef}
                        startDate={startDate}
                        endDate={endDate}
                        handleStartDateChange={handleStartDateChange}
                        handleEndDateChange={handleEndDateChange}
                        openFilterModal={openFilterModal}
                        handleClearDates={handleClearDates}
                    />

                    <div
                        ref={scrollContainerRef}
                        className={`flex-1 overflow-y-auto ${shadowClass}`}
                    >
                        <EntryScanList
                            scans={scans}
                            entryName={entry.name}
                            formatDate={formatDate}
                            formatTime24Hour={formatTime24Hour}
                            onEditClick={openEditScanModal}
                            onDeleteClick={openDeleteScanModal}
                            totalScans={totalScans}
                        />
                    </div>

                    <EntryPagination
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

            <EntryModals
                statusMessage={statusMessage}
                setStatusMessage={setStatusMessage}
                contentBoxBounds={contentBoxBounds}
                modalStates={modalStates}
                modalHandlers={modalHandlers}
                entry={entry}
                scanToDelete={scanToDelete}
                scanToEdit={scanToEdit}
                selectedDays={selectedDays}
                allCategories={allCategories}
                selectedCategories={selectedCategories}
                selectedCategory={selectedCategory}
                code={code}
            />

            <EntryMenus
                isDownloadMenuOpen={isDownloadMenuOpen}
                closeDownloadMenu={() => setIsDownloadMenuOpen(false)}
                downloadIconPosition={downloadIconPosition}
                downloadMenuPosition={downloadMenuPosition}
                handleExportPDF={handleExportPDF}
                handleExportCSV={handleExportCSV}
                isOptionsMenuOpen={isOptionsMenuOpen}
                closeOptionsMenu={() => setIsOptionsMenuOpen(false)}
                optionsIconPosition={optionsIconPosition}
                optionsMenuPosition={optionsMenuPosition}
                openNewScanModal={openNewScanModal}
                openEditEntryModal={openEditEntryModal}
                handleCopyCode={handleCopyCode}
                openQRCodeModal={openQRCodeModal}
                openDeleteEntryModal={openDeleteEntryModal}
            />
        </>
    );
};

export default EntryPage;
