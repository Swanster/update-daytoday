const API_BASE = '/api/categories';

export const categoriesApi = {
    // Get all active categories
    getAll: async () => {
        const token = localStorage.getItem('token');
        const response = await fetch(API_BASE, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
    },

    // Create a new category (superuser only)
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
            throw new Error(error.message || 'Failed to create category');
        }
        return response.json();
    },

    // Update a category (superuser only)
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
            throw new Error(error.message || 'Failed to update category');
        }
        return response.json();
    },

    // Delete a category (superuser only)
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
            throw new Error(error.message || 'Failed to delete category');
        }
        return response.json();
    },

    // Reorder categories (superuser only)
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
            throw new Error(error.message || 'Failed to reorder categories');
        }
        return response.json();
    }
};
