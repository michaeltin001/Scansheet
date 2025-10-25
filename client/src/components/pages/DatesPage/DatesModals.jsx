import React from 'react';
import ModalWrapper from '../../ui/ModalWrapper';
import DayFilterPage from '../../modals/filter/DayFilterPage';
import DeletePage from '../../modals/common/DeletePage';
import DeleteDatePage from '../../modals/date/DeleteDatePage';
import NewScanPage from '../../modals/scan/NewScanPage';
import CategorySelectionPage from '../../modals/filter/CategorySelectionPage';
import ExportToCSVPage from '../../modals/common/ExportToCSVPage';
import ExportToPDFPage from '../../modals/common/ExportToPDFPage';

const DatesModals = ({
    statusMessage,
    setStatusMessage,
    contentBoxBounds,
    modalStates,
    modalHandlers,
    selectedDays,
    datesToDelete,
    allCategories,
    selectedCategory,
}) => {
    return (
        <>
            <ModalWrapper isOpen={modalStates.isDayFilterModalOpen} onClose={modalHandlers.closeDayFilterModal} contentBoxBounds={contentBoxBounds}>
                <DayFilterPage
                    onClose={modalHandlers.closeDayFilterModal}
                    selectedDays={selectedDays}
                    setSelectedDays={modalHandlers.setSelectedDays}
                    onBack={modalHandlers.closeDayFilterModal}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isDeleteOptionsModalOpen} onClose={modalHandlers.closeDeleteOptionsModal} contentBoxBounds={contentBoxBounds}>
                <DeletePage
                    title="Delete Scans by Date"
                    onClose={modalHandlers.closeDeleteOptionsModal}
                    onDeleteCurrent={modalHandlers.handleDeleteCurrentPage}
                    onDeleteSelected={modalHandlers.handleDeleteAllSelected}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isDeleteDateModalOpen} onClose={modalHandlers.closeDeleteDateModal} contentBoxBounds={contentBoxBounds}>
                <DeleteDatePage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeDeleteDateModal}
                    dates={datesToDelete}
                    onSuccess={modalHandlers.handleDeleteSuccess}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isNewScanModalOpen} onClose={modalHandlers.closeNewScanModal} contentBoxBounds={contentBoxBounds}>
                <NewScanPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeNewScanModal}
                    onSuccess={modalHandlers.handleNewScanSuccess}
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

            <ModalWrapper isOpen={modalStates.isExportCSVModalOpen} onClose={modalHandlers.closeExportCSVModal} contentBoxBounds={contentBoxBounds}>
                <ExportToCSVPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeExportCSVModal}
                    onExportCurrent={modalHandlers.handleExportCSVCurrentPage}
                    onExportSelected={modalHandlers.handleExportCSVAllSelected}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isExportPDFModalOpen} onClose={modalHandlers.closeExportPDFModal} contentBoxBounds={contentBoxBounds}>
                <ExportToPDFPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeExportPDFModal}
                    onExportCurrent={modalHandlers.handleExportPDFCurrentPage}
                    onExportSelected={modalHandlers.handleExportPDFAllSelected}
                />
            </ModalWrapper>
        </>
    );
};

export default DatesModals;
