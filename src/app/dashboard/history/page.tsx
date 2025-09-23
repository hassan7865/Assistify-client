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
  const [isClosing, setIsClosing] = useState(false);
  
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
    if (selectedConversation?._id === conversation._id) {
      // If clicking the same row, close the sidebar
      setIsClosing(true);
      setTimeout(() => {
        setSelectedConversation(null);
        setIsClosing(false);
      }, 300);
      return;
    }
    
    if (selectedConversation) {
      // If switching between conversations, close current then open new
      setIsClosing(true);
      setTimeout(() => {
        setSelectedConversation(conversation);
        setIsClosing(false);
      }, 300);
    } else {
      // If opening for first time, just set the conversation
      setSelectedConversation(conversation);
    }
  };

  const closeConversationDetails = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedConversation(null);
      setIsClosing(false);
    }, 300);
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
    <div className="flex h-screen bg-white">
      {/* Main Content */}
      <div className={`flex-1 ${selectedConversation ? 'mr-96' : ''} transition-all duration-300`}>
        <div className="p-4">

          {/* Search and Controls */}
          <div className="flex items-center justify-between mb-3 w-full">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-7 w-48 h-8 text-sm border-gray-300"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
                  >
                    ×
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={clearSearch} className="border-gray-300 h-8 px-3 text-xs">
                Clear search
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600">
                0 unread
              </span>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={!pagination.has_prev}
                  className="border border-gray-300 h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-xs text-gray-600">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={!pagination.has_next}
                  className="border border-gray-300 h-7 w-7 p-0"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200">
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
                  <TableRow className="border-b border-gray-200">
                  
                    <TableHead className="font-medium text-gray-900 py-2 px-3 text-xs">Name</TableHead>
                    <TableHead className="font-medium text-gray-900 py-2 px-3 text-sm">Agent</TableHead>
                    <TableHead className="font-medium text-gray-900 py-2 px-3 text-sm">Time</TableHead>
                    <TableHead className="font-medium text-gray-900 py-2 px-3 text-sm">Rating</TableHead>
                    <TableHead className="font-medium text-gray-900 py-2 px-3 text-sm">Messages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((conversation, index) => (
                    <TableRow 
                      key={conversation._id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                        selectedConversation?._id === conversation._id ? 'bg-blue-50 border-blue-200 shadow-sm' : ''
                      }`}
                      onClick={() => handleRowClick(conversation)}
                    >
                      <TableCell className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <input type="checkbox" className="rounded border-gray-300 w-3 h-3" />
                          <span className="text-gray-600 text-xs">{getVisitorName(conversation)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <span className="text-gray-600 text-xs">{getAgentName(conversation)}</span>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <span className="text-gray-600 text-xs">{formatTimeAgo(conversation.updated_at)}</span>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <span className="text-gray-600 text-xs">-</span>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="rounded-full w-5 h-5 flex items-center justify-center p-0 text-xs bg-gray-100 text-gray-700">
                            {conversation.message_count}
                          </Badge>
                          <span className="text-gray-600 text-xs truncate max-w-xs">
                            {conversation.last_message?.content || 'No messages'}
                          </span>
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
      <div className={`fixed right-0 top-0 h-screen w-[420px] bg-white border-l border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
        selectedConversation && !isClosing ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {selectedConversation && (
          <HistorySidebar 
            conversation={selectedConversation} 
            onClose={closeConversationDetails}
            isClosing={isClosing}
          />
        )}
      </div>
    </div>
  );
}