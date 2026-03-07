import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

interface User {
    id: number;
    username: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    // Synchronize axios defaults whenever token changes
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Axios Interceptor for 401
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    logout();
                }
                return Promise.reject(error);
            }
        );
        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    useEffect(() => {
        if (token) {
            fetchMe();
        } else {
            setIsLoading(false);
        }
    }, []); // Only on mount, if we have a token

    const fetchMe = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/me');
            setUser({ id: 0, username: res.data.username, role: res.data.role });
        } catch (err) {
            console.error('Failed to fetch user', err);
            // Interceptor handles logout if 401
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string) => {
        const res = await axios.post('http://localhost:3000/api/login', { username, password });
        const { token: newToken, user: newUser } = res.data;

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
