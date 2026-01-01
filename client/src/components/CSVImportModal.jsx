import { useState, useRef } from 'react';
import { projectsApi } from '../api/projects';
import { dailiesApi } from '../api/dailies';

export default function CSVImportModal({ isOpen, onClose, onSuccess, apiType = 'project' }) {
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.tsv') || droppedFile.name.endsWith('.csv'))) {
            setFile(droppedFile);
            setError('');
        } else {
            setError('Please drop a TSV or CSV file');
        }
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setLoading(true);
        setError('');

        try {
            const api = apiType === 'daily' ? dailiesApi : projectsApi;
            const result = await api.importTSV(file);
            onSuccess(result);
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to import file');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setError('');
        setLoading(false);
        onClose();
    };

    const formatInfo = apiType === 'daily'
        ? 'No, CLIENT, SERVICE, CASE & ISSUE, ACTION, DATE, PIC TIM, DETAIL ACTION, STATUS'
        : 'No, SURVEY PROJECT, SERVICE, REPORT SURVEY, WO, MATERIAL, DUE DATE, DATE, PIC TIM, PROGRESS, STATUS';

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content csv-import-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Import TSV - {apiType === 'daily' ? 'Daily Activity' : 'Project'}</h2>
                    <button className="close-btn" onClick={handleClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div
                        className={`drop-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".tsv,.csv"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />

                        {file ? (
                            <div className="file-info">
                                <span className="file-icon">📄</span>
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                        ) : (
                            <div className="drop-zone-content">
                                <span className="upload-icon">📁</span>
                                <p>Drag and drop a TSV file here</p>
                                <p className="drop-zone-hint">or click to browse</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="import-error">
                            {error}
                        </div>
                    )}

                    <div className="import-info">
                        <h4>Expected TSV Format:</h4>
                        <ul>
                            <li>{formatInfo}</li>
                            <li>Multi-row entries for same {apiType === 'daily' ? 'client' : 'project'} will be grouped automatically</li>
                        </ul>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        className="btn btn-secondary"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleImport}
                        disabled={!file || loading}
                    >
                        {loading ? 'Importing...' : 'Import'}
                    </button>
                </div>
            </div>
        </div>
    );
}
