import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useOverflow } from '../../hooks/useOverflow';

const EntryInfoPage = ({entry}) => {
    const [selectedCard, setSelectedCard] = useState(null);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'All'];

    const scrollContainerRef = useRef(null);
    const isOverflowing = useOverflow(scrollContainerRef);

    const handleCardClick = (day) => {
        if (selectedCard === day) {
            setSelectedCard(null);
        } else {
            setSelectedCard(day);
        }
    };

    const scans = entry && entry.scans ? JSON.parse(entry.scans) : [];

    return (
        <>
            <div className="flex w-full justify-between gap-4">
                {days.map((day) => (
                    <motion.div
                        key={day}
                        onClick={() => handleCardClick(day)}
                        className={`flex-1 p-4 rounded-xl border border-[var(--theme-outline)] backdrop-blur-lg flex flex-col items-center justify-center cursor-pointer ${
                            selectedCard === day
                                ? 'bg-[var(--theme-primary)] text-white shadow-lg'
                                : 'bg-[var(--theme-card-bg)] text-[var(--theme-text)]'
                        }`}
                        whileHover={{ boxShadow: "inset 0 0 0 1px var(--theme-primary)" }}
                        animate={{
                            scale: selectedCard === day ? 1.05 : 1,
                            transition: { duration: 0.3 }
                        }}
                    >
                        <p className="font-bold">{day}</p>
                    </motion.div>
                ))}
            </div>
            
            <div className="flex flex-col flex-1 gap-4 pt-0 pb-4 overflow-hidden mt-6">
                <div className={`flex-1 flex flex-col min-h-0 ${isOverflowing ? 'shadow-[inset_0_10px_10px_-10px_rgba(0,0,0,0.2)]' : ''}`}>
                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
                        <div className="flex flex-col gap-4">
                            {scans.map((scanTimestamp, index) => {
                                const date = new Date(scanTimestamp);
                                const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                                const timeOptions = { hour: 'numeric', minute: 'numeric', second: 'numeric' };

                                return (
                                    <motion.div
                                        key={index}
                                        className="border border-[var(--theme-outline)] rounded-lg p-4"
                                    >
                                        <p className="font-semibold">{date.toLocaleDateString(undefined, dateOptions)}</p>
                                        <p className="opacity-70 text-sm">{date.toLocaleTimeString(undefined, timeOptions)}</p>
                                    </motion.div>
                                );
                            })}
                            {scans.length === 0 && (
                                <p className="text-center p-8 text-[var(--theme-text)] opacity-70">No scan history available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EntryInfoPage;
