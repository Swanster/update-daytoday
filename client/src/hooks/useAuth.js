/**
 * useAuth - Custom hook for authentication logic
 * Handles login, logout, token persistence, and user state
 */
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ToastProvider';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    // Check for saved auth on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setToken(savedToken);
                setUser(parsedUser);
            } catch (err) {
                // Invalid saved data, clear it
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    // Login handler
    const login = useCallback((userData, authToken) => {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setToken(authToken);
        toast.success(`Welcome back, ${userData.displayName || userData.username}!`);
    }, [toast]);

    // Logout handler
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
        toast.info('You have been logged out');
    }, [toast]);

    // Check if user is admin or superuser
    const isAdminOrSuper = useCallback(() => {
        return user && (user.role === 'admin' || user.role === 'superuser');
    }, [user]);

    // Check if user is superuser
    const isSuperuser = useCallback(() => {
        return user && user.role === 'superuser';
    }, [user]);

    // Get default tab based on role
    const getDefaultTab = useCallback(() => {
        if (user?.role === 'admin' || user?.role === 'superuser') {
            return 'dashboard';
        }
        return 'project';
    }, [user]);

    return {
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        isAdminOrSuper,
        isSuperuser,
        getDefaultTab,
        login,
        logout
    };
}

export default useAuth;
