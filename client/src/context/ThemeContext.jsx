import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeSetting, setThemeSetting] = useState(localStorage.getItem('themeSetting') || 'system');
  const [effectiveTheme, setEffectiveTheme] = useState('light');
  const [isSidebarOpen, setSidebarOpen] = useState(JSON.parse(localStorage.getItem('sidebarOpen')) !== false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    localStorage.setItem('themeSetting', themeSetting);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      const currentTheme = themeSetting === 'system' ? systemTheme : themeSetting;
      setEffectiveTheme(currentTheme);

      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();

    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [themeSetting]);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', isSidebarOpen);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const value = {
    themeSetting,
    setThemeSetting,
    effectiveTheme,
    isSidebarOpen,
    toggleSidebar,
    statusMessage,
    setStatusMessage,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
