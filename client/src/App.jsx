import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from "./components/layout/Sidebar";
import HomePage from "./components/pages/HomePage";
import EntriesPage from "./components/pages/EntriesPage";
import CategoriesPage from "./components/pages/CategoriesPage";
import DatesPage from "./components/pages/DatesPage";
import EntryPage from "./components/pages/EntryPage";
import TestPage from './components/legacy/TestPage';
import DatePage from "./components/pages/DatePage";
import SettingsPage from "./components/pages/SettingsPage";
import { ThemeProvider, ThemeContext } from './context/ThemeContext';

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.2 }}
    className="flex-1 flex flex-col overflow-hidden"
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = ({ statusMessage, setStatusMessage }) => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><HomePage setStatusMessage={setStatusMessage} statusMessage={statusMessage} /></PageWrapper>} />
                <Route path="/entries" element={<PageWrapper><EntriesPage setStatusMessage={setStatusMessage} statusMessage={statusMessage} /></PageWrapper>} />
                <Route path="/entries/:code" element={<PageWrapper><EntryPage setStatusMessage={setStatusMessage} statusMessage={statusMessage} /></PageWrapper>} />
                <Route path="/categories" element={<PageWrapper><CategoriesPage setStatusMessage={setStatusMessage} statusMessage={statusMessage} /></PageWrapper>} />
                <Route path="/dates" element={<PageWrapper><DatesPage setStatusMessage={setStatusMessage} statusMessage={statusMessage} /></PageWrapper>} />
                <Route path="/dates/:date" element={<PageWrapper><DatePage setStatusMessage={setStatusMessage} statusMessage={statusMessage} /></PageWrapper>} />
                <Route path="/test" element={<PageWrapper><TestPage /></PageWrapper>} />
                <Route path="/settings" element={<PageWrapper><SettingsPage setStatusMessage={setStatusMessage} statusMessage={statusMessage} /></PageWrapper>} />
            </Routes>
        </AnimatePresence>
    );
}

const AppContent = () => {
    const { statusMessage, setStatusMessage } = useContext(ThemeContext);

    return (
        <div
            className="flex h-screen text-[var(--theme-text)] bg-[var(--theme-bg)]"
        >
            <Sidebar />
            <AnimatedRoutes statusMessage={statusMessage} setStatusMessage={setStatusMessage} />
        </div>
    );
}

const App = () => {
  return (
    <Router>
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    </Router>
  );
}

export default App;
