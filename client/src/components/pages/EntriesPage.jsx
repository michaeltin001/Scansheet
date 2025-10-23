import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusMessage from '../ui/StatusMessage';
import EntriesToolbar from './EntriesPage/EntriesToolbar';
import EntriesList from './EntriesPage/EntriesList';
import EntriesPagination from './EntriesPage/EntriesPagination';
import EntriesModals from './EntriesPage/EntriesModals';
import EntriesMenus from './EntriesPage/EntriesMenus';
import { useOverflow } from '../../hooks/useOverflow';
import "@material/web/icon/icon.js";

const EntriesPage = ({ statusMessage, setStatusMessage }) => {
    const [allEntries, setAllEntries] = useState([]);
    const [totalEntries, setTotalEntries] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [sortOption, setSortOption] = useState(() => {
        const savedSortOption = localStorage.getItem('sortOption');
        return savedSortOption || 'alpha-asc';
    });
    const [selectedEntries, setSelectedEntries] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(() => {
        const saved = localStorage.getItem('entriesPerPage');
        return saved ? parseInt(saved, 10) : 50;
    });
    const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
    const [isDeleteEntryModalOpen, setIsDeleteEntryModalOpen] = useState(false);
    const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState(null);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [addMenuPosition, setAddMenuPosition] = useState({});
    const [addIconPosition, setAddIconPosition] = useState({});
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
    const [downloadMenuPosition, setDownloadMenuPosition] = useState({});
    const [downloadIconPosition, setDownloadIconPosition] = useState({});

    const [isDeleteOptionsModalOpen, setIsDeleteOptionsModalOpen] = useState(false);
    const [isExportCSVModalOpen, setIsExportCSVModalOpen] = useState(false);
    const [isExportPDFModalOpen, setIsExportPDFModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    const [entriesToDelete, setEntriesToDelete] = useState([]);
    const [entryForQRCode, setEntryForQRCode] = useState(null);
    const [contentBoxBounds, setContentBoxBounds] = useState(null);
    const contentBoxRef = useRef(null);
    const fileInputRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const addButtonRef = useRef(null);
    const downloadButtonRef = useRef(null);

    const { isOverflowingTop, isOverflowingBottom } = useOverflow(scrollContainerRef, allEntries);
    const navigate = useNavigate();
    const totalPages = Math.ceil(totalEntries / entriesPerPage);

    const selectedCodesOnCurrentPage = useMemo(() => {
        const paginatedCodes = new Set(allEntries.map(e => e.code));
        return Array.from(selectedEntries).filter(code => paginatedCodes.has(code));
    }, [allEntries, selectedEntries]);

    const updateBounds = () => {
        if (contentBoxRef.current) {
            setContentBoxBounds(contentBoxRef.current.getBoundingClientRect());
        }
    };

    useEffect(() => {
        localStorage.setItem('sortOption', sortOption);
    }, [sortOption]);

    useEffect(() => {
        localStorage.setItem('entriesPerPage', String(entriesPerPage));
    }, [entriesPerPage]);

    useEffect(() => {
        window.addEventListener('resize', updateBounds);
        return () => {
            window.removeEventListener('resize', updateBounds);
        };
    }, []);

    useEffect(() => {
        fetchEntries();
    }, [sortOption, currentPage, entriesPerPage, searchQuery]);

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

    const fetchEntries = async () => {
        let sortBy = 'name';
        let order = 'ASC';

        switch (sortOption) {
            case 'alpha-desc':
                order = 'DESC';
                break;
            case 'date-asc':
                sortBy = 'date';
                break;
            case 'date-desc':
                sortBy = 'date';
                order = 'DESC';
                break;
        }

        try {
            const response = await fetch(`/api/entries?sortBy=${sortBy}&order=${order}&page=${currentPage}&limit=${entriesPerPage}&search=${searchQuery}`);
            const data = await response.json();

            if (response.ok) {
                setAllEntries(data.data);
                setTotalEntries(data.total);
            } else {
                setStatusMessage('Failed to fetch entries.');
            }
        } catch (error) {
            setStatusMessage('Could not fetch entries.');
        }
    };

    const closeAllModalsAndMenus = () => {
        setIsNewEntryModalOpen(false);
        setIsDeleteEntryModalOpen(false);
        setIsQRCodeModalOpen(false);
        setIsEditModalOpen(false);
        setIsAddMenuOpen(false);
        setIsDownloadMenuOpen(false);
        setIsDeleteOptionsModalOpen(false);
        setIsExportCSVModalOpen(false);
        setIsExportPDFModalOpen(false);
        setIsPrintModalOpen(false);
    };

    const getSelectAllIcon = () => {
        const paginatedCodes = new Set(allEntries.map(e => e.code));
        if (paginatedCodes.size === 0) return 'check_box_outline_blank';

        const selectedOnPageCount = Array.from(selectedEntries).filter(code => paginatedCodes.has(code)).length;

        if (selectedOnPageCount === paginatedCodes.size) {
            return 'check_box';
        } else if (selectedOnPageCount > 0) {
            return 'indeterminate_check_box';
        } else {
            return 'check_box_outline_blank';
        }
    };

    const handleToggleSelect = (code) => {
        setSelectedEntries(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(code)) {
                newSelected.delete(code);
            } else {
                newSelected.add(code);
            }
            return newSelected;
        });
    };

    const handleSelectAll = () => {
        const paginatedCodes = new Set(allEntries.map(e => e.code));
        const selectedOnPageCount = Array.from(selectedEntries).filter(code => paginatedCodes.has(code)).length;

        if (selectedOnPageCount === paginatedCodes.size) {
            setSelectedEntries(prev => {
                const newSet = new Set(prev);
                paginatedCodes.forEach(code => newSet.delete(code));
                return newSet;
            });
        } else {
            setSelectedEntries(prev => new Set([...prev, ...paginatedCodes]));
        }
    };

    const handleClearSelection = () => {
        setSelectedEntries(new Set());
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

    const handleCopyClick = async (entry) => {
        try {
            await navigator.clipboard.writeText(entry.code);
            setStatusMessage("Copied code to clipboard.");
        } catch (err) {
            setStatusMessage("Could not copy code.");
        }
    };

    const handleEditClick = (entry) => {
        updateBounds();
        setEntryToEdit(entry);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        setEntryToEdit(null);
        fetchEntries();
    };

    const handleDeleteSuccess = () => {
        setIsDeleteEntryModalOpen(false);
        const deletedCodes = new Set(entriesToDelete.map(entry => entry.code));
        setSelectedEntries(prevSelected => {
            const newSelected = new Set(prevSelected);
            deletedCodes.forEach(code => newSelected.delete(code));
            return newSelected;
        });
        setEntriesToDelete([]);
        fetchEntries();
    };

    const handleDeleteClick = () => {
        if (selectedEntries.size > 0) {
            updateBounds();
            setIsDeleteOptionsModalOpen(true);
        } else {
            setStatusMessage("No entries selected.");
        }
    };

    const handleDeleteClickEntry = (entry) => {
        updateBounds();
        setEntriesToDelete([entry]);
        setIsDeleteEntryModalOpen(true);
    };

    const handleDeleteCurrentPage = () => {
        const dummyEntries = selectedCodesOnCurrentPage.map(code => ({ code: code }));
        setEntriesToDelete(dummyEntries);
        setIsDeleteOptionsModalOpen(false);
        setIsDeleteEntryModalOpen(true);
    };

    const handleDeleteAllSelected = () => {
        const dummyEntries = Array.from(selectedEntries).map(code => ({ code: code }));
        setEntriesToDelete(dummyEntries);
        setIsDeleteOptionsModalOpen(false);
        setIsDeleteEntryModalOpen(true);
    };

    const handleQRCodeClick = async (entry) => {
        try {
            const response = await fetch(`/api/entry/${entry.code}`);
            const data = await response.json();
            if (response.ok) {
                updateBounds();
                setEntryForQRCode(data.data);
                setIsQRCodeModalOpen(true);
            } else {
                setStatusMessage('Could not fetch QR code data.');
            }
        } catch (error) {
            setStatusMessage('Could not fetch QR code data.');
        }
    };

    const handleQRCodeUpdate = (newEntry) => {
        setEntryForQRCode(newEntry);
        fetchEntries();
    };

    const openNewEntryModal = () => {
        updateBounds();
        setIsNewEntryModalOpen(true);
    };

    const handleNewEntrySuccess = () => {
        setIsNewEntryModalOpen(false);
        fetchEntries();
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
        setIsAddMenuOpen(false);
    };

    const handleImportCSV = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/entries/import', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            setStatusMessage(data.message || data.error);
            if (response.ok) {
                fetchEntries();
            }
        } catch (error) {
            setStatusMessage('Could not upload entries.');
        } finally {
            event.target.value = null;
        }
    };

    const handleExportCSV = async (codesToExport) => {
        if (!codesToExport || codesToExport.length === 0) {
            setStatusMessage("No entries selected for download.");
            return;
        }

        let sortBy = 'name';
        let order = 'ASC';

        switch (sortOption) {
            case 'alpha-desc':
                order = 'DESC';
                break;
            case 'date-asc':
                sortBy = 'date';
                break;
            case 'date-desc':
                sortBy = 'date';
                order = 'DESC';
                break;
        }

        try {
            const response = await fetch('/api/entries/export-csv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codes: codesToExport, sortBy, order }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                const disposition = response.headers.get('content-disposition');
                let filename = 'entries.csv';
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
                const count = codesToExport.length;
                setStatusMessage(`Successfully exported ${count} entries.`);
            } else {
                const errorData = await response.json();
                setStatusMessage(errorData.error || 'Could not download entries.');
            }
        } catch (error) {
            setStatusMessage('Could not download entries.');
        }
    };

    const handleExportPDF = async (codesToExport) => {
        if (!codesToExport || codesToExport.length === 0) {
            setStatusMessage("No entries selected for PDF export.");
            return;
        }

        let sortBy = 'name';
        let order = 'ASC';

        switch (sortOption) {
            case 'alpha-desc':
                order = 'DESC';
                break;
            case 'date-asc':
                sortBy = 'date';
                break;
            case 'date-desc':
                sortBy = 'date';
                order = 'DESC';
                break;
        }

        try {
            const response = await fetch('/api/entries/export-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codes: codesToExport, sortBy, order }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                const disposition = response.headers.get('content-disposition');
                let filename = 'entries.pdf';
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
                const count = codesToExport.length;
                setStatusMessage(`Successfully exported ${count} entries.`);
            } else {
                const errorData = await response.json();
                setStatusMessage(errorData.error || 'Could not download entries.');
            }
        } catch (error) {
            setStatusMessage('Could not download entries.');
        }
    };

    const handlePrintBadges = async (codesToPrint) => {
        if (!codesToPrint || codesToPrint.length === 0) {
            setStatusMessage("No entries selected for printing.");
            return;
        }

        let sortBy = 'name';
        let order = 'ASC';

        switch (sortOption) {
            case 'alpha-desc':
                order = 'DESC';
                break;
            case 'date-asc':
                sortBy = 'date';
                break;
            case 'date-desc':
                sortBy = 'date';
                order = 'DESC';
                break;
        }

        try {
            const response = await fetch('/api/entries/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codes: codesToPrint, sortBy, order }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                const disposition = response.headers.get('content-disposition');
                let filename = 'badges.pdf';
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
                setStatusMessage("Successfully generated PDF.");
            } else {
                const errorData = await response.json();
                setStatusMessage(errorData.error || 'Could not generate PDF.');
            }
        } catch (error) {
            setStatusMessage('Could not generate PDF.');
        }
    };

    const handleExportCSVCurrentPage = () => {
        handleExportCSV(selectedCodesOnCurrentPage);
        setIsExportCSVModalOpen(false);
    };

    const handleExportCSVAllSelected = () => {
        handleExportCSV(Array.from(selectedEntries));
        setIsExportCSVModalOpen(false);
    };

    const handleExportPDFCurrentPage = () => {
        handleExportPDF(selectedCodesOnCurrentPage);
        setIsExportPDFModalOpen(false);
    };

    const handleExportPDFAllSelected = () => {
        handleExportPDF(Array.from(selectedEntries));
        setIsExportPDFModalOpen(false);
    };

    const handlePrintCurrentPage = () => {
        handlePrintBadges(selectedCodesOnCurrentPage);
        setIsPrintModalOpen(false);
    };

    const handlePrintAllSelected = () => {
        handlePrintBadges(Array.from(selectedEntries));
        setIsPrintModalOpen(false);
    };

    const openExportCSVModal = () => {
        if (selectedEntries.size > 0) {
            updateBounds();
            setIsExportCSVModalOpen(true);
        } else {
            setStatusMessage("No entries selected.");
        }
    };

    const openExportPDFModal = () => {
        if (selectedEntries.size > 0) {
            updateBounds();
            setIsExportPDFModalOpen(true);
        } else {
            setStatusMessage("No entries selected.");
        }
    };

    const openPrintModal = () => {
        if (selectedEntries.size > 0) {
            updateBounds();
            setIsPrintModalOpen(true);
        } else {
            setStatusMessage("No entries selected.");
        }
    };

    const handleSearchToggle = (isActive) => {
        setIsSearchActive(isActive);
        if (!isActive) {
            setSearchQuery("");
        }
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleEntriesPerPageChange = (newLimit) => {
        setEntriesPerPage(newLimit);
        setCurrentPage(1);
    };

    const handleSortChange = (newSortOption) => {
        setSortOption(newSortOption);
        setCurrentPage(1);
    };

    const modalStates = {
        isNewEntryModalOpen,
        isDeleteEntryModalOpen,
        isQRCodeModalOpen,
        isEditModalOpen,
        isDeleteOptionsModalOpen,
        isExportCSVModalOpen,
        isExportPDFModalOpen,
        isPrintModalOpen,
    };

    const modalHandlers = {
        closeNewEntryModal: () => setIsNewEntryModalOpen(false),
        handleNewEntrySuccess,
        closeDeleteEntryModal: () => setIsDeleteEntryModalOpen(false),
        handleDeleteSuccess,
        closeQRCodeModal: () => setIsQRCodeModalOpen(false),
        handleQRCodeUpdate,
        closeEditModal: () => setIsEditModalOpen(false),
        handleEditSuccess,
        closeDeleteOptionsModal: () => setIsDeleteOptionsModalOpen(false),
        handleDeleteCurrentPage,
        handleDeleteAllSelected,
        closeExportCSVModal: () => setIsExportCSVModalOpen(false),
        handleExportCSVCurrentPage,
        handleExportCSVAllSelected,
        closeExportPDFModal: () => setIsExportPDFModalOpen(false),
        handleExportPDFCurrentPage,
        handleExportPDFAllSelected,
        closePrintModal: () => setIsPrintModalOpen(false),
        handlePrintCurrentPage,
        handlePrintAllSelected,
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

                    <EntriesToolbar
                        selectedEntries={selectedEntries}
                        allEntries={allEntries}
                        onClearSelection={handleClearSelection}
                        onSelectAll={handleSelectAll}
                        getSelectAllIcon={getSelectAllIcon}
                        onDownloadMenuToggle={handleDownloadMenuToggle}
                        onDeleteClick={handleDeleteClick}
                        isSearchActive={isSearchActive}
                        searchQuery={searchQuery}
                        onSearchToggle={handleSearchToggle}
                        onSearchChange={handleSearchChange}
                        onAddMenuToggle={handleAddMenuToggle}
                        isAddMenuOpen={isAddMenuOpen}
                        isDownloadMenuOpen={isDownloadMenuOpen}
                        addButtonRef={addButtonRef}
                        downloadButtonRef={downloadButtonRef}
                    />

                    <div
                        ref={scrollContainerRef}
                        className={`flex-1 overflow-y-auto ${shadowClass}`}
                    >
                        <EntriesList
                            allEntries={allEntries}
                            selectedEntries={selectedEntries}
                            onToggleSelect={handleToggleSelect}
                            onEditClick={handleEditClick}
                            onCopyClick={handleCopyClick}
                            onQRCodeClick={handleQRCodeClick}
                            onDeleteClick={handleDeleteClickEntry}
                            totalEntries={totalEntries}
                        />
                    </div>

                    <EntriesPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalEntries={totalEntries}
                        entriesPerPage={entriesPerPage}
                        sortOption={sortOption}
                        onPageChange={handlePageChange}
                        onEntriesPerPageChange={handleEntriesPerPageChange}
                        onSortChange={handleSortChange}
                    />
                </div>
            </main>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportCSV}
                accept=".csv"
                style={{ display: 'none' }}
            />

            <EntriesModals
                statusMessage={statusMessage}
                setStatusMessage={setStatusMessage}
                contentBoxBounds={contentBoxBounds}
                modalStates={modalStates}
                modalHandlers={modalHandlers}
                entriesToDelete={entriesToDelete}
                entryForQRCode={entryForQRCode}
                entryToEdit={entryToEdit}
            />

            <EntriesMenus
                isAddMenuOpen={isAddMenuOpen}
                closeAddMenu={() => setIsAddMenuOpen(false)}
                addIconPosition={addIconPosition}
                addMenuPosition={addMenuPosition}
                openNewEntryModal={openNewEntryModal}
                handleUploadClick={handleUploadClick}
                isDownloadMenuOpen={isDownloadMenuOpen}
                closeDownloadMenu={() => setIsDownloadMenuOpen(false)}
                downloadIconPosition={downloadIconPosition}
                downloadMenuPosition={downloadMenuPosition}
                openPrintModal={openPrintModal}
                openExportPDFModal={openExportPDFModal}
                openExportCSVModal={openExportCSVModal}
                selectedEntriesCount={selectedEntries.size}
            />
        </>
    );
};

export default EntriesPage;
