import api from './axiosConfig';

const API_URL = '/api/briefings';

export const briefingsApi = {
    // Get all briefings (optionally filtered by year/status)
    getAll: async (filters = {}) => {
        const { year, status, syncStatus } = filters;
        const params = {};
        if (year) params.year = year;
        if (status) params.status = status;
        if (syncStatus) params.syncStatus = syncStatus;
        
        const response = await api.get(API_URL, { params });
        return response.data;
    },

    // Get single briefing by ID
    getById: async (id) => {
        const response = await api.get(`${API_URL}/${id}`);
        return response.data;
    },

    // Create new briefing
    create: async (briefingData) => {
        const response = await api.post(API_URL, briefingData);
        return response.data;
    },

    // Update briefing
    update: async (id, briefingData) => {
        const response = await api.patch(`${API_URL}/${id}`, briefingData);
        return response.data;
    },

    // Delete briefing
    delete: async (id) => {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    },

    // Batch update status for multiple briefings
    batchUpdateStatus: async (ids, status) => {
        const response = await api.patch(`${API_URL}/batch-status`, { ids, status });
        return response.data;
    },

    // Sync data from Google Sheets to MongoDB
    syncFromSheet: async () => {
        const response = await api.post(`${API_URL}/sync-from-sheet`);
        return response.data;
    },

    // Sync data from MongoDB to Google Sheets
    syncToSheet: async () => {
        const response = await api.post(`${API_URL}/sync-to-sheet`);
        return response.data;
    },

    // Get briefing statistics
    getStats: async (year = null) => {
        const params = {};
        if (year) params.year = year;
        
        const response = await api.get(`${API_URL}/stats`, { params });
        return response.data;
    }
};
