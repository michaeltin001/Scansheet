import React from 'react';
import DateItem from './DateItem';

const DatesList = ({
    allDates,
    selectedDates,
    onToggleSelect,
    onDeleteClick,
    formatDate,
    totalDates
}) => {
    return (
        <div className="flex flex-col gap-4">
            {allDates.map((dateString) => {
                const isSelected = selectedDates.has(dateString);
                return (
                    <DateItem
                        key={dateString}
                        dateString={dateString}
                        isSelected={isSelected}
                        onToggleSelect={onToggleSelect}
                        onDeleteClick={onDeleteClick}
                        formatDate={formatDate}
                    />
                );
            })}
            {totalDates === 0 && (
                <p className="text-center p-8 text-[var(--theme-text)] opacity-70">No dates found.</p>
            )}
        </div>
    );
};

export default DatesList;
