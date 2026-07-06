import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

const ModalWrapper = ({ isOpen, onClose, contentBoxBounds, children }) => {
  return createPortal(
    <AnimatePresence>
      {isOpen && contentBoxBounds && (
        <motion.div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            style={{
              position: 'fixed',
              top: contentBoxBounds.top + (contentBoxBounds.height * 0.15),
              left: contentBoxBounds.left + (contentBoxBounds.width * 0.15),
              width: contentBoxBounds.width * 0.7,
              height: contentBoxBounds.height * 0.7,
            }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
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

export default ModalWrapper;
