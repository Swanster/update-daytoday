import api from './axiosConfig';

const API_URL = '/api/work-orders';

export const workOrdersApi = {
    getAll: async (quarter, year) => {
        const params = {};
        if (quarter && year) {
            params.quarter = quarter;
            params.year = year;
        }
        const response = await api.get(API_URL, { params });
        return response.data;
    },

    getReport: async (quarter, year, isYearly) => {
        const params = { quarter, year, isYearly };
        const response = await api.get(`${API_URL}/report`, { params });
        return response.data;
    },

    getQuarters: async () => {
        const response = await api.get(`${API_URL}/quarters`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post(API_URL, data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`${API_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    },

    batchUpdateStatus: async (ids, status) => {
        const response = await api.post(`${API_URL}/batch-status`, { ids, status });
        return response.data;
    }
};
