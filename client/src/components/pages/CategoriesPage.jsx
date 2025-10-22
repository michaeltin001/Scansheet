import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StatusMessage from '../ui/StatusMessage';
import NewCategoryPage from '../modals/category/NewCategoryPage';
import DeleteCategoryPage from '../modals/category/DeleteCategoryPage';
import EditCategoryPage from '../modals/category/EditCategoryPage';
import DeletePage from '../modals/common/DeletePage';
import ExportToCSVPage from '../modals/common/ExportToCSVPage';
import ExportToPDFPage from '../modals/common/ExportToPDFPage';
import { useOverflow } from '../../hooks/useOverflow';
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";
import "@material/web/button/filled-button.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/iconbutton/filled-icon-button.js";

const CategoriesPage = ({ statusMessage, setStatusMessage }) => {
    const [allCategories, setAllCategories] = useState([]);
    const [totalCategories, setTotalCategories] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [sortOption, setSortOption] = useState(() => {
        const savedSortOption = localStorage.getItem('categorySortOption');
        return savedSortOption || 'alpha-asc';
    });
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [categoriesPerPage, setCategoriesPerPage] = useState(() => {
        const saved = localStorage.getItem('categoriesPerPage');
        return saved ? parseInt(saved, 10) : 50;
    });
    const [isCategoriesPerPageOpen, setIsCategoriesPerPageOpen] = useState(false);
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [addMenuPosition, setAddMenuPosition] = useState({});
    const [addIconPosition, setAddIconPosition] = useState({});
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
    const [downloadMenuPosition, setDownloadMenuPosition] = useState({});
    const [downloadIconPosition, setDownloadIconPosition] = useState({});

    const [isDeleteOptionsModalOpen, setIsDeleteOptionsModalOpen] = useState(false);
    const [isExportCSVModalOpen, setIsExportCSVModalOpen] = useState(false);
    const [isExportPDFModalOpen, setIsExportPDFModalOpen] = useState(false);

    const [categoriesToDelete, setCategoriesToDelete] = useState([]);
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

    const { isOverflowingTop, isOverflowingBottom } = useOverflow(scrollContainerRef, allCategories);
    const navigate = useNavigate();
    const totalPages = Math.ceil(totalCategories / categoriesPerPage);

    const selectedNamesOnCurrentPage = useMemo(() => {
        const paginatedCodes = new Set(allCategories.map(c => c.code));
        return Array.from(selectedCategories).filter(code => paginatedCodes.has(code));
    }, [allCategories, selectedCategories]);

    const updateBounds = () => {
        if (contentBoxRef.current) {
            setContentBoxBounds(contentBoxRef.current.getBoundingClientRect());
        }
    };

    useEffect(() => {
        localStorage.setItem('categorySortOption', sortOption);
    }, [sortOption]);

    useEffect(() => {
        localStorage.setItem('categoriesPerPage', String(categoriesPerPage));
    }, [categoriesPerPage]);

    useEffect(() => {
        window.addEventListener('resize', updateBounds);
        return () => {
            window.removeEventListener('resize', updateBounds);
        };
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [sortOption, currentPage, categoriesPerPage, searchQuery]);

    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                setIsNewCategoryModalOpen(false);
                setIsDeleteCategoryModalOpen(false);
                setIsEditModalOpen(false);
                setIsAddMenuOpen(false);
                setIsDownloadMenuOpen(false);
                setIsDeleteOptionsModalOpen(false);
                setIsExportCSVModalOpen(false);
                setIsExportPDFModalOpen(false);
            }
        };
        document.addEventListener("keydown", handleEscKey);
        return () => {
            document.removeEventListener("keydown", handleEscKey);
        };
    }, []);

    useEffect(() => {
        const isDisabled = selectedCategories.size === 0;
        if (downloadButtonRef.current) {
            downloadButtonRef.current.disabled = isDisabled;
        }
        if (deleteButtonRef.current) {
            deleteButtonRef.current.disabled = isDisabled;
        }
        if (clearSelectionButtonRef.current) {
            clearSelectionButtonRef.current.disabled = isDisabled;
        }
    }, [selectedCategories]);

    useEffect(() => {
        if (selectAllButtonRef.current) {
            const selectableCategories = allCategories.filter(c => c.name !== 'General');
            selectAllButtonRef.current.disabled = selectableCategories.length === 0;
        }
    }, [allCategories]);

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

    const fetchCategories = async () => {
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
            const response = await fetch(`/api/categories?sortBy=${sortBy}&order=${order}&page=${currentPage}&limit=${categoriesPerPage}&search=${searchQuery}`);
            const data = await response.json();
            
            if (response.ok) {
                setAllCategories(data.data);
                setTotalCategories(data.total);
            } else {
                setStatusMessage('Failed to fetch categories.');
            }
        } catch (error) {
            setStatusMessage('Could not fetch categories.');
        }
    };

    const getSelectAllIcon = () => {
        const paginatedCodes = new Set(allCategories.filter(c => c.name !== 'General').map(c => c.code));
        if (paginatedCodes.size === 0) return 'check_box_outline_blank';

        const selectedOnPageCount = Array.from(selectedCategories).filter(code => paginatedCodes.has(code)).length;

        if (selectedOnPageCount === paginatedCodes.size) {
            return 'check_box';
        } else if (selectedOnPageCount > 0) {
            return 'indeterminate_check_box';
        } else {
            return 'check_box_outline_blank';
        }
    };

    const handleToggleSelect = (code) => {
        setSelectedCategories(prevSelected => {
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
        const paginatedCodes = new Set(allCategories.filter(c => c.name !== 'General').map(c => c.code));
        const selectedOnPageCount = Array.from(selectedCategories).filter(code => paginatedCodes.has(code)).length;

        if (selectedOnPageCount === paginatedCodes.size) {
            setSelectedCategories(prev => {
                const newSet = new Set(prev);
                paginatedCodes.forEach(code => newSet.delete(code));
                return newSet;
            });
        } else {
            setSelectedCategories(prev => new Set([...prev, ...paginatedCodes]));
        }
    };

    const handleClearSelection = () => {
        setSelectedCategories(new Set());
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

    const handleEditClick = (category) => {
        if (category.name.toLowerCase() === 'general') {
            setStatusMessage("The 'General' category cannot be edited.");
            return;
        }
        updateBounds();
        setCategoryToEdit(category);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        setCategoryToEdit(null);
        fetchCategories();
    };

    const handleDeleteSuccess = () => {
        setIsDeleteCategoryModalOpen(false);
        const deletedCodes = new Set(categoriesToDelete.map(category => category.code));
        setSelectedCategories(prevSelected => {
            const newSelected = new Set(prevSelected);
            deletedCodes.forEach(code => newSelected.delete(code));
            return newSelected;
        });
        setCategoriesToDelete([]);
        fetchCategories();
    };

    const handleDeleteClick = () => {
        const generalCategory = allCategories.find(c => c.name.toLowerCase() === 'general');
        if (generalCategory && selectedCategories.has(generalCategory.code)) {
            setStatusMessage("The 'General' category cannot be deleted.");
            return;
        }

        if (selectedCategories.size > 0) {
            updateBounds();
            setIsDeleteOptionsModalOpen(true);
        } else {
            setStatusMessage("No categories selected.");
        }
    };

    const handleDeleteClickCategory = (category) => {
        if (category.name.toLowerCase() === 'general') {
            setStatusMessage("The 'General' category cannot be deleted.");
            return;
        }
        updateBounds();
        setCategoriesToDelete([category]);
        setIsDeleteCategoryModalOpen(true);
    };

    const handleDeleteCurrentPage = () => {
        const dummyCategories = selectedNamesOnCurrentPage.map(code => ({ code: code }));
        setCategoriesToDelete(dummyCategories);
        setIsDeleteOptionsModalOpen(false);
        setIsDeleteCategoryModalOpen(true);
    };

    const handleDeleteAllSelected = () => {
        const dummyCategories = Array.from(selectedCategories).map(code => ({ code: code }));
        setCategoriesToDelete(dummyCategories);
        setIsDeleteOptionsModalOpen(false);
        setIsDeleteCategoryModalOpen(true);
    };

    const openNewCategoryModal = () => {
        updateBounds();
        setIsNewCategoryModalOpen(true);
    };

    const handleNewCategorySuccess = () => {
        setIsNewCategoryModalOpen(false);
        fetchCategories();
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
            const response = await fetch('/api/categories/import', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            setStatusMessage(data.message || data.error);
            if (response.ok) {
                fetchCategories();
            }
        } catch (error) {
            setStatusMessage('Could not upload categories.');
        } finally {
            event.target.value = null;
        }
    };

    const handleExportCSV = async (codesToExport) => {
        if (!codesToExport || codesToExport.length === 0) {
            setStatusMessage("No categories selected for download.");
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
            const response = await fetch('/api/categories/export-csv', {
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
                let filename = 'categories.csv';
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
                setStatusMessage(`Successfully exported ${count} categories.`);
            } else {
                const errorData = await response.json();
                setStatusMessage(errorData.error || 'Could not download categories.');
            }
        } catch (error) {
            setStatusMessage('Could not download categories.');
        }
    };

    const handleExportPDF = async (codesToExport) => {
        if (!codesToExport || codesToExport.length === 0) {
            setStatusMessage("No categories selected for PDF export.");
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
            const response = await fetch('/api/categories/export-pdf', {
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
                let filename = 'categories.pdf';
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
                setStatusMessage(`Successfully exported ${count} categories.`);
            } else {
                const errorData = await response.json();
                setStatusMessage(errorData.error || 'Could not download categories.');
            }
        } catch (error) {
            setStatusMessage('Could not download categories.');
        }
    };

    const handleExportCSVCurrentPage = () => {
        handleExportCSV(selectedNamesOnCurrentPage);
        setIsExportCSVModalOpen(false);
    };

    const handleExportCSVAllSelected = () => {
        handleExportCSV(Array.from(selectedCategories));
        setIsExportCSVModalOpen(false);
    };

    const handleExportPDFCurrentPage = () => {
        handleExportPDF(selectedNamesOnCurrentPage);
        setIsExportPDFModalOpen(false);
    };

    const handleExportPDFAllSelected = () => {
        handleExportPDF(Array.from(selectedCategories));
        setIsExportPDFModalOpen(false);
    };

    const openExportCSVModal = () => {
        if (selectedCategories.size > 0) {
            updateBounds();
            setIsExportCSVModalOpen(true);
        } else {
            setStatusMessage("No categories selected.");
        }
    };

    const openExportPDFModal = () => {
        if (selectedCategories.size > 0) {
            updateBounds();
            setIsExportPDFModalOpen(true);
        } else {
            setStatusMessage("No categories selected.");
        }
    };

    const generalCategory = allCategories.find(c => c.name === 'General');
    const otherCategories = allCategories.filter(c => c.name !== 'General');

    let shadowClass = '';
    if (isOverflowingTop && isOverflowingBottom) {
        shadowClass = 'scroll-shadow-both';
    } else if (isOverflowingTop) {
        shadowClass = 'scroll-shadow-top';
    } else if (isOverflowingBottom) {
        shadowClass = 'scroll-shadow-bottom';
    }

    const anyModalIsOpen =
        isNewCategoryModalOpen ||
        isDeleteCategoryModalOpen ||
        isEditModalOpen ||
        isDeleteOptionsModalOpen ||
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
                                whileHover={selectedCategories.size > 0 ? { scale: 1.05 } : {}}
                                whileTap={selectedCategories.size > 0 ? { scale: 0.95 } : {}}
                            >
                                    <md-outlined-icon-button 
                                        ref={clearSelectionButtonRef} 
                                        onClick={handleClearSelection}
                                    >
                                    <md-icon>history</md-icon>
                                </md-outlined-icon-button>
                            </motion.div>
                            <motion.div
                                whileHover={allCategories.length > 0 ? { scale: 1.05 } : {}}
                                whileTap={allCategories.length > 0 ? { scale: 0.95 } : {}}
                            >
                                <md-outlined-icon-button ref={selectAllButtonRef} onClick={handleSelectAll}>
                                    <md-icon>{getSelectAllIcon()}</md-icon>
                                </md-outlined-icon-button>
                            </motion.div>
                            <motion.div
                                whileHover={selectedCategories.size > 0 ? { scale: 1.05 } : {}}
                                whileTap={selectedCategories.size > 0 ? { scale: 0.95 } : {}}
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
                                whileHover={selectedCategories.size > 0 ? { scale: 1.05 } : {}}
                                whileTap={selectedCategories.size > 0 ? { scale: 0.95 } : {}}
                            >
                                <md-outlined-icon-button
                                    ref={deleteButtonRef}
                                    onClick={handleDeleteClick}
                                >
                                    <md-icon>delete</md-icon>
                                </md-outlined-icon-button>
                            </motion.div>
                        </div>
                        <h1 className="text-3xl font-bold text-[var(--theme-text)]">Categories</h1>
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
                            {generalCategory && (
                                <div
                                    key={generalCategory.code}
                                    className="border rounded-lg p-4 flex justify-between items-center transition-colors border-[var(--theme-outline)] opacity-60"
                                >
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <md-icon-button disabled>
                                                <md-icon>check_box_outline_blank</md-icon>
                                            </md-icon-button>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">{generalCategory.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 items-center">
                                        <md-icon-button disabled>
                                            <md-icon>edit</md-icon>
                                        </md-icon-button>
                                        <md-icon-button disabled>
                                            <md-icon>delete</md-icon>
                                        </md-icon-button>
                                    </div>
                                </div>
                            )}
                            {otherCategories.map((category) => {
                                const isSelected = selectedCategories.has(category.code);

                                return (
                                    <motion.div
                                        key={category.code}
                                        whileHover={{ boxShadow: "inset 0 0 0 2px var(--theme-primary)" }}
                                        className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'bg-[var(--theme-highlight)] border-[var(--theme-primary)]'
                                                : 'border-[var(--theme-outline)]'
                                        }`}
                                        onClick={() => handleToggleSelect(category.code)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <md-icon-button onClick={() => handleToggleSelect(category.code)}>
                                                    <md-icon>{isSelected ? 'check_box' : 'check_box_outline_blank'}</md-icon>
                                                </md-icon-button>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-lg">{category.name}</p>
                                            </div>
                                        </div>

                                        <div onClick={(e) => e.stopPropagation()} className="flex gap-2 items-center">
                                            <md-icon-button onClick={() => handleEditClick(category)}>
                                                <md-icon>edit</md-icon>
                                            </md-icon-button>
                                            <md-icon-button onClick={() => handleDeleteClickCategory(category)}>
                                                <md-icon>delete</md-icon>
                                            </md-icon-button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                         {totalCategories === 0 && (
                            <p className="text-center p-8 text-[var(--theme-text)] opacity-70">No categories found.</p>
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
                                Results: {totalCategories}
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
                                    value={categoriesPerPage}
                                    onChange={(e) => {
                                        setCategoriesPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    onClick={() => setIsCategoriesPerPageOpen(!isCategoriesPerPageOpen)}
                                    onBlur={() => setIsCategoriesPerPageOpen(false)}
                                    className="appearance-none p-2 pl-3 pr-8 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                                >
                                    <option value="5">5</option>
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                                    <md-icon>{isCategoriesPerPageOpen ? 'unfold_less' : 'unfold_more'}</md-icon>
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
                    {isNewCategoryModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsNewCategoryModalOpen(false)}
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
                                <NewCategoryPage
                                    statusMessage={statusMessage}
                                    setStatusMessage={setStatusMessage}
                                    onClose={() => setIsNewCategoryModalOpen(false)}
                                    onSuccess={handleNewCategorySuccess}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.getElementById('portal-root')
            )}
            {createPortal(
                <AnimatePresence>
                    {isDeleteCategoryModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDeleteCategoryModalOpen(false)}
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
                                <DeleteCategoryPage
                                    statusMessage={statusMessage}
                                    setStatusMessage={setStatusMessage}
                                    onClose={() => setIsDeleteCategoryModalOpen(false)}
                                    categories={categoriesToDelete}
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
                                <EditCategoryPage
                                    statusMessage={statusMessage}
                                    setStatusMessage={setStatusMessage}
                                    onClose={() => setIsEditModalOpen(false)}
                                    category={categoryToEdit}
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
                                    title="Delete Categories"
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
                                        <a href="#" onClick={(e) => { e.preventDefault(); openNewCategoryModal(); setIsAddMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-highlight)]">
                                            <md-icon>add_circle</md-icon>
                                            <span>Create New Category</span>
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
                                                openExportPDFModal();
                                                setIsDownloadMenuOpen(false);
                                            }}
                                            className={`flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] ${selectedCategories.size > 0 ? 'hover:bg-[var(--theme-highlight)]' : 'opacity-50 cursor-not-allowed'}`}
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
                                            className={`flex items-center gap-3 px-4 py-2 text-sm text-[var(--theme-text)] ${selectedCategories.size > 0 ? 'hover:bg-[var(--theme-highlight)]' : 'opacity-50 cursor-not-allowed'}`}
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

export default CategoriesPage;
