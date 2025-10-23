import React from 'react';
import EntryItem from './EntryItem';

const EntriesList = ({
    allEntries,
    selectedEntries,
    onToggleSelect,
    onEditClick,
    onCopyClick,
    onQRCodeClick,
    onDeleteClick,
    totalEntries
}) => {
    return (
        <div className="flex flex-col gap-4">
            {allEntries.map((entry) => {
                const isSelected = selectedEntries.has(entry.code);
                return (
                    <EntryItem
                        key={entry.code}
                        entry={entry}
                        isSelected={isSelected}
                        onToggleSelect={onToggleSelect}
                        onEditClick={onEditClick}
                        onCopyClick={onCopyClick}
                        onQRCodeClick={onQRCodeClick}
                        onDeleteClick={onDeleteClick}
                    />
                );
            })}
            {totalEntries === 0 && (
                <p className="text-center p-8 text-[var(--theme-text)] opacity-70">No entries found.</p>
            )}
        </div>
    );
};

export default EntriesList;
