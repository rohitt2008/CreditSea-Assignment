'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, setAuthToken, clearAuthToken, saveUser, getSavedUser, getAuthToken } from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales' | 'Sanction' | 'Disbursement' | 'Collection' | 'Borrower';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role?: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = getSavedUser();
      const token = getAuthToken();

      if (savedUser && token) {
        setUser(savedUser);
      } else {
        clearAuthToken();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Watch pathname to redirect unauthenticated users
  useEffect(() => {
    if (loading) return;

    const token = getAuthToken();
    const publicPaths = ['/', '/login', '/register'];
    const isPublicPath = publicPaths.includes(pathname);

    if (!token && !isPublicPath) {
      router.push('/login');
    } else if (token && user) {
      // If logged in and trying to go to login/register, redirect them
      if (isPublicPath) {
        if (user.role === 'Borrower') {
          router.push('/portal');
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [pathname, user, loading, router]);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      setAuthToken(data.token);
      saveUser(data.user);
      setUser(data.user);

      if (data.user.role === 'Borrower') {
        router.push('/portal');
      } else {
        router.push('/dashboard');
      }

      return data.user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role = 'Borrower'): Promise<User> => {
    setLoading(true);
    try {
      const data = await api.post('/auth/register', { name, email, password, role });
      setAuthToken(data.token);
      saveUser(data.user);
      setUser(data.user);

      if (data.user.role === 'Borrower') {
        router.push('/portal');
      } else {
        router.push('/dashboard');
      }

      return data.user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
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
