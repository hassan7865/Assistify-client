"use client";

import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, User, Loader2, MessageCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import HistorySidebar from './components/history-sidebar';
import { useChatHistory, ChatConversation } from './hooks/use-chat-history';
import { useAuth } from '@/contexts/auth-context';

export default function HistoryPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  
  const {
    conversations,
    loading,
    error,
    pagination,
    fetchChatHistory,
    goToPage,
    changePageSize,
  } = useChatHistory();

  const clearSearch = () => {
    setSearchQuery("");
    // Reset to first page when clearing search
    fetchChatHistory({
      page: 1,
      page_size: pagination.page_size,
    });
  };

  const handleSearch = () => {
    // Implement search functionality if needed
    // For now, just reset to first page
    fetchChatHistory({
      page: 1,
      page_size: pagination.page_size,
    });
  };

  const handleRowClick = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
  };

  const closeConversationDetails = () => {
    setSelectedConversation(null);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hrs ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} months ago`;
  };

  const getVisitorName = (conversation: ChatConversation) => {
    return conversation.metadata?.name || 
           conversation.visitor_id?.substring(0, 8) || 
           'Anonymous';
  };

  const getAgentName = (conversation: ChatConversation) => {
    if (conversation.agent_info) {
      return conversation.agent_info.name;
    }
    return conversation.agent_id ? 'Agent' : 'Unassigned';
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading chat history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Error loading chat history: {error}</p>
          <Button onClick={() => fetchChatHistory({ page: 1, page_size: 20 })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className={`flex-1 ${selectedConversation ? 'mr-96' : ''} transition-all duration-300`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Chat History</h1>
          </div>

          {/* Search and Controls */}
          <div className="flex items-center justify-end mb-4 w-full">
            {/* <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 w-64"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={clearSearch}>
                Clear search
              </Button>
            </div> */}

            <div className="flex justify-end items-center gap-4">
              <span className="text-sm text-gray-600">
                {pagination.total_count} total conversations
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={!pagination.has_prev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={!pagination.has_next}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border shadow-sm">
            {conversations.length === 0 && !loading ? (
              <div className="p-12 text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Chat History</h3>
                <p className="text-gray-500 mb-4">
                  There are no chat conversations in your history yet.
                </p>
                <p className="text-sm text-gray-400">
                  Chat history will appear here once visitors start conversations with your agents.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">Visitor</TableHead>
                    <TableHead className="font-semibold text-gray-900">Agent</TableHead>
                    <TableHead className="font-semibold text-gray-900">Time</TableHead>
                    <TableHead className="font-semibold text-gray-900">Messages</TableHead>
                    <TableHead className="font-semibold text-gray-900 w-1/2">Last Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((conversation) => (
                    <TableRow 
                      key={conversation._id} 
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedConversation?._id === conversation._id ? 'bg-teal-50' : ''
                      }`}
                      onClick={() => handleRowClick(conversation)}
                    >
                      <TableCell className="font-medium text-gray-900">
                        <div>
                          <div className="font-medium">{getVisitorName(conversation)}</div>
                          {conversation.metadata?.email && (
                            <div className="text-xs text-gray-500">{conversation.metadata.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div>
                          <div className="font-medium">{getAgentName(conversation)}</div>
                          {conversation.agent_info?.role && (
                            <div className="text-xs text-gray-500">{conversation.agent_info.role}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatTimeAgo(conversation.updated_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="rounded-full w-6 h-6 flex items-center justify-center p-0 text-xs">
                          {conversation.message_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm max-w-0">
                        <div className="truncate">
                          {conversation.last_message?.content || 'No messages'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Loading indicator for pagination */}
          {loading && conversations.length > 0 && (
            <div className="flex justify-center mt-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Conversation Details */}
      {selectedConversation && (
        <HistorySidebar 
          conversation={selectedConversation} 
          onClose={closeConversationDetails} 
        />
      )}
    </div>
  );
}