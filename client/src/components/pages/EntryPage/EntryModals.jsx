import React from 'react';
import ModalWrapper from '../../ui/ModalWrapper';
import EditEntryPage from '../../modals/entry/EditEntryPage';
import EditScanPage from '../../modals/scan/EditScanPage';
import DeleteEntryPage from '../../modals/entry/DeleteEntryPage';
import DeleteScanPage from '../../modals/scan/DeleteScanPage';
import EntryQRCodePage from '../../modals/entry/EntryQRCodePage';
import DayFilterPage from '../../modals/filter/DayFilterPage';
import CategoryFilterPage from '../../modals/filter/CategoryFilterPage';
import NewScanPage from '../../modals/scan/NewScanPage';
import FilterPage from '../../modals/filter/FilterPage';
import CategorySelectionPage from '../../modals/filter/CategorySelectionPage';

const EntryModals = ({
    statusMessage,
    setStatusMessage,
    contentBoxBounds,
    modalStates,
    modalHandlers,
    entry,
    scanToDelete,
    scanToEdit,
    selectedDays,
    allCategories,
    selectedCategories,
    selectedCategory,
    code,
}) => {
    return (
        <>
            <ModalWrapper isOpen={modalStates.isEditEntryModalOpen} onClose={modalHandlers.closeEditEntryModal} contentBoxBounds={contentBoxBounds}>
                <EditEntryPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeEditEntryModal}
                    entry={entry}
                    onUpdate={modalHandlers.handleEditSuccess}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isDeleteEntryModalOpen} onClose={modalHandlers.closeDeleteEntryModal} contentBoxBounds={contentBoxBounds}>
                <DeleteEntryPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeDeleteEntryModal}
                    entries={[entry]}
                    onSuccess={modalHandlers.handleDeleteSuccess}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isQRCodeModalOpen} onClose={modalHandlers.closeQRCodeModal} contentBoxBounds={contentBoxBounds}>
                <EntryQRCodePage
                    onClose={modalHandlers.closeQRCodeModal}
                    entry={entry}
                    onQRCodeUpdate={modalHandlers.handleQRCodeUpdate}
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
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
                    mode="entry"
                    entryCode={code}
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

            <ModalWrapper isOpen={modalStates.isDayFilterModalOpen} onClose={modalHandlers.closeDayFilterModal} contentBoxBounds={contentBoxBounds}>
                <DayFilterPage
                    onClose={modalHandlers.closeDayFilterModal}
                    selectedDays={selectedDays}
                    setSelectedDays={modalHandlers.setSelectedDays}
                    showBackButton={true}
                    onBack={() => {
                        modalHandlers.closeDayFilterModal();
                        modalHandlers.openFilterModal();
                    }}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isCategoryFilterModalOpen} onClose={modalHandlers.closeCategoryFilterModal} contentBoxBounds={contentBoxBounds}>
                <CategoryFilterPage
                    onClose={modalHandlers.closeCategoryFilterModal}
                    allCategories={allCategories}
                    selectedCategories={selectedCategories}
                    setSelectedCategories={modalHandlers.setSelectedCategories}
                    showBackButton={true}
                    onBack={() => {
                        modalHandlers.closeCategoryFilterModal();
                        modalHandlers.openFilterModal();
                    }}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isFilterModalOpen} onClose={modalHandlers.closeFilterModal} contentBoxBounds={contentBoxBounds}>
                <FilterPage
                    onClose={modalHandlers.closeFilterModal}
                    onDayFilter={() => {
                        modalHandlers.closeFilterModal();
                        modalHandlers.openDayFilterModal();
                    }}
                    onCategoryFilter={() => {
                        modalHandlers.closeFilterModal();
                        modalHandlers.openCategoryFilterModal();
                    }}
                />
            </ModalWrapper>
        </>
    );
};

export default EntryModals;
