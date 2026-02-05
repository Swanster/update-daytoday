import { useState, useEffect } from 'react';
import { authApi } from '../api/auth';
// import './UserManagement.css'; // Removed custom CSS

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
            superuser: 'bg-purple-100 text-purple-700 border-purple-200',
            admin: 'bg-blue-100 text-blue-700 border-blue-200',
            user: 'bg-gray-100 text-gray-700 border-gray-200'
        };
        return `px-2 py-0.5 rounded-full text-xs font-semibold border ${classes[role] || classes.user}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl glass overflow-hidden flex flex-col animate-scale-in">
                <div className="px-6 py-4 border-b border-gray-100 bg-white/50 backdrop-blur-md flex items-center justify-between flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-pink-500">👥</span>
                        User Management
                    </h2>
                    <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all shadow-sm"
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 pt-6 pb-2">
                        <div className="flex bg-gray-100/80 p-1 rounded-xl w-fit">
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === 'pending' 
                                    ? 'bg-white text-pink-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                                onClick={() => setActiveTab('pending')}
                            >
                                Pending ({pendingUsers.length})
                            </button>
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === 'all' 
                                    ? 'bg-white text-pink-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                                onClick={() => setActiveTab('all')}
                            >
                                All Users
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="w-8 h-8 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin"></div>
                            </div>
                        ) : activeTab === 'pending' ? (
                            pendingUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-70">
                                    <div className="text-4xl mb-4">✅</div>
                                    <h3 className="text-lg font-semibold text-gray-800">No Pending Registrations</h3>
                                    <p className="text-gray-500">All user registrations have been processed.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {pendingUsers.map((user) => (
                                        <div key={user._id} className="bg-white p-4 rounded-xl border border-pink-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-800">{user.displayName || user.username}</span>
                                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">@{user.username}</span>
                                                </div>
                                                <div className="text-xs text-gray-400">Registered: {formatDate(user.createdAt)}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors flex items-center gap-1"
                                                    onClick={() => handleApprove(user._id)}
                                                >
                                                    <span>✓</span> Approve
                                                </button>
                                                <button
                                                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors flex items-center gap-1"
                                                    onClick={() => handleReject(user._id)}
                                                >
                                                    <span>✕</span> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="grid gap-3">
                                {allUsers.map((user) => (
                                    <div key={user._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-pink-200 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                                                user.role === 'superuser' ? 'bg-purple-100 text-purple-600' : 
                                                user.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {(user.displayName || user.username).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-800">{user.displayName || user.username}</span>
                                                    <span className="text-xs text-gray-400">@{user.username}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={getRoleBadge(user.role)}>{user.role}</span>
                                                    {!user.isApproved && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Pending</span>}
                                                    <span className="text-[10px] text-gray-400">Joined: {formatDate(user.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {currentUser.role === 'superuser' && user._id !== currentUser._id && (
                                            <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-500/20 bg-gray-50"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="superuser">Superuser</option>
                                                </select>
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg hover:bg-amber-100 hover:text-amber-600 transition-colors"
                                                    onClick={() => setResetPasswordModal(user)}
                                                    title="Reset Password"
                                                >
                                                    🔑
                                                </button>
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
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

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button className="px-6 py-2 bg-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-300 transition-colors" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>

            {/* Reset Password Modal Overlay */}
            {resetPasswordModal && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 border border-gray-200 animate-scale-in">
                        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <span>🔑</span> Reset Password
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">Set new password for <strong className="text-gray-900">{resetPasswordModal.username}</strong></p>
                        
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password (min 6 chars)"
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 mb-4 text-sm"
                            autoFocus
                        />
                        
                        <div className="flex justify-end gap-2">
                            <button 
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                onClick={() => { setResetPasswordModal(null); setNewPassword(''); }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="px-4 py-2 text-sm font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-lg shadow-md transition-colors"
                                onClick={handleResetPassword}
                            >
                                Reset Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
