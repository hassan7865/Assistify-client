"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Notification {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  visitor_id?: string;
  visitor_name?: string;
  visitor_status?: string;
  page?: string; // To track which page the notification came from
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: number) => void;
  clearNotifications: () => void;
  clearNotificationsByType: (type: string) => void;
  clearNotificationsByVisitor: (visitorId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now() + Math.random(), // Ensure unique ID
      timestamp: new Date().toISOString(),
    };
    
    console.log('Adding notification:', newNotification);
    setNotifications(prev => {
      const updated = [...prev, newNotification];
      console.log('Updated notifications:', updated);
      return updated;
    });

    // Auto-remove after 8 seconds
    setTimeout(() => {
      console.log('Auto-removing notification:', newNotification.id);
      removeNotification(newNotification.id);
    }, 8000);
  };

  const removeNotification = (id: number) => {
    console.log('Removing notification:', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    console.log('Clearing all notifications');
    setNotifications([]);
  };

  const clearNotificationsByType = (type: string) => {
    setNotifications(prev => prev.filter(n => n.type !== type));
  };

  const clearNotificationsByVisitor = (visitorId: string) => {
    setNotifications(prev => prev.filter(n => n.visitor_id !== visitorId));
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearNotifications,
      clearNotificationsByType,
      clearNotificationsByVisitor,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
