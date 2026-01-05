import api from './axiosConfig';

const API_URL = '/api/clients';

export const clientsApi = {
    // Get all clients with summary counts
    getAll: async () => {
        const response = await api.get(API_URL);
        return response.data;
    },

    // Get full history for a specific client
    getHistory: async (clientName) => {
        const response = await api.get(`${API_URL}/${encodeURIComponent(clientName)}`);
        return response.data;
    }
};
