import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StatusMessage from '../ui/StatusMessage';
import NewEntryPage from '../modals/entry/NewEntryPage';
import DeleteEntryPage from '../modals/entry/DeleteEntryPage';
import EntryQRCodePage from '../modals/entry/EntryQRCodePage';
import EditEntryPage from '../modals/entry/EditEntryPage';
import DeletePage from '../modals/common/DeletePage';
import ExportToCSVPage from '../modals/common/ExportToCSVPage';
import ExportToPDFPage from '../modals/common/ExportToPDFPage';
import PrintBadgesPage from '../modals/common/PrintBadgesPage';
import { useOverflow } from '../../hooks/useOverflow';
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";
import "@material/web/button/filled-button.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/iconbutton/filled-icon-button.js";

const EntriesPage = ({ statusMessage, setStatusMessage }) => {
    const [allEntries, setAllEntries] = useState([]);
    const [totalEntries, setTotalEntries] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [sortOption, setSortOption] = useState(() => {
        const savedSortOption = localStorage.getItem('sortOption');
        return savedSortOption || 'alpha-asc';
    });
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [selectedEntries, setSelectedEntries] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(() => {
        const saved = localStorage.getItem('entriesPerPage');
        return saved ? parseInt(saved, 10) : 50;
    });
    const [isEntriesPerPageOpen, setIsEntriesPerPageOpen] = useState(false);
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
    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);
    const clearSearchButtonRef = useRef(null);
    const clearSelectionButtonRef = useRef(null);
    const deleteButtonRef = useRef(null);
    const selectAllButtonRef = useRef(null);

    const firstPageButtonRef = useRef(null);
    const prevPageButtonRef = useRef(null);
    const nextPageButtonRef = useRef(null);
    const lastPageButtonRef = useRef(null);

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
            }
        };
        document.addEventListener("keydown", handleEscKey);
        return () => {
            document.removeEventListener("keydown", handleEscKey);
        };
    }, [isSearchActive]);

    useEffect(() => {
        const isDisabled = selectedEntries.size === 0;
        if (downloadButtonRef.current) {
            downloadButtonRef.current.disabled = isDisabled;
        }
        if (deleteButtonRef.current) {
            deleteButtonRef.current.disabled = isDisabled;
        }
        if (clearSelectionButtonRef.current) {
            clearSelectionButtonRef.current.disabled = isDisabled;
        }
    }, [selectedEntries]);

    useEffect(() => {
        if (selectAllButtonRef.current) {
            selectAllButtonRef.current.disabled = allEntries.length === 0;
        }
    }, [allEntries]);

    useEffect(() => {
        if (clearSearchButtonRef.current) {
            clearSearchButtonRef.current.disabled = searchQuery === "";
        }
    }, [searchQuery]);

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

    let shadowClass = '';
    if (isOverflowingTop && isOverflowingBottom) {
        shadowClass = 'scroll-shadow-both';
    } else if (isOverflowingTop) {
        shadowClass = 'scroll-shadow-top';
    } else if (isOverflowingBottom) {
        shadowClass = 'scroll-shadow-bottom';
    }

    const anyModalIsOpen =
        isNewEntryModalOpen ||
        isDeleteEntryModalOpen ||
        isQRCodeModalOpen ||
        isEditModalOpen ||
        isDeleteOptionsModalOpen ||
        isExportCSVModalOpen ||
        isExportPDFModalOpen ||
        isPrintModalOpen;

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
                                whileHover={selectedEntries.size > 0 ? { scale: 1.05 } : {}}
                                whileTap={selectedEntries.size > 0 ? { scale: 0.95 } : {}}
                            >
                                    <md-outlined-icon-button 
                                        ref={clearSelectionButtonRef} 
                                        onClick={handleClearSelection}
                                    >
                                    <md-icon>history</md-icon>
                                </md-outlined-icon-button>
                            </motion.div>
                            <motion.div
                                whileHover={allEntries.length > 0 ? { scale: 1.05 } : {}}
                                whileTap={allEntries.length > 0 ? { scale: 0.95 } : {}}
                            >
                                <md-outlined-icon-button ref={selectAllButtonRef} onClick={handleSelectAll}>
                                    <md-icon>{getSelectAllIcon()}</md-icon>
                                </md-outlined-icon-button>
                            </motion.div>
                            <motion.div
                                whileHover={selectedEntries.size > 0 ? { scale: 1.05 } : {}}
                                whileTap={selectedEntries.size > 0 ? { scale: 0.95 } : {}}
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
                                whileHover={selectedEntries.size > 0 ? { scale: 1.05 } : {}}
                                whileTap={selectedEntries.size > 0 ? { scale: 0.95 } : {}}
                            >
                                <md-outlined-icon-button
                                    ref={deleteButtonRef}
                                    onClick={handleDeleteClick}
                                >
                                    <md-icon>delete</md-icon>
                                </md-outlined-icon-button>
                            </motion.div>
                        </div>
                        <h1 className="text-3xl font-bold text-[var(--theme-text)]">Entries</h1>
                        <div className="absolute right-0 flex items-center gap-2">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                {isSearchActive ? (
                                    <md-filled-icon-button onClick={() => {
                                        setSearchQuery("");
                                        setIsSearchActive(false);
                                    }}>
                                        <md-icon>search</md-icon>
                                    </md-filled-icon-button>
                                ) : (
                                    <md-outlined-icon-button onClick={() => setIsSearchActive(true)}>
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
                        {isSearchActive && (
                            <motion.div
                                ref={searchContainerRef}
                                initial={{ opacity: 0, scaleY: 0 }}
                                animate={{ opacity: 1, scaleY: 1 }}
                                exit={{ opacity: 0, scaleY: 0 }}
                                transition={{ duration: 0.25 }}
                                style={{ transformOrigin: 'top' }}
                                className="mb-6 p-4 border border-[var(--theme-outline)] rounded-xl bg-[var(--theme-card-bg)] shadow-[0_10px_15px_-3px_var(--theme-shadow-color)]"
                            >
                                <div className="relative flex items-center">
                                    <input
                                        ref={searchInputRef}
                                        placeholder="Search"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full py-[7px] pl-4 pr-12 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="absolute right-0 z-10 flex items-center pr-2"
                                    >
                                        <md-icon-button 
                                            ref={clearSearchButtonRef} 
                                            onClick={() => {
                                                setSearchQuery("");
                                                if (searchInputRef.current) {
                                                    searchInputRef.current.value = "";
                                                }
                                            }}
                                            disabled={!searchQuery}
                                        >
                                            <md-icon>close</md-icon>
                                        </md-icon-button>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div 
                        ref={scrollContainerRef} 
                        className={`flex-1 overflow-y-auto ${shadowClass}`}
                    >
                        <div className="flex flex-col gap-4">
                            {allEntries.map((entry) => {
                                const isSelected = selectedEntries.has(entry.code);

                                return (
                                    <motion.div
                                        key={entry.code}
                                        whileHover={{ boxShadow: "inset 0 0 0 2px var(--theme-primary)" }}
                                        className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'bg-[var(--theme-highlight)] border-[var(--theme-primary)]'
                                                : 'border-[var(--theme-outline)]'
                                        }`}
                                        onClick={() => handleToggleSelect(entry.code)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <md-icon-button onClick={() => handleToggleSelect(entry.code)}>
                                                    <md-icon>{isSelected ? 'check_box' : 'check_box_outline_blank'}</md-icon>
                                                </md-icon-button>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-lg">{entry.name}</p>
                                            </div>
                                        </div>

                                        <div onClick={(e) => e.stopPropagation()} className="flex gap-2 items-center">
                                            <md-icon-button onClick={() => navigate(`/entries/${entry.code}`)}>
                                                <md-icon>account_circle</md-icon>
                                            </md-icon-button>
                                            <md-icon-button onClick={() => handleEditClick(entry)}>
                                                <md-icon>edit</md-icon>
                                            </md-icon-button>
                                            <md-icon-button onClick={() => handleCopyClick(entry)}>
                                                <md-icon>content_copy</md-icon>
                                            </md-icon-button>
                                            <md-icon-button onClick={() => handleQRCodeClick(entry)}>
                                                <md-icon>qr_code_2</md-icon>
                                            </md-icon-button>
                                            <md-icon-button onClick={() => handleDeleteClickEntry(entry)}>
                                                <md-icon>delete</md-icon>
                                            </md-icon-button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                         {totalEntries === 0 && (
                            <p className="text-center p-8 text-[var(--theme-text)] opacity-70">No entries found.</p>
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
                                Results: {totalEntries}
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
                                    <option value="alpha-asc">{"A - Z"}</option>
                                    <option value="alpha-desc">{"Z - A"}</option>
                                    <option value="date-asc">{"Oldest"}</option>
                                    <option value="date-desc">{"Newest"}</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                                    <md-icon>{isSortOpen ? 'unfold_less' : 'unfold_more'}</md-icon>
                                </div>
                            </div>
                            <div className="relative">
                                <select
                                    value={entriesPerPage}
                                    onChange={(e) => {
                                        setEntriesPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    onClick={() => setIsEntriesPerPageOpen(!isEntriesPerPageOpen)}
                                    onBlur={() => setIsEntriesPerPageOpen(false)}
                                    className="appearance-none p-2 pl-3 pr-8 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                                >
                                    <option value="5">5</option>
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                                    <md-icon>{isEntriesPerPageOpen ? 'unfold_less' : 'unfold_more'}</md-icon>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportCSV}
                accept=".csv"
                style={{ display: 'none' }}
            />

            {createPortal(
                <AnimatePresence>
                    {isNewEntryModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsNewEntryModalOpen(false)}
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
                                <NewEntryPage
                                    statusMessage={statusMessage}
                                    setStatusMessage={setStatusMessage}
                                    onClose={() => setIsNewEntryModalOpen(false)}
                                    onSuccess={handleNewEntrySuccess}
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
                                    entries={entriesToDelete}
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
                                    entry={entryForQRCode}
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
                    {isEditModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditModalOpen(false)}
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
                                    onClose={() => setIsEditModalOpen(false)}
                                    entry={entryToEdit}
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
                                    title="Delete Entries"
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

            {createPortal(
                <AnimatePresence>
                    {isPrintModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPrintModalOpen(false)}
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
                                <PrintBadgesPage
                                    statusMessage={statusMessage}
                                    setStatusMessage={setStatusMessage}
                                    onClose={() => setIsPrintModalOpen(false)}
                                    onPrintCurrent={handlePrintCurrentPage}
                                    onPrintSelected={handlePrintAllSelected}
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
                                        <a href="#" onClick={(e) => { e.preventDefault(); openNewEntryModal(); setIsAddMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                                            <md-icon>add_circle</md-icon>
                                            <span>Create New Entry</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); handleUploadClick(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                                            <md-icon>csv</md-icon>
                                            <span>Import from CSV</span>
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
                                                openPrintModal();
                                                setIsDownloadMenuOpen(false);
                                            }}
                                            className={`flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] ${selectedEntries.size > 0 ? 'hover:bg-[var(--theme-highlight)]' : 'opacity-50 cursor-not-allowed'}`}
                                        >
                                            <md-icon>print</md-icon>
                                            <span>Print Badges</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                openExportPDFModal();
                                                setIsDownloadMenuOpen(false);
                                            }}
                                            className={`flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] ${selectedEntries.size > 0 ? 'hover:bg-[var(--theme-highlight)]' : 'opacity-50 cursor-not-allowed'}`}
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
                                            className={`flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] ${selectedEntries.size > 0 ? 'hover:bg-[var(--theme-highlight)]' : 'opacity-50 cursor-not-allowed'}`}
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
        </>
    );
};

export default EntriesPage;
