"use client";

import React, { useEffect, useState } from 'react';
import { FiX, FiUser, FiCheck, FiClock } from 'react-icons/fi';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  onTakeVisitor?: (visitorId: string) => void;
}

const VisitorNotifications: React.FC<VisitorNotificationsProps> = ({
  notifications,
  onClearNotifications,
  onTakeVisitor
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
  const [progressStates, setProgressStates] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    if (notifications.length > 0) {
      // Add new notifications with animation
      const newNotification = notifications[notifications.length - 1];
      setVisibleNotifications(prev => [...prev, newNotification]);
      
      // Initialize progress bar for new notification
      setProgressStates(prev => ({ ...prev, [newNotification.id]: 100 }));
      
      // Auto-remove after 8 seconds
      setTimeout(() => {
        setVisibleNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        setProgressStates(prev => {
          const newState = { ...prev };
          delete newState[newNotification.id];
          return newState;
        });
      }, 8000);
    }
  }, [notifications]);

  // Progress bar animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressStates(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(id => {
          if (newState[Number(id)] > 0) {
            newState[Number(id)] = Math.max(0, newState[Number(id)] - 1.25); // 100% / 8 seconds = 1.25% per 100ms
          }
        });
        return newState;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const removeNotification = (id: number) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
    setProgressStates(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

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
        return <FiUser className="w-5 h-5 text-blue-600" />;
      case 'success':
        return <FiCheck className="w-5 h-5 text-green-600" />;
      default:
        return <FiClock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_visitor':
        return 'border-blue-200 bg-blue-50/80 backdrop-blur-sm';
      case 'success':
        return 'border-green-200 bg-green-50/80 backdrop-blur-sm';
      default:
        return 'border-border bg-muted/80 backdrop-blur-sm';
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
          className={cn(
            "transform transition-all duration-500 ease-out",
            "border rounded-lg shadow-lg p-4",
            "slide-in-from-right-full",
            getNotificationColor(notification.type),
            index === 0 ? "scale-100" : "scale-95 opacity-90"
          )}
          style={{
            animationDelay: `${index * 100}ms`,
            animationFillMode: 'both'
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {getNotificationIcon(notification.type)}
              <div>
                <h4 className="font-semibold text-sm text-foreground">
                  {getNotificationTitle(notification.type)}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeNotification(notification.id)}
              className="h-6 w-6 p-0 hover:bg-muted rounded-full transition-colors"
            >
              <FiX className="w-3 h-3" />
            </Button>
          </div>

          {/* Message */}
          <p className="text-sm text-foreground mb-3">
            {notification.message}
          </p>

          {/* Visitor Info & Actions */}
          {notification.visitor_id && (
            <div className="bg-card rounded-md p-3 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-foreground">
                    Visitor {notification.visitor_id.substring(0, 8)}...
                  </span>
                  {notification.visitor_name && (
                    <Badge variant="outline" className="text-xs">
                      {notification.visitor_name}
                    </Badge>
                  )}
                </div>
                {notification.visitor_status && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs",
                      notification.visitor_status === 'new' 
                        ? "bg-yellow-100 text-yellow-800" 
                        : "bg-blue-100 text-blue-800"
                    )}
                  >
                    {notification.visitor_status}
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              {notification.type === 'new_visitor' && onTakeVisitor && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleTakeVisitor(notification.visitor_id!)}
                    className="text-xs px-3 py-1 h-7"
                  >
                    <FiCheck className="w-3 h-3 mr-1" />
                    Pick Visitor
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeNotification(notification.id)}
                    className="text-xs px-3 py-1 h-7"
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-100 ease-linear"
                style={{ 
                  width: `${progressStates[notification.id] || 100}%`,
                  transition: 'width 0.1s linear'
                }}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Clear All Button */}
      {visibleNotifications.length > 1 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearNotifications}
            className={cn(
              "text-xs text-muted-foreground hover:text-foreground",
              "bg-background/80 backdrop-blur-sm border border-border",
              "rounded-full px-4 py-2 transition-all duration-200 hover:bg-background"
            )}
          >
            Clear All ({visibleNotifications.length})
          </Button>
        </div>
      )}
    </div>
  );
};

export default VisitorNotifications;
