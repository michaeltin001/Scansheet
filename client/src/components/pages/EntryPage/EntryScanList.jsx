import React from 'react';
import EntryScanItem from './EntryScanItem';

const EntryScanList = ({
    scans,
    entryName,
    formatDate,
    formatTime24Hour,
    onEditClick,
    onDeleteClick,
    totalScans
}) => {
    return (
        <div className="flex flex-col gap-4">
            {scans.map((scan) => (
                <EntryScanItem
                    key={scan.date}
                    scan={scan}
                    entryName={entryName}
                    formatDate={formatDate}
                    formatTime24Hour={formatTime24Hour}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick}
                />
            ))}
            {totalScans === 0 && (
                <p className="text-center p-8 text-[var(--theme-text)] opacity-70">No scan history available.</p>
            )}
        </div>
    );
};

export default EntryScanList;
