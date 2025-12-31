import axios from 'axios';

const API_URL = '/api/auth';

export const authApi = {
    // Register new user
    register: async (username, password, displayName) => {
        const response = await axios.post(`${API_URL}/register`, {
            username,
            password,
            displayName
        });
        return response.data;
    },

    // Login
    login: async (username, password) => {
        const response = await axios.post(`${API_URL}/login`, {
            username,
            password
        });
        return response.data;
    },

    // Get current user
    getMe: async (token) => {
        const response = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Get all users
    getUsers: async (token) => {
        const response = await axios.get(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Get pending users
    getPendingUsers: async (token) => {
        const response = await axios.get(`${API_URL}/pending`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Approve user
    approveUser: async (token, userId) => {
        const response = await axios.post(`${API_URL}/approve/${userId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Reject user
    rejectUser: async (token, userId) => {
        const response = await axios.delete(`${API_URL}/reject/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Update user role
    updateUserRole: async (token, userId, role) => {
        const response = await axios.patch(`${API_URL}/role/${userId}`, { role }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Delete user (superuser only)
    deleteUser: async (token, userId) => {
        const response = await axios.delete(`${API_URL}/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Reset user password (superuser only)
    resetPassword: async (token, userId, newPassword) => {
        const response = await axios.post(`${API_URL}/reset-password/${userId}`, { newPassword }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

// Activity logs API
export const activityLogsApi = {
    // Get activity logs
    getAll: async (token, page = 1, limit = 50, entityType = null) => {
        const params = { page, limit };
        if (entityType) params.entityType = entityType;

        const response = await axios.get('/api/activity-logs', {
            headers: { Authorization: `Bearer ${token}` },
            params
        });
        return response.data;
    },

    // Get recent activity
    getRecent: async (token) => {
        const response = await axios.get('/api/activity-logs/recent', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};
