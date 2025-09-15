"use client";

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, MessageCircle, X } from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  visitor_id?: string;
  visitor_name?: string;
  visitor_status?: string;
}

interface VisitorNotificationsProps {
  notifications: Notification[];
  onClearNotifications: () => void;
  onTakeVisitor: (visitorId: string) => void;
  onRemoveNotification: (id: number) => void;
}

const VisitorNotifications: React.FC<VisitorNotificationsProps> = ({
  notifications,
  onClearNotifications,
  onTakeVisitor,
  onRemoveNotification
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
  const [progressStates, setProgressStates] = useState<{ [key: number]: number }>({});

  // Handle notifications sync (both adding and removing)
  useEffect(() => {
    // Sync visible notifications with global notifications state
    setVisibleNotifications(prev => {
      // Find notifications to add
      const newNotifications = notifications.filter(
        notification => !prev.some(visible => visible.id === notification.id)
      );
      
      // Find notifications to remove
      const removedNotificationIds = prev
        .filter(visible => !notifications.some(notification => notification.id === visible.id))
        .map(n => n.id);
      
      // Remove notifications that are no longer in the global state
      let updated = prev.filter(visible => !removedNotificationIds.includes(visible.id));
      
      // Add new notifications
      if (newNotifications.length > 0) {
        updated = [...updated, ...newNotifications];
      }
      
      return updated;
    });
    
    // Initialize progress states for new notifications
    setProgressStates(prev => {
      const newState = { ...prev };
      notifications.forEach(notification => {
        if (!(notification.id in newState)) {
          newState[notification.id] = 100;
        }
      });
      
      // Clean up progress states for removed notifications
      Object.keys(newState).forEach(id => {
        if (!notifications.some(n => n.id === Number(id))) {
          delete newState[Number(id)];
        }
      });
      
      return newState;
    });
  }, [notifications]);

  // Progress bar animation effect
  useEffect(() => {
    if (visibleNotifications.length === 0) return;

    const interval = setInterval(() => {
      setProgressStates(prev => {
        const newState = { ...prev };
        let hasChanges = false;

        Object.keys(newState).forEach(id => {
          const numId = Number(id);
          if (newState[numId] > 0) {
            // Find the notification to determine its type and timing
            const notification = visibleNotifications.find(n => n.id === numId);
            if (notification) {
              const isSuccess = notification.type === 'success';
              const decrementAmount = isSuccess ? 3.33 : 1.25;
              
              const newProgress = Math.max(0, newState[numId] - decrementAmount);
              if (newProgress !== newState[numId]) {
                newState[numId] = newProgress;
                hasChanges = true;
              }
            }
          }
        });

        return hasChanges ? newState : prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [visibleNotifications]);

  // Auto-remove notifications when progress reaches 0
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    Object.entries(progressStates).forEach(([id, progress]) => {
      if (progress <= 0) {
        const timeout = setTimeout(() => {
          removeNotification(Number(id));
        }, 100);
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [progressStates]);

  const removeNotification = React.useCallback((id: number) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
    setProgressStates(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
    // Call the parent's onRemoveNotification if provided
    if (onRemoveNotification) {
      onRemoveNotification(id);
    }
  }, [onRemoveNotification]);

  const handleTakeVisitor = (visitorId: string) => {
    if (onTakeVisitor) {
      // Remove the notification immediately to prevent duplicates
      const notification = visibleNotifications.find(n => n.visitor_id === visitorId);
      if (notification) {
        removeNotification(notification.id);
      }
      onTakeVisitor(visitorId);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_visitor':
        return <Bell className="w-4 h-4 text-teal-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_visitor':
        return 'border-teal-200 bg-teal-50/80 backdrop-blur-sm';
      case 'success':
        return 'border-green-200 bg-green-50/80 backdrop-blur-sm';
      default:
        return 'border-gray-200 bg-gray-50/80 backdrop-blur-sm';
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'new_visitor':
        return 'New Visitor';
      case 'success':
        return 'Success';
      default:
        return 'Notification';
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`transform transition-all duration-500 ease-out border rounded-lg shadow-lg p-4 translate-x-0 opacity-100 overflow-hidden ${getNotificationColor(notification.type)} ${
            index === 0 ? "scale-100" : "scale-95 opacity-90"
          }`}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm text-gray-900 truncate">
                  {getNotificationTitle(notification.type)}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 h-6 w-6 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Close notification"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-800 mb-3 break-words leading-relaxed">
            {notification.message}
          </p>

          {/* Visitor Info & Actions */}
          {notification.visitor_id && (
            <div className="bg-white/60 rounded-md p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs font-medium text-gray-700 truncate">
                    Visitor {notification.visitor_id.substring(0, 8)}...
                  </span>
                  {notification.visitor_name && (
                    <div className="inline-flex items-center px-2 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs font-medium text-gray-700 max-w-[100px] flex-shrink-0">
                      <span className="truncate block">
                        {notification.visitor_name}
                      </span>
                    </div>
                  )}
                </div>
                {notification.visitor_status && (
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 max-w-[80px] ${
                    notification.visitor_status === 'new' 
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200" 
                      : "bg-teal-100 text-teal-800 border border-teal-200"
                  }`}>
                    <span className="truncate block">
                      {notification.visitor_status}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {notification.type === 'new_visitor' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTakeVisitor(notification.visitor_id!)}
                    className="flex items-center justify-center text-xs px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium flex-1 min-w-0"
                  >
                    <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Pick Visitor</span>
                  </button>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="flex items-center justify-center text-xs px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors border border-gray-300 font-medium flex-shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-teal-600 h-1 rounded-full transition-all duration-100 ease-linear"
                style={{ 
                  width: `${progressStates[notification.id] || 100}%`
                }}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Clear All Button */}
      {visibleNotifications.length > 1 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onClearNotifications}
            className="text-xs text-gray-600 hover:text-gray-800 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-full px-4 py-2 transition-all duration-200 hover:bg-white shadow-sm font-medium"
          >
            Clear All ({visibleNotifications.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default VisitorNotifications;