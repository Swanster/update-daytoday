const API_BASE = '/api/case-types';

export const caseTypesApi = {
    // Get all active case types
    getAll: async () => {
        const token = localStorage.getItem('token');
        const response = await fetch(API_BASE, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch case types');
        return response.json();
    },

    // Create a new case type (superuser/admin only)
    create: async (name, order) => {
        const token = localStorage.getItem('token');
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, order })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create case type');
        }
        return response.json();
    },

    // Update a case type (superuser/admin only)
    update: async (id, data) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update case type');
        }
        return response.json();
    },

    // Delete a case type (superuser/admin only)
    delete: async (id) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete case type');
        }
        return response.json();
    },

    // Reorder case types (superuser/admin only)
    reorder: async (orderedIds) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/reorder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderedIds })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to reorder case types');
        }
        return response.json();
    }
};
