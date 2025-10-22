import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOverflow } from '../../../hooks/useOverflow';
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";

const CategorySelectionPage = ({ onBack, onClose, allCategories, selectedCategory, setSelectedCategory, showBackButton = false }) => {
    const clearSelectionButtonRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const { isOverflowingTop, isOverflowingBottom } = useOverflow(scrollContainerRef);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);
    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);
    const clearSearchButtonRef = useRef(null);

    useEffect(() => {
        if (clearSearchButtonRef.current) {
            clearSearchButtonRef.current.disabled = searchQuery === "";
        }
    }, [searchQuery]);

    const handleToggleSelect = (categoryCode) => {
        setSelectedCategory(categoryCode);
    };

    const handleReset = () => {
        const generalCategory = allCategories.find(c => c.name === 'General');
        if (generalCategory) {
            setSelectedCategory(generalCategory.code);
        }
    };

    let shadowClass = '';
    if (isOverflowingTop && isOverflowingBottom) {
        shadowClass = 'scroll-shadow-both';
    } else if (isOverflowingTop) {
        shadowClass = 'scroll-shadow-top';
    } else if (isOverflowingBottom) {
        shadowClass = 'scroll-shadow-bottom';
    }

    const filteredCategories = allCategories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <motion.div>
                        <md-outlined-icon-button ref={clearSelectionButtonRef} onClick={handleReset}>
                            <md-icon>history</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                </div>
                <h1 className="text-3xl font-bold text-[var(--theme-text)] text-center">Select a Category</h1>
                <div className="absolute right-0 flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        {isSearchActive ? (
                            <md-filled-icon-button onClick={() => {
                                setSearchQuery("");
                                setIsSearchActive(false);
                            }}>
                                <md-icon>search</md-icon>
                            </md-filled-icon-button>
                        ) : (
                            <md-outlined-icon-button onClick={() => setIsSearchActive(true)}>
                                <md-icon>search</md-icon>
                            </md-outlined-icon-button>
                        )}
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <md-outlined-icon-button onClick={onClose}>
                            <md-icon>close</md-icon>
                        </md-outlined-icon-button>
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isSearchActive && (
                    <motion.div
                        ref={searchContainerRef}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ transformOrigin: 'top' }}
                        className="mb-6 p-4 border border-[var(--theme-outline)] rounded-xl bg-[var(--theme-card-bg)] shadow-[0_10px_15px_-3px_var(--theme-shadow-color)]"
                    >
                        <div className="relative flex items-center">
                            <input
                                ref={searchInputRef}
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                }}
                                className="w-full py-[7px] pl-4 pr-12 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute right-0 z-10 flex items-center pr-2"
                            >
                                <md-icon-button
                                    ref={clearSearchButtonRef}
                                    onClick={() => {
                                        setSearchQuery("");
                                        if (searchInputRef.current) {
                                            searchInputRef.current.value = "";
                                        }
                                    }}
                                    disabled={!searchQuery}
                                >
                                    <md-icon>close</md-icon>
                                </md-icon-button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                ref={scrollContainerRef}
                className={`flex-1 overflow-y-auto ${shadowClass}`}
            >
                <div className="flex flex-col gap-4">
                    {filteredCategories.map((category) => {
                        const isSelected = selectedCategory === category.code;
                        return (
                            <motion.div
                                key={category.code}
                                whileHover={{ boxShadow: "inset 0 0 0 2px var(--theme-primary)" }}
                                className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer transition-colors ${
                                    isSelected
                                        ? 'bg-[var(--theme-highlight)] border-[var(--theme-primary)]'
                                        : 'border-[var(--theme-outline)]'
                                }`}
                                onClick={() => handleToggleSelect(category.code)}
                            >
                                <div className="flex items-center gap-4">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <md-icon-button onClick={() => handleToggleSelect(category.code)}>
                                            <md-icon>{isSelected ? 'check_box' : 'check_box_outline_blank'}</md-icon>
                                        </md-icon-button>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg">{category.name}</p>
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

export default CategorySelectionPage;
