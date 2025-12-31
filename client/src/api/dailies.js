import axios from 'axios';

const API_URL = '/api/dailies';

export const dailiesApi = {
    // Get all daily entries (optionally filtered by quarter)
    getAll: async (quarter = null, year = null) => {
        const params = {};
        if (quarter && year) {
            params.quarter = quarter;
            params.year = year;
        }
        const response = await axios.get(API_URL, { params });
        return response.data;
    },

    // Get available quarters
    getQuarters: async () => {
        const response = await axios.get(`${API_URL}/quarters`);
        return response.data;
    },

    // Get suggestions for autocomplete
    getSuggestions: async (query) => {
        const response = await axios.get(`${API_URL}/suggestions`, {
            params: { q: query }
        });
        return response.data;
    },

    // Create new daily entry
    create: async (dailyData) => {
        const response = await axios.post(API_URL, dailyData);
        return response.data;
    },

    // Update daily entry
    update: async (id, dailyData) => {
        const response = await axios.put(`${API_URL}/${id}`, dailyData);
        return response.data;
    },

    // Delete daily entry
    delete: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    }
};
