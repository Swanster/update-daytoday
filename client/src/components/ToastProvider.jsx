import { createContext, useContext, useState, useCallback } from 'react';
// import './Toast.css'; // Removed custom CSS

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now() + Math.random();
        const toast = { id, message, type };

        setToasts(prev => [...prev, toast]);

        // Auto-remove after duration
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = useCallback((message) => addToast(message, 'success'), [addToast]);
    const error = useCallback((message) => addToast(message, 'error', 5000), [addToast]);
    const warning = useCallback((message) => addToast(message, 'warning', 4000), [addToast]);
    const info = useCallback((message) => addToast(message, 'info'), [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

function ToastContainer({ toasts, onRemove }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto min-w-[300px] max-w-sm bg-white rounded-xl shadow-lg border p-4 flex items-start gap-3 animate-slide-in transform transition-all duration-300
                        ${toast.type === 'success' ? 'border-l-4 border-l-green-500 border-gray-100' : ''}
                        ${toast.type === 'error' ? 'border-l-4 border-l-red-500 border-gray-100' : ''}
                        ${toast.type === 'warning' ? 'border-l-4 border-l-amber-500 border-gray-100' : ''}
                        ${toast.type === 'info' ? 'border-l-4 border-l-blue-500 border-gray-100' : ''}
                    `}
                    onClick={() => onRemove(toast.id)}
                >
                    <span className="text-lg flex-shrink-0 mt-0.5">
                        {toast.type === 'success' && '✅'}
                        {toast.type === 'error' && '❌'}
                        {toast.type === 'warning' && '⚠️'}
                        {toast.type === 'info' && 'ℹ️'}
                    </span>
                    <div className="flex-1 pt-0.5">
                        <p className={`text-sm font-medium ${
                            toast.type === 'success' ? 'text-green-800' :
                            toast.type === 'error' ? 'text-red-800' :
                            toast.type === 'warning' ? 'text-amber-800' :
                            'text-blue-800'
                        }`}>
                            {toast.message}
                        </p>
                    </div>
                    <button 
                        className="text-gray-400 hover:text-gray-600 transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 flex-shrink-0" 
                        onClick={(e) => { e.stopPropagation(); onRemove(toast.id); }}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}

export default ToastProvider;
