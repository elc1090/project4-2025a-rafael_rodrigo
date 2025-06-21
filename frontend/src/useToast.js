import { useState, useCallback } from 'react';

// Hook para gerenciar toasts
export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now() + Math.random();
        const newToast = {
            id,
            message,
            type,
            duration,
            timestamp: Date.now()
        };

        setToasts(prev => [...prev, newToast]);

        // Auto-remover após a duração
        setTimeout(() => {
            removeToast(id);
        }, duration + 300); // +300ms para animação

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const clearToasts = useCallback(() => {
        setToasts([]);
    }, []);

    // Métodos de conveniência
    const showSuccess = useCallback((message, duration) => 
        addToast(message, 'success', duration), [addToast]);
    
    const showError = useCallback((message, duration) => 
        addToast(message, 'error', duration), [addToast]);
    
    const showInfo = useCallback((message, duration) => 
        addToast(message, 'info', duration), [addToast]);
    
    const showWarning = useCallback((message, duration) => 
        addToast(message, 'warning', duration), [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        clearToasts,
        showSuccess,
        showError,
        showInfo,
        showWarning
    };
};

export default useToast;