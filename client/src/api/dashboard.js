import api from './axiosConfig';

const API_URL = '/api/dashboard';

export const dashboardApi = {
    // Get dashboard statistics
    getStats: async () => {
        const response = await api.get(`${API_URL}/stats`);
        return response.data;
    },

    // Get overdue items
    getOverdue: async () => {
        const response = await api.get(`${API_URL}/overdue`);
        return response.data;
    },

    // Get recent activity
    getActivity: async () => {
        const response = await api.get(`${API_URL}/activity`);
        return response.data;
    },

    // Get top clients with most troubleshooting activity
    getTopClients: async () => {
        const response = await api.get(`${API_URL}/top-clients`);
        return response.data;
    }
};
