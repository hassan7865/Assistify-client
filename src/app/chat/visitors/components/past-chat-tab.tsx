"use client";

import React, { useState, useEffect } from 'react';

interface Visitor {
  visitor_id: string;
  metadata?: {
    ip_address?: string;
  };
  visitor_chat_count?: number;
}

interface ChatHistoryRecord {
  session_id: string;
  agent_name?: string;
  agent_id?: string;
  started_at: string;
  ended_at?: string;
  message_count: number;
  ip_address?: string;
  first_message?: string;
  last_message?: string;
  satisfaction?: number;
}

interface PastChatTabProps {
  visitor: Visitor;
}

const PastChatTab: React.FC<PastChatTabProps> = ({ visitor }) => {
  const [chatHistory, setChatHistory] = useState<ChatHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatHistoryRecord | null>(null);

  // Fetch chat history for this visitor - using demo data for now
  const fetchChatHistory = async () => {
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      // Demo data
      const demoChatHistory: ChatHistoryRecord[] = [
        {
          session_id: 'session-001',
          agent_name: 'John Smith',
          agent_id: 'agent-001',
          started_at: '2024-01-15T10:30:00Z',
          ended_at: '2024-01-15T11:15:00Z',
          message_count: 12,
          ip_address: visitor.metadata?.ip_address,
          first_message: 'Hello, I need help with my order',
          last_message: 'Thank you for your assistance!',
          satisfaction: 4
        },
        {
          session_id: 'session-002',
          agent_name: 'Sarah Johnson',
          agent_id: 'agent-002',
          started_at: '2024-01-14T14:20:00Z',
          ended_at: '2024-01-14T15:05:00Z',
          message_count: 8,
          ip_address: visitor.metadata?.ip_address,
          first_message: 'Hi, I have a question about billing',
          last_message: 'Perfect, that resolves my issue',
          satisfaction: 5
        },
        {
          session_id: 'session-003',
          agent_name: 'Mike Davis',
          agent_id: 'agent-003',
          started_at: '2024-01-13T09:45:00Z',
          ended_at: '2024-01-13T10:20:00Z',
          message_count: 15,
          ip_address: visitor.metadata?.ip_address,
          first_message: 'Good morning, I need technical support',
          last_message: 'Great, that fixed the problem',
          satisfaction: 3
        }
      ];
      
      setChatHistory(demoChatHistory);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchChatHistory();
  }, [visitor.visitor_id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const getSatisfactionDisplay = (satisfaction?: number) => {
    return '—';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading chat history...</div>
        </div>
      ) : chatHistory.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="text-lg mb-2">📝</div>
            <div>No past chats found</div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Chat History Table */}
          <div className={`${selectedChat ? 'flex-[1]' : 'flex-1'} min-h-0 overflow-hidden`}>
            <div className="h-full overflow-auto">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-xs font-semibold text-gray-700 w-32">Agent</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-700 w-20">Satisfaction</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-700 w-24">Time</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-700 w-96">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {chatHistory.map((chat) => (
                    <tr 
                      key={chat.session_id}
                      className={`cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                        selectedChat?.session_id === chat.session_id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <td className="p-3 text-sm font-medium">
                        {chat.agent_name || '—'}
                      </td>
                      <td className="p-3 text-sm">
                        <span className="text-gray-500">
                          {getSatisfactionDisplay(chat.satisfaction)}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {formatDate(chat.started_at)}
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {chat.message_count}
                          </span>
                          <span className="truncate">
                            {chat.last_message || chat.first_message || 'No messages'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Selected Chat Messages */}
          {selectedChat && (
            <div className="flex-1 bg-gray-50 border-t border-gray-200 overflow-y-auto">
              <div className="p-4 space-y-2">
                {/* Demo messages for selected chat */}
                {[
                  { sender: 'system', message: `${selectedChat.agent_name || 'Test'} has joined.`, time: '12:03 AM' },
                  { sender: 'agent', message: `${selectedChat.agent_name || 'Arthur'} has joined.`, time: '12:03 AM' },
                  { sender: 'visitor', message: 'hi', time: '12:03 AM', name: 'Test' },
                  { sender: 'agent', message: 'hi', time: '12:03 AM', name: selectedChat.agent_name || 'Arthur' }
                ].map((msg, index) => (
                  <div key={index} className="flex flex-col">
                    {index > 0 && (
                      <div className="border-b border-gray-400 border-dashed my-2"></div>
                    )}
                    
                    {msg.sender === 'system' ? (
                      <div className="flex justify-center items-center">
                        <div className="text-xs text-gray-500 italic">
                          {msg.message}
                        </div>
                        <div className="text-xs text-gray-400 ml-2">
                          {msg.time}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className="max-w-xs">
                          <div className="text-sm font-bold text-blue-600 mb-1">
                            {msg.name}
                          </div>
                          <div className="text-sm text-gray-900">
                            {msg.message}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {msg.time}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PastChatTab;