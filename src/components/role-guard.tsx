"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { UserRoleEnum } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRoleEnum[];
  redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard' 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const hasAccess = allowedRoles.includes(user.role as UserRoleEnum);
      
      if (!hasAccess) {
        router.push(redirectTo);
      }
    }
  }, [user, isAuthenticated, isLoading, allowedRoles, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to login via ProtectedRoute
  }

  const hasAccess = allowedRoles.includes(user.role as UserRoleEnum);
  
  if (!hasAccess) {
    return null; // Will redirect to specified page
  }

  return <>{children}</>;
};

// Convenience components for common role restrictions
export const ClientAgentOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={[UserRoleEnum.CLIENT_AGENT]} redirectTo="/dashboard/history">
    {children}
  </RoleGuard>
);

export const ClientAdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={[UserRoleEnum.CLIENT_ADMIN]}>
    {children}
  </RoleGuard>
);

export const AdminOrAgent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={[UserRoleEnum.CLIENT_ADMIN, UserRoleEnum.CLIENT_AGENT]}>
    {children}
  </RoleGuard>
);

// Additional convenience components for specific use cases
export const SettingsAccess: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={[UserRoleEnum.CLIENT_ADMIN, UserRoleEnum.CLIENT_AGENT]}>
    {children}
  </RoleGuard>
);
