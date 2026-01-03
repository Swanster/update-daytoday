import { useState } from 'react';
import './AttachmentViewer.css';

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
        <div className="attachment-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="attachment-modal">
                <div className="attachment-modal-header">
                    <h3>📎 Attachments</h3>
                    {entryName && <span className="entry-name">{entryName}</span>}
                    <button className="attachment-modal-close" onClick={onClose}>×</button>
                </div>

                <div className="attachment-modal-body">
                    {attachments.length === 0 ? (
                        <div className="no-attachments">
                            <span className="no-attachments-icon">📂</span>
                            <p>No attachments found</p>
                        </div>
                    ) : (
                        <div className="attachment-list">
                            {attachments.map((attachment, index) => (
                                <div key={attachment.filename || index} className="attachment-card">
                                    <div className="attachment-preview">
                                        {isImage(attachment.mimetype) ? (
                                            <img
                                                src={getFileUrl(attachment.filename)}
                                                alt={attachment.originalName}
                                                onClick={() => setPreviewImage(attachment)}
                                            />
                                        ) : (
                                            <span className="file-type-icon">{getFileIcon(attachment.mimetype)}</span>
                                        )}
                                    </div>
                                    <div className="attachment-info">
                                        <div className="attachment-name" title={attachment.originalName}>
                                            {attachment.originalName}
                                        </div>
                                        <div className="attachment-meta">
                                            <span>{formatFileSize(attachment.size)}</span>
                                            {attachment.uploadedAt && (
                                                <span>{formatDate(attachment.uploadedAt)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="attachment-actions">
                                        <a
                                            href={getFileUrl(attachment.filename)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="view-btn"
                                            title="View"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            👁️
                                        </a>
                                        <button
                                            className="download-btn"
                                            onClick={() => handleDownload(attachment)}
                                            title="Download"
                                        >
                                            ⬇️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="attachment-modal-footer">
                    <span className="attachment-count">{attachments.length} file(s)</span>
                    <button className="close-btn" onClick={onClose}>Close</button>
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}>
                    <div className="image-preview-container">
                        <img src={getFileUrl(previewImage.filename)} alt={previewImage.originalName} />
                        <button className="preview-close" onClick={() => setPreviewImage(null)}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
}
