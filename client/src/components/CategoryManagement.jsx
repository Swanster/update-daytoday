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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl glass overflow-hidden flex flex-col animate-scale-in">
                <div className="px-6 py-4 border-b border-ch-soft bg-white/50 backdrop-blur-md flex items-center justify-between">
                    <h2 className="text-xl font-bold text-ch-dark flex items-center gap-2">
                        <span className="text-ch-primary">📂</span>
                        Manage Categories
                    </h2>
                    <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-ch-primary hover:text-ch-dark hover:bg-ch-soft border border-ch-soft transition-all shadow-sm"
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto max-h-[70vh]">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center justify-between animate-shake">
                            <span className="flex items-center gap-2">⚠️ {error}</span>
                            <button onClick={() => setError('')} className="text-red-400 hover:text-red-700">&times;</button>
                        </div>
                    )}

                    {/* Add new category form */}
                    <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Enter new category name..."
                            className="flex-1 px-4 py-2.5 bg-ch-light border border-ch-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all text-sm"
                            disabled={loading}
                        />
                        <button 
                            type="submit" 
                            className="px-4 py-2.5 bg-ch-primary text-white font-bold text-sm rounded-xl hover:bg-ch-dark focus:ring-4 focus:ring-ch-primary/30 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            disabled={loading || !newCategoryName.trim()}
                        >
                            Add +
                        </button>
                    </form>

                    {/* Category list */}
                    <div className="space-y-2">
                        {loading && categories.length === 0 ? (
                            <div className="text-center py-8 text-ch-primary">
                                <div className="w-8 h-8 border-4 border-ch-soft border-t-ch-primary rounded-full animate-spin mx-auto mb-2"></div>
                                Loading categories...
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="text-center py-8 bg-ch-light rounded-xl border border-dashed border-ch-soft text-ch-primary text-sm">
                                No categories found
                            </div>
                        ) : (
                            categories.map((category) => (
                                <div key={category._id} className="group flex items-center justify-between p-3 bg-white border border-ch-soft rounded-xl hover:shadow-md hover:border-ch-soft transition-all duration-200">
                                    {editingId === category._id ? (
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                autoFocus
                                                className="flex-1 px-3 py-1.5 bg-ch-soft border border-ch-soft rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ch-primary/20"
                                            />
                                            <button
                                                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors shadow-sm"
                                                onClick={handleSaveEdit}
                                                disabled={loading}
                                            >
                                                Save
                                            </button>
                                            <button
                                                className="px-3 py-1.5 bg-ch-soft text-ch-dark rounded-lg text-xs font-bold hover:bg-gray-300 transition-colors"
                                                onClick={handleCancelEdit}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-ch-soft text-ch-primary flex items-center justify-center text-sm font-bold">
                                                    {category.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-ch-dark">{category.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center text-ch-primary hover:text-ch-primary hover:bg-ch-soft rounded-lg transition-colors"
                                                    onClick={() => handleStartEdit(category)}
                                                    disabled={loading}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center text-ch-primary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    onClick={() => handleDelete(category._id)}
                                                    disabled={loading}
                                                    title="Delete"
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

                <div className="px-6 py-4 bg-ch-light border-t border-ch-soft flex justify-end">
                    <button 
                        className="px-6 py-2 bg-ch-soft text-ch-dark font-bold text-sm rounded-xl hover:bg-gray-300 transition-colors"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
