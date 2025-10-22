import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import StatusMessage from '../ui/StatusMessage';
import { useOverflow } from '../../hooks/useOverflow';
import { ThemeContext } from '../../context/ThemeContext';
import "@material/web/icon/icon.js";
import "@material/web/button/filled-button.js";

const SettingsPage = ({ statusMessage, setStatusMessage }) => {
    const { themeSetting, setThemeSetting } = useContext(ThemeContext);
    const [isThemeOpen, setIsThemeOpen] = useState(false);
    
    const contentBoxRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const { isOverflowingTop, isOverflowingBottom } = useOverflow(scrollContainerRef);

    const handleThemeChange = (e) => {
        setThemeSetting(e.target.value);
    };

    const handleGitHubClick = () => {
        window.open('https://www.google.com', '_blank', 'noopener,noreferrer');
    };

    let shadowClass = '';
    if (isOverflowingTop && isOverflowingBottom) {
        shadowClass = 'scroll-shadow-both';
    } else if (isOverflowingTop) {
        shadowClass = 'scroll-shadow-top';
    } else if (isOverflowingBottom) {
        shadowClass = 'scroll-shadow-bottom';
    }

    return (
        <>
            <main className="container mx-auto p-6 flex-1 flex flex-col min-h-0">
                <div
                    ref={contentBoxRef}
                    className="content-box-fix relative bg-[var(--theme-card-bg)] p-6 rounded-xl border border-[var(--theme-outline)] backdrop-blur-lg flex-1 flex flex-col overflow-hidden"
                >
                    <StatusMessage message={statusMessage} onDismiss={() => setStatusMessage("")} />
                    <div className="relative flex justify-center items-center mb-6">
                        <h1 className="text-3xl font-bold text-[var(--theme-text)]">Settings</h1>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        className={`flex-1 overflow-y-auto ${shadowClass}`}
                    >
                        <div className="flex flex-col gap-4">
                            <motion.div
                                whileHover={{ boxShadow: "inset 0 0 0 2px var(--theme-primary)" }}
                                className="border rounded-lg p-4 flex justify-between items-center transition-colors border-[var(--theme-outline)]"
                            >
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="font-semibold text-lg">Theme</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 items-center">
                                    <div className="relative">
                                        <select
                                            value={themeSetting}
                                            onChange={handleThemeChange}
                                            onClick={() => setIsThemeOpen(!isThemeOpen)}
                                            onBlur={() => setIsThemeOpen(false)}
                                            className="appearance-none p-2 pl-3 pr-8 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                                        >
                                            <option value="system">System</option>
                                            <option value="light">Light</option>
                                            <option value="dark">Dark</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                                            <md-icon>{isThemeOpen ? 'unfold_less' : 'unfold_more'}</md-icon>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                            <motion.div
                                whileHover={{ boxShadow: "inset 0 0 0 2px var(--theme-primary)" }}
                                className="border rounded-lg p-4 flex justify-between items-center transition-colors border-[var(--theme-outline)]"
                            >
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="font-semibold text-lg">View Documentation</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 items-center">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <md-filled-button onClick={handleGitHubClick}>
                                            View on GitHub
                                        </md-filled-button>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                    <div className="mt-6 h-10"></div>
                </div>
            </main>
        </>
    );
};

export default SettingsPage;
