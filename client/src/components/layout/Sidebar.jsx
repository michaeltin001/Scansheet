import React, { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
import "@material/web/icon/icon.js";

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isSidebarOpen, toggleSidebar } = useContext(ThemeContext);

    const getLinkClass = (path) => {
        const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
        return `flex items-center p-2 rounded-md hover:bg-[var(--theme-highlight)] cursor-pointer ${isSidebarOpen ? 'gap-2' : 'justify-center'} ${
            isActive ? 'bg-[var(--theme-highlight)]' : ''
        }`;
    };

    return (
        <div className={`bg-[var(--theme-card-bg)] backdrop-blur-lg transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col border-r border-[var(--theme-outline)]`}>
            <div className="p-4">
                <div
                    className={`flex items-center p-2 rounded-md hover:bg-[var(--theme-highlight)] cursor-pointer ${isSidebarOpen ? 'gap-2' : 'justify-center'}`}
                    onClick={toggleSidebar}
                >
                    <md-icon>menu</md-icon>
                    <span className={`text-[var(--theme-text)] text-lg font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Scansheet</span>
                </div>
            </div>
            <nav className="flex flex-col gap-4 p-4 flex-grow">
                <div className={getLinkClass('/')} onClick={() => navigate('/')}>
                    <md-icon>home</md-icon>
                    <span className={`text-[var(--theme-text)] whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Home</span>
                </div>
                <div className={getLinkClass('/entries')} onClick={() => navigate('/entries')}>
                    <md-icon>list_alt</md-icon>
                    <span className={`text-[var(--theme-text)] whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Entries</span>
                </div>
                <div className={getLinkClass('/categories')} onClick={() => navigate('/categories')}>
                    <md-icon>category</md-icon>
                    <span className={`text-[var(--theme-text)] whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Categories</span>
                </div>
                <div className={getLinkClass('/dates')} onClick={() => navigate('/dates')}>
                    <md-icon>calendar_month</md-icon>
                    <span className={`text-[var(--theme-text)] whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Dates</span>
                </div>
            </nav>
            <div className="p-4">
                <div className={getLinkClass('/settings')} onClick={() => navigate('/settings')}>
                    <md-icon>settings</md-icon>
                    <span className={`text-[var(--theme-text)] whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Settings</span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
