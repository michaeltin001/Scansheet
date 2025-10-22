import React, { useState, useEffect, useCallback } from 'react';

export const useOverflow = (ref, content) => {
    const [overflowState, setOverflowState] = useState({
        isOverflowingTop: false,
        isOverflowingBottom: false,
    });

    const updateOverflowState = useCallback(() => {
        if (ref.current) {
            const { scrollHeight, clientHeight, scrollTop } = ref.current;
            const isTop = scrollTop > 0;
            const isBottom = scrollTop + clientHeight < scrollHeight - 1;

            setOverflowState({
                isOverflowingTop: isTop,
                isOverflowingBottom: isBottom,
            });
        }
    }, [ref]);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        updateOverflowState();

        const resizeObserver = new ResizeObserver(updateOverflowState);
        resizeObserver.observe(element);
        element.addEventListener('scroll', updateOverflowState);

        return () => {
            resizeObserver.disconnect();
            element.removeEventListener('scroll', updateOverflowState);
        };
    }, [ref, updateOverflowState, content]);

    return overflowState;
};
