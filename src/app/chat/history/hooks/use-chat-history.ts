"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/axios';

export interface ChatConversation {
  _id: string;
  chat_session_id: string;
  client_id: string;
  visitor_id?: string;
  agent_id?: string;
  first_name?: string;
  last_name?: string;
  agent_info?: {
    name: string;
    email: string;
    role: string;
  };
  metadata: {
    name?: string;
    email?: string;
    browser?: string;
    os?: string;
    device_type?: string;
    country?: string;
    city?: string;
    timezone:string
    region?: string;
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    page_url?: string;
  };
  messages: Array<{
    sender_type: 'visitor' | 'client_agent' | 'system';
    sender_id: string;
    message: string;
    timestamp: string;
  }>;
  message_count: number;
  last_message?: {
    content: string;
    sender_type: string;
    timestamp: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ChatHistoryResponse {
  conversations: ChatConversation[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ChatHistoryFilters {
  page: number;
  page_size: number;
  agent_id?: string;
  visitor_id?: string;
  search_query?: string;
  status_filter?: string;
  date_from?: string;
  date_to?: string;
  min_message_count?: number;
}

export const useChatHistory = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });

  const fetchChatHistory = useCallback(async (filters: ChatHistoryFilters) => {
    if (!user?.client_id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        page_size: filters.page_size.toString(),
      });

      if (filters.agent_id) {
        params.append('agent_id', filters.agent_id);
      }
      if (filters.visitor_id) {
        params.append('visitor_id', filters.visitor_id);
      }
      if (filters.status_filter) {
        params.append('status_filter', filters.status_filter);
      }
      if (filters.date_from) {
        params.append('date_from', filters.date_from);
      }
      if (filters.date_to) {
        params.append('date_to', filters.date_to);
      }
        if (filters.min_message_count !== undefined) {
          params.append('min_message_count', filters.min_message_count.toString());
        }

      const response = await api.get(`/chat/history/${user.client_id}?${params}`);
      
      if (response.data.success) {
        const data: ChatHistoryResponse = response.data.data;
        setConversations(data.conversations);
        setPagination(data.pagination);
      } else {
        setError('Failed to fetch chat history');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch chat history');
    } finally {
      setLoading(false);
    }
  }, [user?.client_id]);

  const fetchConversationDetails = useCallback(async (sessionId: string) => {
    try {
      const response = await api.get(`/chat/conversation/${sessionId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to fetch conversation details');
      }
    } catch (err: any) {
      throw err;
    }
  }, []);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.total_pages) {
      fetchChatHistory({
        page,
        page_size: pagination.page_size,
      });
    }
  }, [pagination.total_pages, pagination.page_size, fetchChatHistory]);

  const changePageSize = useCallback((newPageSize: number) => {
    fetchChatHistory({
      page: 1,
      page_size: newPageSize,
    });
  }, [fetchChatHistory]);

  // Initial fetch
  useEffect(() => {
    if (user?.client_id) {
      fetchChatHistory({
        page: 1,
        page_size: 20,
      });
    }
  }, [user?.client_id, fetchChatHistory]);

  return {
    conversations,
    loading,
    error,
    pagination,
    fetchChatHistory,
    fetchConversationDetails,
    goToPage,
    changePageSize,
  };
};
