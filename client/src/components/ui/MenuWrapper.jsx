import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/icon/icon.js";

const MenuWrapper = ({ isOpen, onClose, iconPosition, menuPosition, icon, children }) => {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute"
            style={{ top: `${iconPosition.top}px`, left: `${iconPosition.left}px` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <md-outlined-icon-button onClick={onClose}>
              <md-icon>{icon}</md-icon>
            </md-outlined-icon-button>
          </motion.div>
          <motion.div
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            className="absolute w-56 bg-[var(--theme-card-bg)] border border-[var(--theme-outline)] rounded-md shadow-lg z-50"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.getElementById('portal-root')
  );
};

export default MenuWrapper;
