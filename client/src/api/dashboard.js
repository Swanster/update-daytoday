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
    },

    // Mark an item as Done (from overdue section)
    markDone: async (id, type) => {
        const response = await api.patch(`${API_URL}/mark-done`, { id, type });
        return response.data;
    },

    // Quick add a project from dashboard
    quickAddProject: async (projectData) => {
        const response = await api.post(`${API_URL}/quick-project`, projectData);
        return response.data;
    },

    // Update a specific field on a project
    updateField: async (id, field, value) => {
        const response = await api.patch(`${API_URL}/update-field`, { id, field, value });
        return response.data;
    }
};
