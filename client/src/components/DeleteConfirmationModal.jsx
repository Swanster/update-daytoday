import { useEffect, useState } from 'react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, itemType }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setIsDeleting(false);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    const handleConfirm = async () => {
        setIsDeleting(true);
        await onConfirm();
        setIsDeleting(false);
    };

    return (
        <div 
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={!isDeleting ? onClose : undefined}
            />

            {/* Modal Content */}
            <div 
                className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative z-10 transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
            >
                {/* Header */}
                <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">
                        🗑️
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Delete {itemType}?</h3>
                    <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                        Are you sure you want to delete <span className="font-bold text-gray-700">"{itemName}"</span>?
                        <br />
                        This action cannot be undone.
                    </p>
                </div>

                {/* Actions */}
                <div className="p-4 bg-white flex gap-3">
                    <button 
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2.5 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-600 focus:ring-4 focus:ring-red-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
