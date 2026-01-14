import { useState, useEffect } from 'react';
import { picMembersApi } from '../api/picMembers';

export default function PicMemberManagement({ isOpen, onClose }) {
    const [picMembers, setPicMembers] = useState([]);
    const [newMemberName, setNewMemberName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchPicMembers();
        }
    }, [isOpen]);

    const fetchPicMembers = async () => {
        try {
            setLoading(true);
            const data = await picMembersApi.getAll();
            setPicMembers(data);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!newMemberName.trim()) return;

        try {
            setLoading(true);
            await picMembersApi.create(newMemberName.trim());
            setNewMemberName('');
            await fetchPicMembers();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = (member) => {
        setEditingId(member._id);
        setEditName(member.name);
    };

    const handleSaveEdit = async () => {
        if (!editName.trim()) return;

        try {
            setLoading(true);
            await picMembersApi.update(editingId, { name: editName.trim() });
            setEditingId(null);
            setEditName('');
            await fetchPicMembers();
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
        if (!window.confirm('Are you sure you want to delete this PIC member?')) return;

        try {
            setLoading(true);
            await picMembersApi.delete(id);
            await fetchPicMembers();
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
                    <h2>👥 Manage PIC Members</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                            <button onClick={() => setError('')}>&times;</button>
                        </div>
                    )}

                    {/* Add new PIC member form */}
                    <form onSubmit={handleAddMember} className="add-category-form">
                        <input
                            type="text"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            placeholder="Enter new PIC member name..."
                            disabled={loading}
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading || !newMemberName.trim()}>
                            Add Member
                        </button>
                    </form>

                    {/* PIC member list */}
                    <div className="category-list">
                        {loading && picMembers.length === 0 ? (
                            <div className="loading">Loading PIC members...</div>
                        ) : picMembers.length === 0 ? (
                            <div className="empty-state">No PIC members found</div>
                        ) : (
                            picMembers.map((member) => (
                                <div key={member._id} className="category-item">
                                    {editingId === member._id ? (
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
                                            <span className="category-name">{member.name}</span>
                                            <div className="category-actions">
                                                <button
                                                    className="btn btn-sm btn-edit"
                                                    onClick={() => handleStartEdit(member)}
                                                    disabled={loading}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-delete"
                                                    onClick={() => handleDelete(member._id)}
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
