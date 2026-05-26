import React, { createContext, useState, useEffect } from 'react';
import API from '../api/api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync session on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          
          // Verify & fetch fresh profile from database
          const res = await API.get('/users/profile');
          if (res.data.success) {
            const freshUser = res.data.data.user;
            // Retain token
            freshUser.token = token;
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        } catch (err) {
          console.error('Session sync failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check credentials.'
      };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const res = await API.post('/auth/register', { name, email, password, role });
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await API.post('/auth/forgot-password', { email });
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to request reset.'
      };
    }
  };

  const updateProfile = async (name, avatar, sponsorDetails) => {
    try {
      const res = await API.put('/users/profile', { name, avatar, sponsorDetails });
      if (res.data.success) {
        const updatedUser = res.data.data.user;
        const currentToken = localStorage.getItem('token');
        updatedUser.token = currentToken;
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true, sponsorProfile: res.data.data.sponsorProfile };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update profile.'
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        updateProfile,
        isAuthenticated: !!user,
        role: user?.role || null
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
