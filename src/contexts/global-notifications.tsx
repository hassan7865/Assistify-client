"use client";

import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';

export interface GlobalNotification {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  visitor_id?: string;
  visitor_name?: string;
  visitor_status?: string;
}

interface GlobalNotificationContextType {
  notifications: GlobalNotification[];
  addNotification: (notification: Omit<GlobalNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: number) => void;
  removeNotificationsByVisitorId: (visitorId: string) => void;
  clearNotifications: () => void;
}

const GlobalNotificationContext = createContext<GlobalNotificationContextType | undefined>(undefined);

export const useGlobalNotifications = () => {
  const context = useContext(GlobalNotificationContext);
  if (context === undefined) {
    throw new Error('useGlobalNotifications must be used within a GlobalNotificationProvider');
  }
  return context;
};

interface GlobalNotificationProviderProps {
  children: ReactNode;
}

// Global notification deduplication system
class GlobalNotificationDeduplication {
  private notificationHistory = new Map<string, {
    timestamp: number;
    count: number;
    lastId: number;
  }>();

  private readonly DEDUP_WINDOW = 10000; // 10 seconds
  private readonly MAX_DUPLICATES = 2;

  private createNotificationKey(type: string, visitorId?: string, message?: string): string {
    // Create a comprehensive key for deduplication
    const cleanMessage = message ? message.replace(/\s+/g, '').toLowerCase() : '';
    return `${type}_${visitorId || 'global'}_${cleanMessage}`;
  }

  shouldAllowNotification(notification: Omit<GlobalNotification, 'id' | 'timestamp'>): { allowed: boolean; reason?: string } {
    const currentTime = Date.now();
    const key = this.createNotificationKey(notification.type, notification.visitor_id, notification.message);
    
    const existing = this.notificationHistory.get(key);
    
    if (existing && currentTime - existing.timestamp < this.DEDUP_WINDOW) {
      existing.count++;
      existing.timestamp = currentTime;
      
      if (existing.count > this.MAX_DUPLICATES) {
        console.log(`Blocked duplicate global notification: ${key} (count: ${existing.count})`);
        return { allowed: false, reason: 'too_many_duplicates' };
      }
    } else {
      this.notificationHistory.set(key, {
        timestamp: currentTime,
        count: 1,
        lastId: 0
      });
    }

    return { allowed: true };
  }

  trackNotification(notification: GlobalNotification): void {
    const key = this.createNotificationKey(notification.type, notification.visitor_id, notification.message);
    const existing = this.notificationHistory.get(key);
    
    if (existing) {
      existing.lastId = notification.id;
    }
  }

  cleanupExpired(): void {
    const currentTime = Date.now();
    const expiredKeys: string[] = [];
    
    this.notificationHistory.forEach((value, key) => {
      if (currentTime - value.timestamp > this.DEDUP_WINDOW * 2) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.notificationHistory.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired global notification entries`);
    }
  }

  clear(): void {
    this.notificationHistory.clear();
  }

  getStats() {
    return {
      trackedNotifications: this.notificationHistory.size
    };
  }
}

export const GlobalNotificationProvider: React.FC<GlobalNotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<GlobalNotification[]>([]);
  const deduplicator = useRef(new GlobalNotificationDeduplication());

  // Cleanup interval
  React.useEffect(() => {
    const interval = setInterval(() => {
      deduplicator.current.cleanupExpired();
    }, 30000); // Cleanup every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const addNotification = (notification: Omit<GlobalNotification, 'id' | 'timestamp'>) => {
    // Check deduplication before adding
    const checkResult = deduplicator.current.shouldAllowNotification(notification);
    
    if (!checkResult.allowed) {
      console.log(`Blocked duplicate global notification: ${notification.type} for visitor ${notification.visitor_id} - Reason: ${checkResult.reason}`);
      return;
    }

    const newNotification: GlobalNotification = {
      ...notification,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
    };
    
    // Track this notification
    deduplicator.current.trackNotification(newNotification);
    
    console.log('Global notification added:', newNotification);
    setNotifications(prev => {
      const updated = [...prev, newNotification];
      console.log('Global notifications updated:', updated);
      return updated;
    });

    // Auto-remove with type-specific timing
    const autoRemoveDelay = notification.type === 'success' ? 3000 : notification.type === 'error' ? 7000 : 8000;
    setTimeout(() => {
      console.log('Auto-removing global notification:', newNotification.id);
      removeNotification(newNotification.id);
    }, autoRemoveDelay);
  };

  const removeNotification = (id: number) => {
    console.log('Removing global notification:', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const removeNotificationsByVisitorId = (visitorId: string) => {
    setNotifications(prev => prev.filter(n => n.visitor_id !== visitorId));
  };

  const clearNotifications = () => {
    console.log('Clearing all global notifications');
    setNotifications([]);
    deduplicator.current.clear();
  };

  return (
    <GlobalNotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      removeNotificationsByVisitorId,
      clearNotifications,
    }}>
      {children}
    </GlobalNotificationContext.Provider>
  );
};
