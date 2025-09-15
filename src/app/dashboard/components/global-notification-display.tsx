"use client";

import React from 'react';
import { useGlobalNotifications } from '@/contexts/global-notifications';
import { useVisitorActions } from '@/contexts/visitor-actions';
import { useAuth } from '@/contexts/auth-context';
import { UserRoleEnum } from '@/lib/constants';
import VisitorNotifications from '../visitors/components/visitor-notifications';

const GlobalNotificationDisplay: React.FC = () => {
  const { user } = useAuth();
  const { notifications, clearNotifications, removeNotification } = useGlobalNotifications();
  const { takeVisitor } = useVisitorActions();

  const handleTakeVisitor = (visitorId: string) => {
    takeVisitor(visitorId);
  };

  // Only show visitor notifications for client agents
  if (!user || user.role !== UserRoleEnum.CLIENT_AGENT) {
    return null;
  }

  return (
    <div className="flex-shrink-0">
      <VisitorNotifications
        notifications={notifications}
        onClearNotifications={clearNotifications}
        onTakeVisitor={handleTakeVisitor}
        onRemoveNotification={removeNotification}
      />
    </div>
  );
};

export default GlobalNotificationDisplay;

