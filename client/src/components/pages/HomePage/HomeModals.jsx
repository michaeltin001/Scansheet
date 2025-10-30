import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ModalWrapper from '../../ui/ModalWrapper';
import ScannerPage from '../../modals/scan/ScannerPage';
import NewScanPage from '../../modals/scan/NewScanPage';
import CategorySelectionPage from '../../modals/filter/CategorySelectionPage';

const HomeModals = ({
    statusMessage,
    setStatusMessage,
    isScannerModalOpen,
    closeScannerModal,
    isNewScanModalOpen,
    closeNewScanModal,
    isCategorySelectionOpen,
    closeCategorySelectionModal,
    categorySelectionSource,
    allCategories,
    selectedCategory,
    setSelectedCategory,
    contentBoxBounds,
    openCategorySelectionModal,
    handleNewScanSuccess,
    openPreviousScannerModal,
    openPreviousNewScanModal
}) => {
    return createPortal(
        <>
            <ModalWrapper isOpen={isScannerModalOpen} onClose={closeScannerModal} contentBoxBounds={contentBoxBounds}>
                <ScannerPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={closeScannerModal}
                    onCategorySelect={() => openCategorySelectionModal('ScannerPage')}
                    allCategories={allCategories}
                    selectedCategory={selectedCategory}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={isCategorySelectionOpen} onClose={closeCategorySelectionModal} contentBoxBounds={contentBoxBounds}>
                <CategorySelectionPage
                    allCategories={allCategories}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    onClose={closeCategorySelectionModal}
                    onBack={() => {
                        closeCategorySelectionModal();
                        if (categorySelectionSource === 'ScannerPage') {
                            openPreviousScannerModal();
                        } else if (categorySelectionSource === 'NewScanPage') {
                            openPreviousNewScanModal();
                        }
                    }}
                    showBackButton={true}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={isNewScanModalOpen} onClose={closeNewScanModal} contentBoxBounds={contentBoxBounds}>
                <NewScanPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={closeNewScanModal}
                    onSuccess={handleNewScanSuccess}
                    onCategorySelect={() => openCategorySelectionModal('NewScanPage')}
                    allCategories={allCategories}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                />
            </ModalWrapper>
        </>,
        document.getElementById('portal-root')
    );
};

export default HomeModals;
