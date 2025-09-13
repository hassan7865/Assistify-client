"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/axios';

interface User {
  user_id: string;
  email: string;
  role: string;
  client_id: string;
  name?: string;
  organization_name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (!token) {
        setIsLoading(false);
        return;
      }

      // Try to get current user info
      try {
        const response = await api.get('/auth/me');
        
        if (response.status === 200) {
          const userData = response.data;
          setUser(userData);
        } else {
          // Clear invalid tokens
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      } catch (error) {
        console.error('Failed to get user info:', error);
        // Clear invalid tokens
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.status === 200) {
        const data = response.data;
        
        // Store tokens
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        
        // Get user info
        try {
          const userResponse = await api.get('/auth/me');
          
          if (userResponse.status === 200) {
            const userData = userResponse.data;
            setUser(userData);
            return true;
          }
        } catch (error) {
          console.error('Failed to get user info after login:', error);
          // Clear tokens if user info fetch fails
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      // Don't throw the error, just return false
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      // Call logout endpoint to revoke token
      if (storedRefreshToken) {
        api.post('/auth/logout', {
          refresh_token: storedRefreshToken
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state and tokens
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      if (!storedRefreshToken) {
        return false;
      }
      
      const response = await api.post('/auth/refresh', {
        refresh_token: storedRefreshToken
      });

      if (response.status === 200) {
        const data = response.data;
        
        // Store new tokens
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        
        // Try to get updated user info with new token
        try {
          const userResponse = await api.get('/auth/me');
          
          if (userResponse.status === 200) {
            const userData = userResponse.data;
            setUser(userData);
          }
        } catch (userError) {
          console.error('Failed to get user info after token refresh:', userError);
        }
        
        return true;
      } else {
        // Refresh failed, clear tokens
        
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      return false;
    }
  };



  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
