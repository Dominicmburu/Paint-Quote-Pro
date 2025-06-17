import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  console.log('🔍 AuthProvider: Initializing state', { user, company, loading, isAuthenticated });

  useEffect(() => {
    console.log('🔍 AuthProvider: Initializing...');
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    console.log('📋 Initial token check:', {
      hasAccessToken: !!token,
      hasRefreshToken: !!refreshToken
    });
    
    if (token) {
      console.log('✅ Token found, fetching current user...');
      fetchCurrentUser();
    } else {
      console.log('❌ No token found');
      setLoading(false);
    }

    // Listen for logout events from the API interceptor
    const handleLogout = (event) => {
      console.log('🚪 Received logout event:', event.detail);
      logout();
    };

    window.addEventListener('auth:logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const fetchCurrentUser = async () => {
    console.log('🚀 Fetching current user...');
    try {
      const response = await api.get('/auth/me');
      console.log('✅ Current user fetched successfully:', response.data);
      
      setUser(response.data.user);
      setCompany(response.data.company);
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('❌ Failed to fetch current user:', error);
      
      // Check if it's a 401 (invalid token) vs network error
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('🔐 Authentication failed - clearing local auth state');
        // Clear local state but don't remove tokens yet - 
        // let user try to login again
        setUser(null);
        setCompany(null);
        setIsAuthenticated(false);
      } else {
        console.log('🌐 Network/server error - keeping tokens');
        // For network errors, keep tokens but set as unauthenticated
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('🔐 Attempting login for:', email);
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('✅ Login response received');
      
      const { user, company, access_token, refresh_token } = response.data;
      
      // Store tokens first
      console.log('💾 Storing tokens...');
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      // Then update state
      setUser(user);
      setCompany(company);
      setIsAuthenticated(true);
      
      console.log('🎉 Login successful');
      
      return { success: true, user, company };
    } catch (error) {
      console.error('❌ Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    console.log('📝 Attempting registration for:', userData.email);
    try {
      const response = await api.post('/auth/register', userData);
      console.log('✅ Registration response received');
      
      const { user, company, access_token, refresh_token } = response.data;
      
      // Store tokens first
      console.log('💾 Storing tokens...');
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      // Then update state
      setUser(user);
      setCompany(company);
      setIsAuthenticated(true);
      
      console.log('🎉 Registration successful');
      
      return { success: true, user, company };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setCompany(null);
    setIsAuthenticated(false);
    console.log('✅ Logout complete');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const updateCompany = (updatedCompany) => {
    setCompany(updatedCompany);
  };

  const value = {
    user,
    company,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    updateCompany,
    fetchCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
