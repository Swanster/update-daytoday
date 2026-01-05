import { useState, useEffect } from 'react';
import { categoriesApi } from '../api/categories';

export default function CategoryManagement({ isOpen, onClose }) {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await categoriesApi.getAll();
            setCategories(data);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            setLoading(true);
            await categoriesApi.create(newCategoryName.trim());
            setNewCategoryName('');
            await fetchCategories();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = (category) => {
        setEditingId(category._id);
        setEditName(category.name);
    };

    const handleSaveEdit = async () => {
        if (!editName.trim()) return;

        try {
            setLoading(true);
            await categoriesApi.update(editingId, { name: editName.trim() });
            setEditingId(null);
            setEditName('');
            await fetchCategories();
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
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        try {
            setLoading(true);
            await categoriesApi.delete(id);
            await fetchCategories();
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
                    <h2>Manage Categories</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                            <button onClick={() => setError('')}>&times;</button>
                        </div>
                    )}

                    {/* Add new category form */}
                    <form onSubmit={handleAddCategory} className="add-category-form">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Enter new category name..."
                            disabled={loading}
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading || !newCategoryName.trim()}>
                            Add Category
                        </button>
                    </form>

                    {/* Category list */}
                    <div className="category-list">
                        {loading && categories.length === 0 ? (
                            <div className="loading">Loading categories...</div>
                        ) : categories.length === 0 ? (
                            <div className="empty-state">No categories found</div>
                        ) : (
                            categories.map((category) => (
                                <div key={category._id} className="category-item">
                                    {editingId === category._id ? (
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
                                            <span className="category-name">{category.name}</span>
                                            <div className="category-actions">
                                                <button
                                                    className="btn btn-sm btn-edit"
                                                    onClick={() => handleStartEdit(category)}
                                                    disabled={loading}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-delete"
                                                    onClick={() => handleDelete(category._id)}
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
