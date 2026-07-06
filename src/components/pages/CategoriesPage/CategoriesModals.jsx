import React from 'react';
import ModalWrapper from '../../ui/ModalWrapper';
import NewCategoryPage from '../../modals/category/NewCategoryPage';
import DeleteCategoryPage from '../../modals/category/DeleteCategoryPage';
import EditCategoryPage from '../../modals/category/EditCategoryPage';
import DeletePage from '../../modals/common/DeletePage';
import ExportToCSVPage from '../../modals/common/ExportToCSVPage';
import ExportToPDFPage from '../../modals/common/ExportToPDFPage';

const CategoriesModals = ({
    statusMessage,
    setStatusMessage,
    contentBoxBounds,
    modalStates,
    modalHandlers,
    categoriesToDelete,
    categoryToEdit,
}) => {
    return (
        <>
            <ModalWrapper isOpen={modalStates.isNewCategoryModalOpen} onClose={modalHandlers.closeNewCategoryModal} contentBoxBounds={contentBoxBounds}>
                <NewCategoryPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeNewCategoryModal}
                    onSuccess={modalHandlers.handleNewCategorySuccess}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isDeleteCategoryModalOpen} onClose={modalHandlers.closeDeleteCategoryModal} contentBoxBounds={contentBoxBounds}>
                <DeleteCategoryPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeDeleteCategoryModal}
                    categories={categoriesToDelete}
                    onSuccess={modalHandlers.handleDeleteSuccess}
                />
            </ModalWrapper>

             <ModalWrapper isOpen={modalStates.isEditModalOpen} onClose={modalHandlers.closeEditModal} contentBoxBounds={contentBoxBounds}>
                <EditCategoryPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeEditModal}
                    category={categoryToEdit}
                    onUpdate={modalHandlers.handleEditSuccess}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isDeleteOptionsModalOpen} onClose={modalHandlers.closeDeleteOptionsModal} contentBoxBounds={contentBoxBounds}>
                <DeletePage
                    title="Delete Categories"
                    onClose={modalHandlers.closeDeleteOptionsModal}
                    onDeleteCurrent={modalHandlers.handleDeleteCurrentPage}
                    onDeleteSelected={modalHandlers.handleDeleteAllSelected}
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

export default CategoriesModals;
