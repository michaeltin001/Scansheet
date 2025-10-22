import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";

const StatusMessage = ({ message, onDismiss }) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef(null);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (message && !isHovered) {
      timeoutRef.current = setTimeout(() => {
        onDismissRef.current();
      }, 5000);
    }
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [message, isHovered]);

  useEffect(() => {
    return () => {
      onDismissRef.current();
    };
  }, []);

  return (
    <div 
      className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pt-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="bg-[var(--theme-primary)] text-white font-semibold py-3 px-6 rounded-xl shadow-lg flex items-center gap-4">
              <span>{message}</span>
              <md-icon-button onClick={onDismiss}>
                <md-icon>close</md-icon>
              </md-icon-button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatusMessage;
