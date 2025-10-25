import React from 'react';
import ModalWrapper from '../../ui/ModalWrapper';
import CategoryFilterPage from '../../modals/filter/CategoryFilterPage';
import DeleteScanPage from '../../modals/scan/DeleteScanPage';
import NewScanPage from '../../modals/scan/NewScanPage';
import EditScanPage from '../../modals/scan/EditScanPage';
import ExportOptionsPage from '../../modals/common/ExportOptionsPage';
import CategorySelectionPage from '../../modals/filter/CategorySelectionPage';

const DateModals = ({
    statusMessage,
    setStatusMessage,
    contentBoxBounds,
    modalStates,
    modalHandlers,
    scanToDelete,
    scanToEdit,
    allCategories,
    selectedCategories,
    selectedCategory,
    date,
}) => {
    return (
        <>
            <ModalWrapper isOpen={modalStates.isCategoryFilterModalOpen} onClose={modalHandlers.closeCategoryFilterModal} contentBoxBounds={contentBoxBounds}>
                <CategoryFilterPage
                    onClose={modalHandlers.closeCategoryFilterModal}
                    allCategories={allCategories}
                    selectedCategories={selectedCategories}
                    setSelectedCategories={modalHandlers.setSelectedCategories}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isDeleteScanModalOpen} onClose={modalHandlers.closeDeleteScanModal} contentBoxBounds={contentBoxBounds}>
                <DeleteScanPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeDeleteScanModal}
                    scanTimestamp={scanToDelete}
                    onSuccess={modalHandlers.handleDeleteScanSuccess}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isNewScanModalOpen} onClose={modalHandlers.closeNewScanModal} contentBoxBounds={contentBoxBounds}>
                <NewScanPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeNewScanModal}
                    onSuccess={modalHandlers.handleNewScanSuccess}
                    mode="date"
                    prefilledDate={date}
                    onCategorySelect={modalHandlers.openCategorySelectionModal}
                    allCategories={allCategories}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={modalHandlers.setSelectedCategory}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isCategorySelectionOpen} onClose={modalHandlers.closeCategorySelectionModal} contentBoxBounds={contentBoxBounds}>
                <CategorySelectionPage
                    allCategories={allCategories}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={modalHandlers.setSelectedCategory}
                    onClose={modalHandlers.closeCategorySelectionModal}
                    onBack={() => {
                        modalHandlers.closeCategorySelectionModal();
                        modalHandlers.openNewScanModal();
                    }}
                    showBackButton={true}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isEditScanModalOpen} onClose={modalHandlers.closeEditScanModal} contentBoxBounds={contentBoxBounds}>
                <EditScanPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeEditScanModal}
                    scan={scanToEdit}
                    onUpdate={modalHandlers.handleEditScanSuccess}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isExportModalOpen} onClose={modalHandlers.closeExportModal} contentBoxBounds={contentBoxBounds}>
                <ExportOptionsPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeExportModal}
                    onExport={modalHandlers.handleExport}
                    title={modalHandlers.exportTitle}
                />
            </ModalWrapper>
        </>
    );
};

export default DateModals;
