import React, { useState, useEffect, useRef, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();
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

    useEffect(() => {
        if (location.state?.message) {
            setStatusMessage(location.state.message);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, setStatusMessage, navigate]);

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
            const data = await invoke('get_entries', {
                sortBy,
                order,
                page: currentPage,
                limit: entriesPerPage,
                search: searchQuery
            });
            setAllEntries(data.data);
            setTotalEntries(data.total);
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
        setTimeout(() => {
            setStatusMessage("Successfully updated entry.");
        }, 500);
    };

    const handleDeleteSuccess = () => {
        setIsDeleteEntryModalOpen(false);
        const deletedCodes = new Set(entriesToDelete.map(entry => entry.code));
        setSelectedEntries(prevSelected => {
            const newSelected = new Set(prevSelected);
            deletedCodes.forEach(code => newSelected.delete(code));
            return newSelected;
        });
        const count = entriesToDelete.length;
        const message = count > 1
            ? `Successfully deleted ${count} entries.`
            : "Successfully deleted entry.";
        setEntriesToDelete([]);
        fetchEntries();
        setTimeout(() => {
            setStatusMessage(message);
        }, 500);
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
            const data = await invoke('get_entry', { code: entry.code });
            if (!data.data) {
                setStatusMessage("Entry not found.");
                return;
            }
            updateBounds();
            setEntryForQRCode(data.data);
            setIsQRCodeModalOpen(true);
        } catch (error) {
            setStatusMessage('Entry not found.');
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
        setTimeout(() => {
            setStatusMessage("Successfully created entry.");
        }, 500);
    };

    const handleUploadClick = async () => {
        setIsAddMenuOpen(false);
        try {
            const { open } = await import('@tauri-apps/plugin-dialog');
            const { invoke } = await import('@tauri-apps/api/core');
            const selectedPath = await open({
                multiple: false,
                filters: [{ name: 'CSV', extensions: ['csv'] }]
            });
            if (selectedPath) {
                const message = await invoke('import_csv', { path: selectedPath });
                setStatusMessage(message);
                fetchEntries();
            }
        } catch (error) {
            setStatusMessage('Could not import entries: ' + error);
        }
    };

    const handleImportCSV = async (event) => {
        // Obsolete: Replaced by native dialog in handleUploadClick
    };

    const handleExportCSV = async (codesToExport) => {
        if (!codesToExport || codesToExport.length === 0) {
            setStatusMessage("No entries selected for download.");
            return;
        }

        let sortBy = 'name';
        let order = 'ASC';

        switch (sortOption) {
            case 'alpha-desc': order = 'DESC'; break;
            case 'date-asc': sortBy = 'date'; break;
            case 'date-desc': sortBy = 'date'; order = 'DESC'; break;
        }

        try {
            const { save } = await import('@tauri-apps/plugin-dialog');
            const { writeFile } = await import('@tauri-apps/plugin-fs');
            const { invoke } = await import('@tauri-apps/api/core');

            const filePath = await save({
                defaultPath: 'entries.csv',
                filters: [{ name: 'CSV', extensions: ['csv'] }]
            });

            if (!filePath) return;

            const entries = await invoke('get_entries_by_codes', { codes: codesToExport, sortBy, order, includeImage: false });
            
            let csvContent = '"Name","Code","Date"\n';
            entries.forEach(entry => {
                const d = new Date(entry.date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                csvContent += `"${entry.name}","${entry.code}","${year}-${month}-${day}"\n`;
            });

            await writeFile(filePath, new TextEncoder().encode(csvContent));
            setStatusMessage(`Successfully exported ${entries.length} entries.`);
        } catch (error) {
            setStatusMessage('Could not download entries: ' + error);
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
            case 'alpha-desc': order = 'DESC'; break;
            case 'date-asc': sortBy = 'date'; break;
            case 'date-desc': sortBy = 'date'; order = 'DESC'; break;
        }

        try {
            const { save } = await import('@tauri-apps/plugin-dialog');
            const { writeFile } = await import('@tauri-apps/plugin-fs');
            const { invoke } = await import('@tauri-apps/api/core');
            const { jsPDF } = await import('jspdf');
            const filePath = await save({
                defaultPath: 'entries.pdf',
                filters: [{ name: 'PDF', extensions: ['pdf'] }]
            });

            if (!filePath) return;

            const entries = await invoke('get_entries_by_codes', { codes: codesToExport, sortBy, order, includeImage: false });
            
            const doc = new jsPDF({ unit: 'pt', format: 'letter' });
            doc.setLineWidth(1);

            const generateTable = (doc, tableRows) => {
                let tableTop = 72;
                const nameX = 72;
                const codeX = 250;
                const dateX = 450;
                const tableWidth = 478;
                const rowHeight = 25;
                let y = tableTop;

                const drawPage = (isFirstPage) => {
                    if (!isFirstPage) {
                        doc.addPage();
                        tableTop = 72;
                        y = tableTop;
                    }

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.text('Name', nameX, y + 6, { baseline: 'top' });
                    doc.text('Code', codeX, y + 6, { baseline: 'top' });
                    doc.text('Date', dateX, y + 6, { baseline: 'top' });
                    
                    doc.line(nameX - 10, y, nameX - 10 + tableWidth, y);
                    doc.line(nameX - 10, y + rowHeight, nameX - 10 + tableWidth, y + rowHeight);

                    y += rowHeight;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(12);
                };

                drawPage(true);

                tableRows.forEach((row, index) => {
                    if (index > 0 && index % 25 === 0) {
                        doc.line(nameX - 10, tableTop, nameX - 10, y);
                        doc.line(codeX - 10, tableTop, codeX - 10, y);
                        doc.line(dateX - 10, tableTop, dateX - 10, y);
                        doc.line(nameX - 10 + tableWidth, tableTop, nameX - 10 + tableWidth, y);
                        
                        drawPage(false);
                    }

                    const d = new Date(row.date);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const dayOfMonth = String(d.getDate()).padStart(2, '0');
                    const date = `${month}/${dayOfMonth}/${year}`;
                    
                    doc.setFontSize(10);
                    doc.text(row.name, nameX, y + 6, { baseline: 'top' });
                    doc.setFontSize(8);
                    doc.text(row.code, codeX, y + 6, { baseline: 'top' });
                    doc.setFontSize(10);
                    doc.text(date, dateX, y + 6, { baseline: 'top' });
                    
                    doc.line(nameX - 10, y + rowHeight, nameX - 10 + tableWidth, y + rowHeight);
                    y += rowHeight;
                });

                doc.line(nameX - 10, tableTop, nameX - 10, y);
                doc.line(codeX - 10, tableTop, codeX - 10, y);
                doc.line(dateX - 10, tableTop, dateX - 10, y);
                doc.line(nameX - 10 + tableWidth, tableTop, nameX - 10 + tableWidth, y);
            };

            generateTable(doc, entries);

            // Append summary page
            doc.addPage();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);

            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const dayOfMonth = String(now.getDate()).padStart(2, '0');
            const reportDate = `${month}/${dayOfMonth}/${year}`;
            
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const reportTime = `${hours}:${minutes}:${seconds}`;

            let yOffset = 72;
            doc.text(`Generated report on ${reportDate} at ${reportTime}.`, 72, yOffset, { baseline: 'top' });
            yOffset += 14.4;
            doc.text(`Successfully exported ${entries.length} entries.`, 72, yOffset, { baseline: 'top' });
            yOffset += 14.4;
            doc.text("Scansheet v1.0.0", 72, yOffset, { baseline: 'top' });

            const arrayBuffer = doc.output('arraybuffer');
            await writeFile(filePath, new Uint8Array(arrayBuffer));
            
            setStatusMessage(`Successfully exported ${entries.length} entries.`);
        } catch (error) {
            setStatusMessage('Could not download entries: ' + error);
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
            const { save } = await import('@tauri-apps/plugin-dialog');
            const { writeFile } = await import('@tauri-apps/plugin-fs');
            const { invoke } = await import('@tauri-apps/api/core');
            const { jsPDF } = await import('jspdf');

            const entries = await invoke('get_entries_by_codes', { codes: codesToPrint, sortBy, order, includeImage: true });

            if (!entries || entries.length === 0) {
                setStatusMessage("Could not load entries for printing.");
                return;
            }

            // Generate dynamic filename for single badge prints like the old endpoint
            let defaultPath = 'badges.pdf';
            if (entries.length === 1) {
                const row = entries[0];
                defaultPath = `${row.name.replace(/\s+/g, '_')}_${row.code}.pdf`;
            }

            const filePath = await save({
                defaultPath: defaultPath,
                filters: [{ name: 'PDF', extensions: ['pdf'] }]
            });

            if (!filePath) return;

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'letter'
            });

            const pageWidth = 612;
            const pageHeight = 792;
            const top = 72;
            const bottom = 72;
            const left = 36;
            const right = 36;
            
            const printableW = pageWidth - left - right;
            const printableH = pageHeight - top - bottom;
            
            const labelW = printableW / 2;
            const labelH = printableH / 3;
            
            const positions = [
                { x: left, y: top },
                { x: left + labelW, y: top },
                { x: left, y: top + labelH },
                { x: left + labelW, y: top + labelH },
                { x: left, y: top + labelH * 2 },
                { x: left + labelW, y: top + labelH * 2 },
            ];

            for (let i = 0; i < entries.length; i++) {
                const slotIndex = i % 6;

                if (i > 0 && slotIndex === 0) {
                    doc.addPage();
                }

                const entry = entries[i];
                const pos = positions[slotIndex];
                const padding = 18;
                
                const boxW = labelW - padding * 2;
                const boxH = labelH - padding * 4;
                const imgSize = Math.min(boxW, boxH);
                
                const imgX = pos.x + padding + (boxW - imgSize) / 2;
                const imgY = pos.y + padding + (boxH - imgSize) / 2;

                // Pass the full Data URI directly to jsPDF instead of stripping the prefix
                doc.addImage(entry.code_png, 'PNG', imgX, imgY, imgSize, imgSize);

                const textY = pos.y + labelH - padding - 24;

                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                
                // Use splitTextToSize to dynamically calculate name height and prevent text overlap
                const nameLines = doc.splitTextToSize(entry.name, labelW);
                doc.text(nameLines, pos.x + labelW / 2, textY, {
                    align: 'center',
                    baseline: 'top'
                });

                const nameHeight = nameLines.length * 12;

                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.text(entry.code, pos.x + labelW / 2, textY + nameHeight + 2, {
                    align: 'center',
                    baseline: 'top',
                    maxWidth: labelW
                });
            }

            const arrayBuffer = doc.output('arraybuffer');
            await writeFile(filePath, new Uint8Array(arrayBuffer));
            
            setStatusMessage(`Successfully generated PDF.`);
        } catch (error) {
            setStatusMessage(error.message || error.toString());
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
