import axios from 'axios';

const API_URL = '/api/projects';

export const projectsApi = {
    // Get all projects (optionally filtered by quarter)
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

    // Get grouped projects
    getGrouped: async () => {
        const response = await axios.get(`${API_URL}/grouped`);
        return response.data;
    },

    // Get suggestions for autocomplete
    getSuggestions: async (query) => {
        const response = await axios.get(`${API_URL}/suggestions`, {
            params: { q: query }
        });
        return response.data;
    },

    // Create new project entry
    create: async (projectData) => {
        const response = await axios.post(API_URL, projectData);
        return response.data;
    },

    // Update project entry
    update: async (id, projectData) => {
        const response = await axios.put(`${API_URL}/${id}`, projectData);
        return response.data;
    },

    // Delete project entry
    delete: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    }
};
