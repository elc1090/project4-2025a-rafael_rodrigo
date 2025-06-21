import React, { useState, useEffect } from 'react';
import './Toast.css';

function Toast({ message, type = 'success', duration = 3000, onClose }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
                onClose && onClose();
            }, 300); // Aguarda animação de saída
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!message) return null;

    return (
        <div className={`toast toast-${type} ${isVisible ? 'toast-enter' : 'toast-exit'}`}>
            <div className="toast-content">
                <div className="toast-icon">
                    {type === 'success' && '✅'}
                    {type === 'error' && '❌'}
                    {type === 'info' && 'ℹ️'}
                    {type === 'warning' && '⚠️'}
                </div>
                <div className="toast-message">
                    {message}
                </div>
                <button 
                    className="toast-close"
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(() => onClose && onClose(), 300);
                    }}
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

export default Toast;