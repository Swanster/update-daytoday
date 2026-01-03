import { useState, useRef } from 'react';
import { uploadsApi } from '../api/uploads';
import './FileUpload.css';

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

export default function FileUpload({ existingFiles = [], onFilesChange, disabled = false }) {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];

    const maxSize = 50 * 1024 * 1024; // 50MB

    const validateFile = (file) => {
        if (!allowedTypes.includes(file.type)) {
            return 'File type not allowed. Allowed: images, PDF, Excel, Word';
        }
        if (file.size > maxSize) {
            return 'File too large. Maximum size is 50MB';
        }
        return null;
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (disabled) return;

        const droppedFiles = [...e.dataTransfer.files];
        handleFiles(droppedFiles);
    };

    const handleFiles = async (newFiles) => {
        setError('');

        // Validate files
        for (const file of newFiles) {
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }
        }

        setUploading(true);

        try {
            const uploadedFiles = [];
            for (const file of newFiles) {
                const result = await uploadsApi.uploadFile(file);
                uploadedFiles.push(result);
            }

            const updatedFiles = [...files, ...uploadedFiles];
            setFiles(updatedFiles);
            onFilesChange([...existingFiles, ...updatedFiles]);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleInputChange = (e) => {
        if (e.target.files.length > 0) {
            handleFiles([...e.target.files]);
        }
    };

    const removeNewFile = async (index) => {
        const fileToRemove = files[index];
        try {
            await uploadsApi.deleteFile(fileToRemove.filename);
            const updatedFiles = files.filter((_, i) => i !== index);
            setFiles(updatedFiles);
            onFilesChange([...existingFiles, ...updatedFiles]);
        } catch (err) {
            setError('Failed to remove file');
        }
    };

    const removeExistingFile = (index) => {
        const updatedExisting = existingFiles.filter((_, i) => i !== index);
        onFilesChange([...updatedExisting, ...files]);
    };

    const openFilePicker = () => {
        inputRef.current?.click();
    };

    return (
        <div className="file-upload-container">
            <label className="file-upload-label">Attachments</label>

            {/* Drop zone */}
            <div
                className={`file-drop-zone ${dragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={openFilePicker}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    onChange={handleInputChange}
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.xlsx,.xls,.docx,.doc"
                    style={{ display: 'none' }}
                    disabled={disabled}
                />
                {uploading ? (
                    <div className="upload-loading">
                        <span className="spinner"></span>
                        <span>Uploading...</span>
                    </div>
                ) : (
                    <>
                        <span className="upload-icon">📁</span>
                        <span className="upload-text">
                            Drag & drop files here or click to browse
                        </span>
                        <span className="upload-hint">
                            Images, PDF, Excel, Word (max 50MB)
                        </span>
                    </>
                )}
            </div>

            {error && <div className="file-upload-error">{error}</div>}

            {/* Existing files */}
            {existingFiles.length > 0 && (
                <div className="file-list">
                    <div className="file-list-title">Existing Files</div>
                    {existingFiles.map((file, index) => (
                        <div key={file.filename} className="file-item">
                            <span className="file-icon">{getFileIcon(file.mimetype)}</span>
                            <a
                                href={uploadsApi.getFileUrl(file.filename)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="file-name"
                            >
                                {file.originalName}
                            </a>
                            <span className="file-size">{formatFileSize(file.size)}</span>
                            {!disabled && (
                                <button
                                    type="button"
                                    className="file-remove"
                                    onClick={() => removeExistingFile(index)}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Newly uploaded files */}
            {files.length > 0 && (
                <div className="file-list">
                    <div className="file-list-title">New Files</div>
                    {files.map((file, index) => (
                        <div key={file.filename} className="file-item new">
                            <span className="file-icon">{getFileIcon(file.mimetype)}</span>
                            <span className="file-name">{file.originalName}</span>
                            <span className="file-size">{formatFileSize(file.size)}</span>
                            {!disabled && (
                                <button
                                    type="button"
                                    className="file-remove"
                                    onClick={() => removeNewFile(index)}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
