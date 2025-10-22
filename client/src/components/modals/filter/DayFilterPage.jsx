import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useOverflow } from '../../../hooks/useOverflow';
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";

const DayFilterPage = ({ onBack, onClose, selectedDays, setSelectedDays, showBackButton = false }) => {
    const clearSelectionButtonRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const { isOverflowingTop, isOverflowingBottom } = useOverflow(scrollContainerRef);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        if (clearSelectionButtonRef.current) {
            clearSelectionButtonRef.current.disabled = selectedDays.size === days.length;
        }
    }, [selectedDays, days.length]);

    const getSelectAllIcon = () => {
        if (selectedDays.size === days.length) {
            return 'check_box';
        } else if (selectedDays.size > 0) {
            return 'indeterminate_check_box';
        } else {
            return 'check_box_outline_blank';
        }
    };

    const handleToggleSelect = (dayIndex) => {
        setSelectedDays(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(dayIndex)) {
                newSelected.delete(dayIndex);
            } else {
                newSelected.add(dayIndex);
            }
            return newSelected;
        });
    };

    const handleSelectAll = () => {
        if (selectedDays.size === days.length) {
            setSelectedDays(new Set());
        } else {
            setSelectedDays(new Set(days.map((_, index) => index)));
        }
    };

    const handleReset = () => {
        setSelectedDays(new Set(days.map((_, index) => index)));
    };

    const isAllDaysSelected = selectedDays.size === days.length;
    let shadowClass = '';
    if (isOverflowingTop && isOverflowingBottom) {
        shadowClass = 'scroll-shadow-both';
    } else if (isOverflowingTop) {
        shadowClass = 'scroll-shadow-top';
    } else if (isOverflowingBottom) {
        shadowClass = 'scroll-shadow-bottom';
    }

    return (
        <div
            className="relative bg-[var(--theme-card-bg)] p-6 rounded-xl border border-[var(--theme-outline)] backdrop-blur-lg h-full flex flex-col overflow-hidden"
        >
            <div className="relative flex justify-center items-center mb-6">
                <div className="absolute left-0 flex items-center gap-2">
                    {showBackButton && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <md-outlined-icon-button onClick={onBack}>
                                <md-icon>arrow_back</md-icon>
                            </md-outlined-icon-button>
                        </motion.div>
                    )}
                    <motion.div
                        whileHover={!isAllDaysSelected ? { scale: 1.05 } : {}}
                        whileTap={!isAllDaysSelected ? { scale: 0.95 } : {}}
                    >
                        <md-outlined-icon-button ref={clearSelectionButtonRef} onClick={handleReset}>
                            <md-icon>history</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <md-outlined-icon-button onClick={handleSelectAll}>
                            <md-icon>{getSelectAllIcon()}</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                </div>
                <h1 className="text-3xl font-bold text-[var(--theme-text)] text-center">Filter By Day</h1>
                <div className="absolute right-0">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <md-outlined-icon-button onClick={onClose}>
                            <md-icon>close</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className={`flex-1 overflow-y-auto ${shadowClass}`}
            >
                <div className="flex flex-col gap-4">
                    {days.map((day, index) => {
                        const isSelected = selectedDays.has(index);
                        return (
                            <motion.div
                                key={day}
                                whileHover={{ boxShadow: "inset 0 0 0 2px var(--theme-primary)" }}
                                className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer transition-colors ${
                                    isSelected
                                        ? 'bg-[var(--theme-highlight)] border-[var(--theme-primary)]'
                                        : 'border-[var(--theme-outline)]'
                                }`}
                                onClick={() => handleToggleSelect(index)}
                            >
                                <div className="flex items-center gap-4">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <md-icon-button onClick={() => handleToggleSelect(index)}>
                                            <md-icon>{isSelected ? 'check_box' : 'check_box_outline_blank'}</md-icon>
                                        </md-icon-button>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg">{day}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DayFilterPage;
