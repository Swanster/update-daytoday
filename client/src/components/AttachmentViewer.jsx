import { useState } from 'react';
// import './AttachmentViewer.css'; // Removed custom CSS

// File type icons
const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    if (mimetype?.includes('spreadsheet') || mimetype?.includes('excel')) return '📊';
    if (mimetype?.includes('word')) return '📝';
    return '📎';
};

// Format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function AttachmentViewer({ isOpen, onClose, attachments = [], entryName = '' }) {
    const [previewImage, setPreviewImage] = useState(null);

    if (!isOpen) return null;

    const getFileUrl = (filename) => `/uploads/${filename}`;

    const handleDownload = (attachment) => {
        const link = document.createElement('a');
        link.href = getFileUrl(attachment.filename);
        link.download = attachment.originalName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isImage = (mimetype) => mimetype?.startsWith('image/');

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                <div className="px-6 py-4 border-b border-ch-soft bg-ch-light flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-ch-dark flex items-center gap-2">
                            <span>📎</span> Attachments
                        </h3>
                        {entryName && <span className="text-sm text-ch-primary font-medium block mt-1">{entryName}</span>}
                    </div>
                    <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-ch-primary hover:text-ch-dark hover:bg-ch-soft border border-ch-soft transition-all shadow-sm"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-ch-light/50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {attachments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center opacity-60">
                            <span className="text-4xl mb-3">📂</span>
                            <p className="text-ch-primary font-medium">No attachments found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {attachments.map((attachment, index) => (
                                <div key={attachment.filename || index} className="group bg-white rounded-xl border border-ch-soft overflow-hidden hover:shadow-lg hover:border-ch-soft transition-all duration-300 flex flex-col">
                                    <div className="h-32 bg-ch-soft flex items-center justify-center overflow-hidden relative">
                                        {isImage(attachment.mimetype) ? (
                                            <div className="w-full h-full relative cursor-pointer group-hover:scale-105 transition-transform duration-500" onClick={() => setPreviewImage(attachment)}>
                                                <img
                                                    src={getFileUrl(attachment.filename)}
                                                    alt={attachment.originalName}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <span className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 bg-black/50 text-white rounded-full p-2">🔍</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-4xl select-none transform group-hover:scale-110 transition-transform duration-300">{getFileIcon(attachment.mimetype)}</span>
                                        )}
                                    </div>
                                    <div className="p-3 flex flex-col flex-1">
                                        <div className="font-medium text-sm text-ch-dark truncate mb-1" title={attachment.originalName}>
                                            {attachment.originalName}
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-ch-primary mb-3 font-mono">
                                            <span>{formatFileSize(attachment.size)}</span>
                                            {attachment.uploadedAt && (
                                                <span>{formatDate(attachment.uploadedAt)}</span>
                                            )}
                                        </div>
                                        <div className="mt-auto flex gap-2">
                                            <a
                                                href={getFileUrl(attachment.filename)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-1.5 bg-ch-soft text-ch-dark rounded-lg text-xs font-bold hover:bg-ch-soft hover:text-ch-primary transition-colors text-center flex items-center justify-center gap-1"
                                                title="View"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <span>👁️</span> View
                                            </a>
                                            <button
                                                className="flex-1 py-1.5 bg-ch-soft text-ch-dark rounded-lg text-xs font-bold hover:bg-green-50 hover:text-green-600 transition-colors text-center flex items-center justify-center gap-1"
                                                onClick={() => handleDownload(attachment)}
                                                title="Download"
                                            >
                                                <span>⬇️</span> Get
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-6 py-3 bg-white border-t border-ch-soft flex items-center justify-between text-xs text-ch-primary">
                    <span className="font-medium">{attachments.length} file(s)</span>
                    <button className="px-4 py-2 bg-ch-soft text-ch-dark font-bold rounded-lg hover:bg-ch-soft transition-colors" onClick={onClose}>Close</button>
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 animate-fade-in" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-full max-h-screen p-4 flex flex-col items-center justify-center">
                        <img 
                            src={getFileUrl(previewImage.filename)} 
                            alt={previewImage.originalName} 
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button 
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm" 
                            onClick={() => setPreviewImage(null)}
                        >
                            ×
                        </button>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium border border-white/10">
                            {previewImage.originalName}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
