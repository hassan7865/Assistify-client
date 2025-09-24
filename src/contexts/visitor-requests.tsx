"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/auth-context';

export interface VisitorRequest {
  visitor_id: string;
  metadata?: {
    name?: string;
    email?: string;
    ip_address?: string;
    country?: string;
    city?: string;
    region?: string;
    timezone?: string;
    user_agent?: string;
    referrer?: string;
    page_url?: string;
    device_type?: string;
    browser?: string;
    os?: string;
  };
  timestamp: string;
  status: 'pending' | 'served';
}

interface VisitorRequestsContextType {
  requests: VisitorRequest[];
  isLoading: boolean;
  addRequest: (request: Omit<VisitorRequest, 'timestamp' | 'status'>) => void;
  removeRequest: (visitorId: string) => void;
  serveRequest: () => VisitorRequest | null;
  clearRequests: () => void;
  getRequestCount: () => number;
}

const VisitorRequestsContext = createContext<VisitorRequestsContextType | undefined>(undefined);

export const useVisitorRequests = () => {
  const context = useContext(VisitorRequestsContext);
  if (context === undefined) {
    throw new Error('useVisitorRequests must be used within a VisitorRequestsProvider');
  }
  return context;
};

interface VisitorRequestsProviderProps {
  children: ReactNode;
}

export const VisitorRequestsProvider: React.FC<VisitorRequestsProviderProps> = ({ children }) => {
  const [requests, setRequests] = useState<VisitorRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch existing visitor requests when component mounts
  useEffect(() => {
    const fetchExistingRequests = async () => {
      if (!user?.client_id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get(`/chat/pending-visitors/${user.client_id}`);
        if (response.data && response.data.visitors) {
          const existingRequests: VisitorRequest[] = response.data.visitors.map((visitor: any) => ({
            visitor_id: visitor.visitor_id,
            metadata: visitor.metadata,
            timestamp: new Date().toISOString(),
            status: 'pending' as const
          }));
          setRequests(existingRequests);
        }
      } catch (error) {
        // Handle error silently - requests will be empty
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingRequests();
  }, [user?.client_id]);

  const addRequest = (request: Omit<VisitorRequest, 'timestamp' | 'status'>) => {
    // Check if request already exists
    const exists = requests.some(r => r.visitor_id === request.visitor_id);
    if (exists) return;

    const newRequest: VisitorRequest = {
      ...request,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    setRequests(prev => [...prev, newRequest]);
  };

  const removeRequest = (visitorId: string) => {
    setRequests(prev => prev.filter(r => r.visitor_id !== visitorId));
  };

  const serveRequest = (): VisitorRequest | null => {
    const pendingRequests = requests.filter(r => r.status === 'pending');
    if (pendingRequests.length === 0) return null;

    // Get the first pending request
    const requestToServe = pendingRequests[0];
    
    // Mark as served and remove from requests
    setRequests(prev => prev.filter(r => r.visitor_id !== requestToServe.visitor_id));
    
    return requestToServe;
  };

  const clearRequests = () => {
    setRequests([]);
  };

  const getRequestCount = () => {
    return requests.filter(r => r.status === 'pending').length;
  };

  return (
    <VisitorRequestsContext.Provider value={{
      requests,
      isLoading,
      addRequest,
      removeRequest,
      serveRequest,
      clearRequests,
      getRequestCount
    }}>
      {children}
    </VisitorRequestsContext.Provider>
  );
};
