import React from 'react';
import Toast from './Toast';
import './ToastContainer.css';

function ToastContainer({ toasts, onRemoveToast }) {
    if (!toasts || toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => onRemoveToast(toast.id)}
                />
            ))}
        </div>
    );
}

export default ToastContainer;