import React from 'react';
import { useNavigate } from 'react-router-dom';
import HomeInfoCard from './HomeInfoCard';

const HomeInfoCardGrid = ({ openScannerModal, openNewScanModal, today }) => {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <HomeInfoCard icon="list_alt" title="View Entries" color="#4285F4" onClick={() => navigate('/entries')} />
            <HomeInfoCard icon="category" title="View Categories" color="#DB4437" onClick={() => navigate('/categories')} />
            <HomeInfoCard icon="calendar_month" title="View Dates" color="#0F9D58" onClick={() => navigate('/dates')} />
            <HomeInfoCard icon="calendar_today" title="Today's Report" color="#F4B400" onClick={() => navigate(`/dates/${today}`, { state: { from: '/' } })} />
            <HomeInfoCard icon="qr_code_scanner" title="Open Scanner" color="var(--theme-primary)" onClick={openScannerModal} />
            <HomeInfoCard icon="add_circle" title="Add a Scan" color="var(--theme-primary)" onClick={openNewScanModal} />
        </div>
    );
};

export default HomeInfoCardGrid;
