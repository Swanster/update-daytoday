import { useState, useRef } from 'react';
import { uploadsApi } from '../api/uploads';
// import './FileUpload.css'; // Removed custom CSS

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

export default function FileUpload({ existingFiles = [], onFilesChange, disabled = false, canDelete = true }) {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
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
        setUploadProgress(0);

        try {
            const uploadedFiles = [];
            const totalFiles = newFiles.length;
            
            for (let i = 0; i < totalFiles; i++) {
                const file = newFiles[i];
                const baseProgress = (i / totalFiles) * 100;
                
                const result = await uploadsApi.uploadFile(file, (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        const currentFileContribution = percentCompleted / totalFiles;
                        setUploadProgress(Math.min(100, Math.round(baseProgress + currentFileContribution)));
                    }
                });
                uploadedFiles.push(result);
            }

            const updatedFiles = [...files, ...uploadedFiles];
            setFiles(updatedFiles);
            onFilesChange([...existingFiles, ...updatedFiles]);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            setUploadProgress(0);
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
        <div className="w-full">
            {/* Drop zone */}
            <div
                className={`
                    relative border-2 border-dashed rounded-xl p-6 md:p-8 flex flex-col items-center justify-center text-center transition-all duration-200
                    ${disabled ? 'bg-ch-light border-ch-soft cursor-not-allowed opacity-60' : 'cursor-pointer'}
                    ${dragActive 
                        ? 'border-ch-primary bg-ch-soft/50 scale-[1.01]' 
                        : 'border-gray-300 hover:border-ch-primary hover:bg-ch-light'
                    }
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={!disabled ? openFilePicker : undefined}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    onChange={handleInputChange}
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.xlsx,.xls,.docx,.doc"
                    className="hidden"
                    disabled={disabled}
                />
                
                {uploading ? (
                    <div className="flex flex-col items-center justify-center text-ch-primary w-full max-w-xs">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ch-primary mb-4"></div>
                        <div className="w-full bg-ch-soft rounded-full h-2.5 mb-2 overflow-hidden">
                            <div className="bg-ch-primary h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <span className="text-sm font-medium animate-pulse">Uploading files... {uploadProgress}%</span>
                    </div>
                ) : (
                    <>
                        <div className={`text-4xl mb-3 transition-transform duration-300 ${dragActive ? 'scale-110' : ''}`}>
                            {dragActive ? '📂' : '📁'}
                        </div>
                        <span className="text-sm font-bold text-ch-dark mb-1">
                            Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-ch-primary">
                            Images, PDF, Excel, Word (max 50MB)
                        </span>
                    </>
                )}
            </div>

            {error && (
                <div className="mt-3 p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100 flex items-center gap-2 animate-shake">
                    ⚠️ {error}
                </div>
            )}

            {/* File Lists Container */}
            {(existingFiles.length > 0 || files.length > 0) && (
                <div className="mt-4 space-y-4">
                    
                    {/* Existing files */}
                    {existingFiles.length > 0 && (
                        <div>
                            <div className="text-xs font-bold text-ch-primary uppercase tracking-wide mb-2 px-1">Attached Files</div>
                            <div className="space-y-2">
                                {existingFiles.map((file, index) => (
                                    <div key={file.filename || index} className="group flex items-center gap-3 p-3 bg-white rounded-lg border border-ch-soft shadow-sm hover:shadow-md transition-all sm:flex-nowrap flex-wrap">
                                        {file.mimetype?.startsWith('image/') ? (
                                            <img src={uploadsApi.getFileUrl(file.filename)} alt={file.originalName} className="w-10 h-10 object-cover rounded shadow-sm border border-ch-soft bg-ch-light shrink-0" />
                                        ) : (
                                            <span className="text-2xl shrink-0 w-10 flex justify-center">{getFileIcon(file.mimetype)}</span>
                                        )}
                                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 overflow-hidden">
                                            <a
                                                href={uploadsApi.getFileUrl(file.filename)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-ch-primary hover:text-ch-dark hover:underline truncate"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {file.originalName}
                                            </a>
                                            <span className="text-[10px] sm:text-xs text-ch-primary font-mono whitespace-nowrap">{formatFileSize(file.size)}</span>
                                        </div>
                                        {!disabled && canDelete && (
                                            <button
                                                type="button"
                                                className="w-6 h-6 flex items-center justify-center rounded-full text-ch-primary hover:text-red-500 hover:bg-red-50 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeExistingFile(index);
                                                }}
                                                title="Remove file"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Newly uploaded files */}
                    {files.length > 0 && (
                        <div>
                             <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2 px-1 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                New Uploads
                            </div>
                             <div className="space-y-2">
                                {files.map((file, index) => (
                                    <div key={file.filename || index} className="group flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100 shadow-sm sm:flex-nowrap flex-wrap">
                                        {file.mimetype?.startsWith('image/') ? (
                                            <img src={uploadsApi.getFileUrl(file.filename)} alt={file.originalName} className="w-10 h-10 object-cover rounded shadow-sm border border-green-200 bg-white shrink-0" />
                                        ) : (
                                            <span className="text-2xl shrink-0 w-10 flex justify-center">{getFileIcon(file.mimetype)}</span>
                                        )}
                                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 overflow-hidden">
                                            <span className="text-sm font-medium text-ch-dark truncate">{file.originalName}</span>
                                            <span className="text-[10px] sm:text-xs text-ch-primary font-mono whitespace-nowrap">{formatFileSize(file.size)}</span>
                                        </div>
                                        {!disabled && canDelete && (
                                            <button
                                                type="button"
                                                className="w-6 h-6 flex items-center justify-center rounded-full text-ch-primary hover:text-red-500 hover:bg-red-100 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeNewFile(index);
                                                }}
                                                title="Remove file"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
