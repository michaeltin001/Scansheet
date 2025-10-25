import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusMessage from '../ui/StatusMessage';
import CategoriesToolbar from './CategoriesPage/CategoriesToolbar';
import CategoriesList from './CategoriesPage/CategoriesList';
import CategoriesPagination from './CategoriesPage/CategoriesPagination';
import CategoriesModals from './CategoriesPage/CategoriesModals';
import CategoriesMenus from './CategoriesPage/CategoriesMenus';
import { useOverflow } from '../../hooks/useOverflow';
import "@material/web/icon/icon.js";

const CategoriesPage = ({ statusMessage, setStatusMessage }) => {
    const [allCategories, setAllCategories] = useState([]);
    const [totalCategories, setTotalCategories] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [sortOption, setSortOption] = useState(() => {
        const savedSortOption = localStorage.getItem('categorySortOption');
        return savedSortOption || 'alpha-asc';
    });
    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [categoriesPerPage, setCategoriesPerPage] = useState(() => {
        const saved = localStorage.getItem('categoriesPerPage');
        return saved ? parseInt(saved, 10) : 50;
    });
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

    const { isOverflowingTop, isOverflowingBottom } = useOverflow(scrollContainerRef, allCategories);
    const navigate = useNavigate();
    const totalPages = Math.ceil(totalCategories / categoriesPerPage);

    const selectedCodesOnCurrentPage = useMemo(() => {
        const paginatedCodes = new Set(allCategories.filter(c => c.name !== 'General').map(c => c.code));
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

    const closeAllModalsAndMenus = () => {
        setIsNewCategoryModalOpen(false);
        setIsDeleteCategoryModalOpen(false);
        setIsEditModalOpen(false);
        setIsAddMenuOpen(false);
        setIsDownloadMenuOpen(false);
        setIsDeleteOptionsModalOpen(false);
        setIsExportCSVModalOpen(false);
        setIsExportPDFModalOpen(false);
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
        const dummyCategories = selectedCodesOnCurrentPage.map(code => ({ code: code }));
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
        handleExportCSV(selectedCodesOnCurrentPage);
        setIsExportCSVModalOpen(false);
    };

    const handleExportCSVAllSelected = () => {
        handleExportCSV(Array.from(selectedCategories));
        setIsExportCSVModalOpen(false);
    };

    const handleExportPDFCurrentPage = () => {
        handleExportPDF(selectedCodesOnCurrentPage);
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

    const handleCategoriesPerPageChange = (newLimit) => {
        setCategoriesPerPage(newLimit);
        setCurrentPage(1);
    };

    const handleSortChange = (newSortOption) => {
        setSortOption(newSortOption);
        setCurrentPage(1);
    };

    const modalStates = {
        isNewCategoryModalOpen,
        isDeleteCategoryModalOpen,
        isEditModalOpen,
        isDeleteOptionsModalOpen,
        isExportCSVModalOpen,
        isExportPDFModalOpen,
    };

    const modalHandlers = {
        closeNewCategoryModal: () => setIsNewCategoryModalOpen(false),
        handleNewCategorySuccess,
        closeDeleteCategoryModal: () => setIsDeleteCategoryModalOpen(false),
        handleDeleteSuccess,
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

                    <CategoriesToolbar
                        selectedCategories={selectedCategories}
                        allCategories={allCategories}
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
                        <CategoriesList
                            allCategories={allCategories}
                            selectedCategories={selectedCategories}
                            onToggleSelect={handleToggleSelect}
                            onEditClick={handleEditClick}
                            onDeleteClick={handleDeleteClickCategory}
                            totalCategories={totalCategories}
                        />
                    </div>

                    <CategoriesPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCategories={totalCategories}
                        categoriesPerPage={categoriesPerPage}
                        sortOption={sortOption}
                        onPageChange={handlePageChange}
                        onCategoriesPerPageChange={handleCategoriesPerPageChange}
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

            <CategoriesModals
                statusMessage={statusMessage}
                setStatusMessage={setStatusMessage}
                contentBoxBounds={contentBoxBounds}
                modalStates={modalStates}
                modalHandlers={modalHandlers}
                categoriesToDelete={categoriesToDelete}
                categoryToEdit={categoryToEdit}
            />

            <CategoriesMenus
                isAddMenuOpen={isAddMenuOpen}
                closeAddMenu={() => setIsAddMenuOpen(false)}
                addIconPosition={addIconPosition}
                addMenuPosition={addMenuPosition}
                openNewCategoryModal={openNewCategoryModal}
                handleUploadClick={handleUploadClick}
                isDownloadMenuOpen={isDownloadMenuOpen}
                closeDownloadMenu={() => setIsDownloadMenuOpen(false)}
                downloadIconPosition={downloadIconPosition}
                downloadMenuPosition={downloadMenuPosition}
                openExportPDFModal={openExportPDFModal}
                openExportCSVModal={openExportCSVModal}
                selectedCategoriesCount={selectedCategories.size}
            />
        </>
    );
};

export default CategoriesPage;
