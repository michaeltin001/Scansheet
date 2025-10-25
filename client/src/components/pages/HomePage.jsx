import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StatusMessage from '../ui/StatusMessage';
import ScannerPage from '../modals/scan/ScannerPage';
import NewScanPage from '../modals/scan/NewScanPage';
import CategorySelectionPage from '../modals/filter/CategorySelectionPage';
import { useOverflow } from '../../hooks/useOverflow';
import "@material/web/icon/icon.js";
import "@material/web/button/filled-button.js";

const InfoCard = ({ icon, title, color, onClick }) => (
    <motion.div
        whileHover={{ boxShadow: `inset 0 0 0 2px ${color}` }}
        onClick={onClick}
        className="bg-[var(--theme-surface-solid)] p-6 rounded-xl border border-[var(--theme-outline)] flex items-center gap-4 cursor-pointer"
    >
        <div
            className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: color, color: 'white' }}
        >
            <md-icon>{icon}</md-icon>
        </div>
        <div>
            <p className="text-lg font-semibold text-[var(--theme-text)]">{title}</p>
        </div>
    </motion.div>
);

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
    const navigate = useNavigate();
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
                setIsScannerModalOpen(false);
                setIsNewScanModalOpen(false);
                setIsCategorySelectionOpen(false);
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <InfoCard icon="list_alt" title="View Entries" color="#4285F4" onClick={() => navigate('/entries')} />
                            <InfoCard icon="category" title="View Categories" color="#DB4437" onClick={() => navigate('/categories')} />
                            <InfoCard icon="calendar_month" title="View Dates" color="#0F9D58" onClick={() => navigate('/dates')} />
                            <InfoCard icon="calendar_today" title="Today's Report" color="#F4B400" onClick={() => navigate(`/dates/${today}`, { state: { from: '/' } })} />
                            <InfoCard icon="qr_code_scanner" title="Open Scanner" color="var(--theme-primary)" onClick={openScannerModal} />
                            <InfoCard icon="add_circle" title="Add a Scan" color="var(--theme-primary)" onClick={openNewScanModal} />
                        </div>
                    </div>
                    <div className="mt-6 h-10"></div>
                </div>
            </main>

            {createPortal(
                <AnimatePresence>
                    {isScannerModalOpen && contentBoxBounds && (
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsScannerModalOpen(false)}
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
                                <ScannerPage
                                    statusMessage={statusMessage}
                                    setStatusMessage={setStatusMessage}
                                    onClose={() => setIsScannerModalOpen(false)}
                                    onCategorySelect={() => openCategorySelectionModal('ScannerPage')}
                                    allCategories={allCategories}
                                    selectedCategory={selectedCategory}
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
                                        if (categorySelectionSource === 'ScannerPage') {
                                            setIsScannerModalOpen(true);
                                        } else if (categorySelectionSource === 'NewScanPage') {
                                            setIsNewScanModalOpen(true);
                                        }
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
                                    onCategorySelect={() => openCategorySelectionModal('NewScanPage')}
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
        </>
    );
};

export default HomePage;
