"use client";

import React from 'react';
import { ChatConversation } from '../hooks/use-chat-history';

interface HistoryChatInterfaceProps {
  conversation: ChatConversation;
  selectedAgent?: {
    id: string;
    name: string;
  };
}

const HistoryChatInterface: React.FC<HistoryChatInterfaceProps> = ({ 
  conversation,
  selectedAgent
}) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      
      {/* Chat Messages Area */}
      <div className="bg-white shadow-sm flex-[3] min-h-0 overflow-hidden flex flex-col mt-2">
        
        {/* Messages Container */}
        <div className="flex-1 bg-gray-50 relative min-h-0">
          <div className="h-full p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {conversation.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                {/* Empty state - no content to avoid unnecessary scrollbars */}
              </div>
            ) : (
              conversation.messages.map((message, index: number) => {
                const isConsecutiveFromSameSender = index > 0 && 
                  conversation.messages[index - 1].sender_type === message.sender_type &&
                  conversation.messages[index - 1].sender_type !== 'system' && // Exclude system messages
                  new Date(message.timestamp).getTime() - new Date(conversation.messages[index - 1].timestamp).getTime() < 30000;
                
                const isLastMessage = index === conversation.messages.length - 1;
                const nextMessage = !isLastMessage ? conversation.messages[index + 1] : null;
                const isLastInGroup = isLastMessage || 
                  (nextMessage && nextMessage.sender_type !== message.sender_type) ||
                  (nextMessage && new Date(nextMessage.timestamp).getTime() - new Date(message.timestamp).getTime() >= 30000);
                
                // Check if this is a system message
                const isSystemMessage = message.sender_type === 'system';
                
                return (
                  <div key={`${message.sender_id}-${index}`} className="flex flex-col">
                    {/* Add separator line for non-consecutive messages */}
                    {!isConsecutiveFromSameSender && index > 0 && !isSystemMessage && (
                      <div className="border-b border-gray-400 border-dashed my-2"></div>
                    )}
                    
                    {isSystemMessage ? (
                      // Special styling for agent joined message
                      <div className="flex justify-center items-center">
                        <div className="text-xs text-gray-500 italic">
                          {message.message}
                        </div>
                        <div className="text-xs text-gray-400 ml-2">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    ) : (
                      <>
                        {!isConsecutiveFromSameSender && (
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${
                              message.sender_type === 'client_agent' ? 'text-gray-900' : 'text-blue-600'
                            }`}>
                              {message.sender_type === 'client_agent' ? (selectedAgent?.name || 'Agent') : 'Visitor'}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                        )}
                        <div className={`text-xs whitespace-pre-wrap max-w-48 break-words ${
                          message.sender_type === 'client_agent' ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {message.message}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryChatInterface;