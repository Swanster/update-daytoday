import api from './axiosConfig';

const API_URL = '/api/uploads';

export const uploadsApi = {
    // Upload a single file
    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(API_URL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Upload multiple files
    uploadFiles: async (files) => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        const response = await api.post(`${API_URL}/multiple`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Delete a file
    deleteFile: async (filename) => {
        const response = await api.delete(`${API_URL}/${filename}`);
        return response.data;
    },

    // Get file URL
    getFileUrl: (filename) => {
        // In development, use the backend URL
        // In production, this will be served by nginx
        return `/uploads/${filename}`;
    }
};
