import { useEffect } from 'react';

/**
 * Hook to handle ESC key press to close modals
 * @param onClose - Callback function to execute when ESC key is pressed
 */
export function useEscapeKey(onClose: () => void) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);
}
