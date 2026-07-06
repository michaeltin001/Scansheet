import React from 'react';
import { motion } from 'framer-motion';
import "@material/web/icon/icon.js";

const HomeInfoCard = ({ icon, title, color, onClick }) => (
    <motion.div
        whileHover={{ boxShadow: `inset 0 0 0 2px ${color}` }}
        onClick={onClick}
        className="bg-[var(--theme-surface-solid)] p-6 rounded-xl border border-[var(--theme-outline)] flex items-center gap-4 cursor-pointer"
    >
        <div
            className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: color, color: 'white' }}
        >
            <md-icon>{icon}</md-icon>
        </div>
        <div>
            <p className="text-lg font-semibold text-[var(--theme-text)]">{title}</p>
        </div>
    </motion.div>
);

export default HomeInfoCard;
