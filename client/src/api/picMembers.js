const API_BASE = '/api/pic-members';

export const picMembersApi = {
    // Get all active PIC members
    getAll: async () => {
        const token = localStorage.getItem('token');
        const response = await fetch(API_BASE, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch PIC members');
        return response.json();
    },

    // Create a new PIC member (superuser only)
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
            throw new Error(error.message || 'Failed to create PIC member');
        }
        return response.json();
    },

    // Update a PIC member (superuser only)
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
            throw new Error(error.message || 'Failed to update PIC member');
        }
        return response.json();
    },

    // Delete a PIC member (superuser only)
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
            throw new Error(error.message || 'Failed to delete PIC member');
        }
        return response.json();
    },

    // Reorder PIC members (superuser only)
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
            throw new Error(error.message || 'Failed to reorder PIC members');
        }
        return response.json();
    }
};
