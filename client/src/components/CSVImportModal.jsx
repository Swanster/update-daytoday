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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden glass animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 bg-white/50 backdrop-blur-md flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-green-500">📊</span>
                        Import TSV - {apiType === 'daily' ? 'Daily Activity' : 'Project'}
                    </h2>
                    <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all shadow-sm"
                        onClick={handleClose}
                    >
                        &times;
                    </button>
                </div>

                <div className="p-6">
                    <div
                        className={`
                            relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer mb-6
                            ${dragging 
                                ? 'border-green-500 bg-green-50/50 scale-[1.01]' 
                                : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
                            }
                            ${file ? 'bg-green-50/30 border-green-200' : ''}
                        `}
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
                            className="hidden"
                        />

                        {file ? (
                            <div className="flex flex-col items-center animate-fade-in">
                                <span className="text-4xl mb-3">📄</span>
                                <span className="text-sm font-bold text-gray-800 mb-1">{file.name}</span>
                                <span className="text-xs text-gray-500 font-mono">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="text-4xl mb-3 text-gray-300">📁</span>
                                <p className="text-sm font-bold text-gray-700 mb-1">Drag and drop a TSV file here</p>
                                <p className="text-xs text-gray-500">or click to browse</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2 animate-shake">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Expected TSV Format:</h4>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                            <li className="break-words leading-relaxed font-mono bg-white px-2 py-1 rounded border border-gray-200 inline-block">{formatInfo}</li>
                            <li>Multi-row entries for same {apiType === 'daily' ? 'client' : 'project'} will be grouped automatically</li>
                        </ul>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        className="px-6 py-2.5 text-gray-600 font-bold text-sm hover:bg-gray-200/50 rounded-xl transition-colors"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-8 py-2.5 bg-green-600 text-white font-bold text-sm rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-500/30 transition-all shadow-md transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        onClick={handleImport}
                        disabled={!file || loading}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Importing...
                            </>
                        ) : 'Import'}
                    </button>
                </div>
            </div>
        </div>
    );
}
