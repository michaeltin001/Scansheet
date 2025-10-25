import React, { useState, useRef, useEffect } from 'react';
import StatusMessage from '../ui/StatusMessage';
import HomeInfoCardGrid from './HomePage/HomeInfoCardGrid';
import HomeModals from './HomePage/HomeModals';
import { useOverflow } from '../../hooks/useOverflow';
import "@material/web/icon/icon.js";
import "@material/web/button/filled-button.js";

const HomePage = ({ statusMessage, setStatusMessage }) => {
    const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
    const [isNewScanModalOpen, setIsNewScanModalOpen] = useState(false);
    const [isCategorySelectionOpen, setIsCategorySelectionOpen] = useState(false);
    const [categorySelectionSource, setCategorySelectionSource] = useState(null);
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(() => {
        return localStorage.getItem('selectedCategory') || '';
    });
    const [contentBoxBounds, setContentBoxBounds] = useState(null);
    const contentBoxRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const { isOverflowingTop, isOverflowingBottom } = useOverflow(scrollContainerRef);

    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const categoriesResponse = await fetch('/api/categories');
                const categoriesData = await categoriesResponse.json();
                if (categoriesResponse.ok) {
                    setAllCategories(categoriesData.data);
                    if (!selectedCategory) {
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
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                closeAllModals();
            }
        };
        document.addEventListener("keydown", handleEscKey);
        return () => {
            document.removeEventListener("keydown", handleEscKey);
        };
    }, []);

    const updateBounds = () => {
        if (contentBoxRef.current) {
            setContentBoxBounds(contentBoxRef.current.getBoundingClientRect());
        }
    };

    useEffect(() => {
        window.addEventListener('resize', updateBounds);
        return () => {
            window.removeEventListener('resize', updateBounds);
        };
    }, []);

    const closeAllModals = () => {
        setIsScannerModalOpen(false);
        setIsNewScanModalOpen(false);
        setIsCategorySelectionOpen(false);
    }

    const openScannerModal = () => {
        updateBounds();
        setIsScannerModalOpen(true);
    };

    const openNewScanModal = () => {
        updateBounds();
        setIsNewScanModalOpen(true);
    };

    const openCategorySelectionModal = (source) => {
        setCategorySelectionSource(source);
        setIsNewScanModalOpen(false);
        setIsScannerModalOpen(false);
        setIsCategorySelectionOpen(true);
    };

    const handleNewScanSuccess = () => {
        setIsNewScanModalOpen(false);
        setTimeout(() => {
            setStatusMessage("Successfully created scan.");
        }, 500);
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
        isScannerModalOpen ||
        isNewScanModalOpen ||
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
                        <h1 className="text-3xl font-bold text-[var(--theme-text)]">Scansheet</h1>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        className={`flex-1 overflow-y-auto ${shadowClass}`}
                    >
                        <HomeInfoCardGrid
                            openScannerModal={openScannerModal}
                            openNewScanModal={openNewScanModal}
                            today={today}
                        />
                    </div>
                    <div className="mt-6 h-10"></div>
                </div>
            </main>

            <HomeModals
                statusMessage={statusMessage}
                setStatusMessage={setStatusMessage}
                isScannerModalOpen={isScannerModalOpen}
                closeScannerModal={() => setIsScannerModalOpen(false)}
                isNewScanModalOpen={isNewScanModalOpen}
                closeNewScanModal={() => setIsNewScanModalOpen(false)}
                isCategorySelectionOpen={isCategorySelectionOpen}
                closeCategorySelectionModal={() => setIsCategorySelectionOpen(false)}
                categorySelectionSource={categorySelectionSource}
                allCategories={allCategories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                contentBoxBounds={contentBoxBounds}
                openCategorySelectionModal={openCategorySelectionModal}
                handleNewScanSuccess={handleNewScanSuccess}
                setIsScannerModalOpen={setIsScannerModalOpen}
                setIsNewScanModalOpen={setIsNewScanModalOpen}
            />
        </>
    );
};

export default HomePage;
