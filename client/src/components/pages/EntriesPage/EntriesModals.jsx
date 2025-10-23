import React from 'react';
import ModalWrapper from '../../ui/ModalWrapper';
import NewEntryPage from '../../modals/entry/NewEntryPage';
import DeleteEntryPage from '../../modals/entry/DeleteEntryPage';
import EntryQRCodePage from '../../modals/entry/EntryQRCodePage';
import EditEntryPage from '../../modals/entry/EditEntryPage';
import DeletePage from '../../modals/common/DeletePage';
import ExportToCSVPage from '../../modals/common/ExportToCSVPage';
import ExportToPDFPage from '../../modals/common/ExportToPDFPage';
import PrintBadgesPage from '../../modals/common/PrintBadgesPage';

const EntriesModals = ({
    statusMessage,
    setStatusMessage,
    contentBoxBounds,
    modalStates,
    modalHandlers,
    entriesToDelete,
    entryForQRCode,
    entryToEdit,
}) => {
    return (
        <>
            <ModalWrapper isOpen={modalStates.isNewEntryModalOpen} onClose={modalHandlers.closeNewEntryModal} contentBoxBounds={contentBoxBounds}>
                <NewEntryPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeNewEntryModal}
                    onSuccess={modalHandlers.handleNewEntrySuccess}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isDeleteEntryModalOpen} onClose={modalHandlers.closeDeleteEntryModal} contentBoxBounds={contentBoxBounds}>
                <DeleteEntryPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeDeleteEntryModal}
                    entries={entriesToDelete}
                    onSuccess={modalHandlers.handleDeleteSuccess}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isQRCodeModalOpen} onClose={modalHandlers.closeQRCodeModal} contentBoxBounds={contentBoxBounds}>
                <EntryQRCodePage
                    onClose={modalHandlers.closeQRCodeModal}
                    entry={entryForQRCode}
                    onQRCodeUpdate={modalHandlers.handleQRCodeUpdate}
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isEditModalOpen} onClose={modalHandlers.closeEditModal} contentBoxBounds={contentBoxBounds}>
                <EditEntryPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closeEditModal}
                    entry={entryToEdit}
                    onUpdate={modalHandlers.handleEditSuccess}
                />
            </ModalWrapper>

            <ModalWrapper isOpen={modalStates.isDeleteOptionsModalOpen} onClose={modalHandlers.closeDeleteOptionsModal} contentBoxBounds={contentBoxBounds}>
                <DeletePage
                    title="Delete Entries"
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

            <ModalWrapper isOpen={modalStates.isPrintModalOpen} onClose={modalHandlers.closePrintModal} contentBoxBounds={contentBoxBounds}>
                <PrintBadgesPage
                    statusMessage={statusMessage}
                    setStatusMessage={setStatusMessage}
                    onClose={modalHandlers.closePrintModal}
                    onPrintCurrent={modalHandlers.handlePrintCurrentPage}
                    onPrintSelected={modalHandlers.handlePrintAllSelected}
                />
            </ModalWrapper>
        </>
    );
};

export default EntriesModals;
