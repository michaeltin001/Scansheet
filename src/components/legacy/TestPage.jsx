import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';

const TestPage = () => {
    const { themeSetting, setThemeSetting } = useContext(ThemeContext);

    const handleThemeChange = (e) => {
        setThemeSetting(e.target.value);
    };

    return (
        <main className="container mx-auto p-6 flex-1 flex flex-col min-h-0">
            <div className="relative bg-[var(--theme-card-bg)] p-6 rounded-xl border border-[var(--theme-outline)] backdrop-blur-lg flex-1 flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold text-[var(--theme-text)] mb-4">Theme Test Page</h1>
                <p className="text-lg text-[var(--theme-text)] opacity-75 mb-8">
                    Select theme mode. Current setting: <strong>{themeSetting}</strong>
                </p>

                <select
                    value={themeSetting}
                    onChange={handleThemeChange}
                    className="p-3 rounded-lg border border-[var(--theme-outline)] bg-[var(--theme-surface-solid)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] w-48 text-center"
                >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                </select>
            </div>
        </main>
    );
};

export default TestPage;
