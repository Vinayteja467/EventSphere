import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.js';
import API from '../api/api.js';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]); // Real-time sliding toasts stack (max 3)

  // Fetch initial paginated notifications history from database
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const response = await API.get('/notifications?page=1&limit=20');
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        // Calculate unread count
        const unread = response.data.data.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to load notification history:', error);
    }
  }, [user]);

  // Clean trigger for adding a visual toast popup (limit stack to 3)
  const addToast = useCallback((notification) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => {
      const updated = [...prev, { id, ...notification }];
      return updated.slice(-3); // Retain max 3 toasts
    });

    // Dismiss toast automatically after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // API operations exposed to children components
  const markAsRead = async (id) => {
    try {
      const response = await API.patch(`/notifications/${id}/read`);
      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await API.patch('/notifications/read-all');
      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const response = await API.delete('/notifications/clear');
      if (response.data.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  // Socket Connection Lifecycle hook
  useEffect(() => {
    if (!user) {
      // Disconnect socket on logout
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
      setToasts([]);
      return;
    }

    // Initialize socket connection to backend
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const socketUrl = isLocalhost 
      ? 'http://localhost:5000' 
      : 'https://eventsphere-backend-auur.onrender.com';
      
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Real-time Socket connection established in client context.');
      // Register user in private room
      newSocket.emit('join_user', user._id);
    });

    // Capture incoming real-time notifications
    newSocket.on('notification', (newNotif) => {
      console.log('Real-time Notification packet received:', newNotif);
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Trigger floating UI toast
      addToast(newNotif);
      
      // Dynamic bell audio/vibration feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    });

    setSocket(newSocket);
    fetchNotifications();

    return () => {
      newSocket.disconnect();
    };
  }, [user, fetchNotifications, addToast]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        toasts,
        dismissToast,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be executed within a SocketProvider wrapper.');
  }
  return context;
};
