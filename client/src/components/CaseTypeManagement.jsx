import { useState, useEffect } from 'react';
import { caseTypesApi } from '../api/caseTypes';

export default function CaseTypeManagement({ isOpen, onClose }) {
    const [caseTypes, setCaseTypes] = useState([]);
    const [newCaseTypeName, setNewCaseTypeName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCaseTypes();
        }
    }, [isOpen]);

    const fetchCaseTypes = async () => {
        try {
            setLoading(true);
            const data = await caseTypesApi.getAll();
            setCaseTypes(data);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCaseType = async (e) => {
        e.preventDefault();
        if (!newCaseTypeName.trim()) return;

        try {
            setLoading(true);
            await caseTypesApi.create(newCaseTypeName.trim());
            setNewCaseTypeName('');
            await fetchCaseTypes();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = (caseType) => {
        setEditingId(caseType._id);
        setEditName(caseType.name);
    };

    const handleSaveEdit = async () => {
        if (!editName.trim()) return;

        try {
            setLoading(true);
            await caseTypesApi.update(editingId, { name: editName.trim() });
            setEditingId(null);
            setEditName('');
            await fetchCaseTypes();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this case type?')) return;

        try {
            setLoading(true);
            await caseTypesApi.delete(id);
            await fetchCaseTypes();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content category-management-modal">
                <div className="modal-header">
                    <h2>Manage Case Types</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                            <button onClick={() => setError('')}>&times;</button>
                        </div>
                    )}

                    {/* Add new case type form */}
                    <form onSubmit={handleAddCaseType} className="add-category-form">
                        <input
                            type="text"
                            value={newCaseTypeName}
                            onChange={(e) => setNewCaseTypeName(e.target.value)}
                            placeholder="Enter new case type name..."
                            disabled={loading}
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading || !newCaseTypeName.trim()}>
                            Add Case Type
                        </button>
                    </form>

                    {/* Case type list */}
                    <div className="category-list">
                        {loading && caseTypes.length === 0 ? (
                            <div className="loading">Loading case types...</div>
                        ) : caseTypes.length === 0 ? (
                            <div className="empty-state">No case types found</div>
                        ) : (
                            caseTypes.map((caseType) => (
                                <div key={caseType._id} className="category-item">
                                    {editingId === caseType._id ? (
                                        <div className="category-edit">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                className="btn btn-sm btn-success"
                                                onClick={handleSaveEdit}
                                                disabled={loading}
                                            >
                                                Save
                                            </button>
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={handleCancelEdit}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="category-name">{caseType.name}</span>
                                            <div className="category-actions">
                                                <button
                                                    className="btn btn-sm btn-edit"
                                                    onClick={() => handleStartEdit(caseType)}
                                                    disabled={loading}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-delete"
                                                    onClick={() => handleDelete(caseType._id)}
                                                    disabled={loading}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
