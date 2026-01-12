import { useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import './UserManagement.css';

export default function UserManagement({ token, isOpen, onClose, currentUser }) {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [resetPasswordModal, setResetPasswordModal] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (isOpen && token) {
            fetchUsers();
        }
    }, [isOpen, token]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const [pending, all] = await Promise.all([
                authApi.getPendingUsers(token),
                authApi.getUsers(token)
            ]);
            setPendingUsers(pending);
            setAllUsers(all);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await authApi.approveUser(token, userId);
            await fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Error approving user');
        }
    };

    const handleReject = async (userId) => {
        if (window.confirm('Are you sure you want to reject this registration?')) {
            try {
                await authApi.rejectUser(token, userId);
                await fetchUsers();
            } catch (error) {
                alert(error.response?.data?.message || 'Error rejecting user');
            }
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await authApi.updateUserRole(token, userId, newRole);
            await fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating role');
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (window.confirm(`Are you sure you want to DELETE user "${username}"? This action cannot be undone.`)) {
            try {
                await authApi.deleteUser(token, userId);
                await fetchUsers();
                alert(`User ${username} has been deleted`);
            } catch (error) {
                alert(error.response?.data?.message || 'Error deleting user');
            }
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        try {
            await authApi.resetPassword(token, resetPasswordModal._id, newPassword);
            alert(`Password reset for ${resetPasswordModal.username}`);
            setResetPasswordModal(null);
            setNewPassword('');
        } catch (error) {
            alert(error.response?.data?.message || 'Error resetting password');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRoleBadge = (role) => {
        const classes = {
            superuser: 'role-badge superuser',
            admin: 'role-badge admin',
            user: 'role-badge user'
        };
        return classes[role] || 'role-badge';
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content user-management-modal">
                <div className="modal-header">
                    <h2>👥 User Management</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="activity-filters">
                        <button
                            className={`filter-btn ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pending')}
                        >
                            Pending ({pendingUsers.length})
                        </button>
                        <button
                            className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            All Users
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : activeTab === 'pending' ? (
                        pendingUsers.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">✅</div>
                                <h3>No Pending Registrations</h3>
                                <p>All user registrations have been processed.</p>
                            </div>
                        ) : (
                            <div className="user-list">
                                {pendingUsers.map((user) => (
                                    <div key={user._id} className="user-item pending">
                                        <div className="user-info">
                                            <div className="user-name-display">
                                                <strong>{user.displayName || user.username}</strong>
                                                <span className="username">@{user.username}</span>
                                            </div>
                                            <div className="user-date">Registered: {formatDate(user.createdAt)}</div>
                                        </div>
                                        <div className="user-actions">
                                            <button
                                                className="btn btn-approve"
                                                onClick={() => handleApprove(user._id)}
                                            >
                                                ✓ Approve
                                            </button>
                                            <button
                                                className="btn btn-reject"
                                                onClick={() => handleReject(user._id)}
                                            >
                                                ✕ Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="user-list">
                            {allUsers.map((user) => (
                                <div key={user._id} className="user-item">
                                    <div className="user-info">
                                        <div className="user-name-display">
                                            <strong>{user.displayName || user.username}</strong>
                                            <span className="username">@{user.username}</span>
                                            <span className={getRoleBadge(user.role)}>{user.role}</span>
                                            {!user.isApproved && <span className="pending-badge">Pending</span>}
                                        </div>
                                        <div className="user-date">Joined: {formatDate(user.createdAt)}</div>
                                    </div>
                                    {currentUser.role === 'superuser' && user._id !== currentUser._id && (
                                        <div className="user-actions">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                className="role-select"
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                                <option value="superuser">Superuser</option>
                                            </select>
                                            <button
                                                className="btn btn-reset"
                                                onClick={() => setResetPasswordModal(user)}
                                                title="Reset Password"
                                            >
                                                🔑
                                            </button>
                                            <button
                                                className="btn btn-delete"
                                                onClick={() => handleDeleteUser(user._id, user.username)}
                                                title="Delete User"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Reset Password Modal */}
            {resetPasswordModal && (
                <div className="password-reset-modal">
                    <div className="password-reset-content">
                        <h3>🔑 Reset Password</h3>
                        <p>Set new password for <strong>{resetPasswordModal.username}</strong></p>
                        <div className="form-group">
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New password (min 6 chars)"
                                minLength={6}
                            />
                        </div>
                        <div className="password-reset-actions">
                            <button className="btn btn-secondary" onClick={() => { setResetPasswordModal(null); setNewPassword(''); }}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleResetPassword}>
                                Reset Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
