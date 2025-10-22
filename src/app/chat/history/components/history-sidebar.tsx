"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, User, Edit2, MapPin, Monitor, Globe, Download, Save, Check, ThumbsUp, ThumbsDown, ChevronDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChatConversation } from '../hooks/use-chat-history';
import { getCountryFlag, getBrowserIcon, getOSIcon, getDeviceIcon } from '@/lib/visitor-icons';
import { getConversationVisitorName, getConversationAgentName } from '../../types';
import HistoryChatInterface from './history-chat-interface';
import api from '@/lib/axios';

interface HistorySidebarProps {
  conversation: ChatConversation;
  onClose: () => void;
  isClosing?: boolean;
  onRefreshHistory?: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ conversation, onClose, isClosing = false, onRefreshHistory }) => {
  const [activeTab, setActiveTab] = useState('transcript');
  const [name, setName] = useState(conversation.visitor_details?.first_name || conversation.metadata?.name || '');
  const [email, setEmail] = useState(conversation.visitor_details?.email || conversation.metadata?.email || '');
  const [phone, setPhone] = useState(conversation.visitor_details?.contact || "");
  const [notes, setNotes] = useState("");
  
  // Edit states
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [isEmailEditing, setIsEmailEditing] = useState(false);
  const [isPhoneEditing, setIsPhoneEditing] = useState(false);
  const [isNotesEditing, setIsNotesEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Tags state
  const [availableTags, setAvailableTags] = useState<Array<{tag_id: string, tag_name: string}>>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [showTagsInterface, setShowTagsInterface] = useState(false);
  const tagsDropdownRef = useRef<HTMLDivElement>(null);

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      if (diffInHours < 1) return "Just now";
      return `${diffInHours} hrs ago`;
    }
    
    // For 24+ hours, show format like "Oct 01 6:03 AM"
    return time.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };


  const getConversationDuration = () => {
    try {
      const created = new Date(conversation.created_at);
      const updated = new Date(conversation.updated_at);
      const duration = updated.getTime() - created.getTime();
      const minutes = Math.floor(duration / (1000 * 60));
      const seconds = Math.floor((duration % (1000 * 60)) / 1000);
      
      if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      }
      return `${seconds}s`;
    } catch {
      return 'Unknown';
    }
  };

  const getLocationString = () => {
    const { city, region, country } = conversation.metadata || {};
    const parts = [city, region, country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  // Save visitor details using visitor-details API
  const saveVisitorDetails = async (updates: { first_name?: string; email?: string; contact?: string }) => {
    const ipAddress = conversation.metadata?.ip_address;
    if (!ipAddress) {
      console.error('No IP address available to save visitor details');
      return false;
    }

    try {
      setSaving(true);
      const response = await api.post('/chat/visitor-details', {
        ip_address: ipAddress,
        first_name: updates.first_name !== undefined ? updates.first_name : name || null,
        last_name: null,
        email: updates.email !== undefined ? updates.email : email || null,
        contact: updates.contact !== undefined ? updates.contact : phone || null,
      });
      
      if (response.data) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving visitor details:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Handle saving visitor name
  const handleSaveName = async () => {
    if (!name.trim()) return;

    const success = await saveVisitorDetails({ first_name: name.trim() });
    if (success) {
      setIsNameEditing(false);
      // Refresh history list if callback provided
      if (onRefreshHistory) {
        onRefreshHistory();
      }
    }
  };

  // Handle saving email
  const handleSaveEmail = async () => {
    if (!email.trim()) return;

    const success = await saveVisitorDetails({ email: email.trim() });
    if (success) {
      setIsEmailEditing(false);
      // Refresh history list if callback provided
      if (onRefreshHistory) {
        onRefreshHistory();
      }
    }
  };

  // Handle saving phone
  const handleSavePhone = async () => {
    if (!phone.trim()) return;

    const success = await saveVisitorDetails({ contact: phone.trim() });
    if (success) {
      setIsPhoneEditing(false);
      // Refresh history list if callback provided
      if (onRefreshHistory) {
        onRefreshHistory();
      }
    }
  };

  // Handle saving notes (local only)
  const handleSaveNotes = () => {
    setIsNotesEditing(false);
  };

  // Tags functions
  const fetchAvailableTags = async () => {
    try {
      setLoadingTags(true);
      const response = await api.get('/chat/tags');
      if (response.data) {
        setAvailableTags(response.data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoadingTags(false);
    }
  };

  const fetchSessionTags = async () => {
    if (!conversation.chat_session_id) return;
    
    try {
      const response = await api.get(`/chat/session-tags/${conversation.chat_session_id}`);
      if (response.data?.tags) {
        setSelectedTags(response.data.tags);
      }
    } catch (error) {
      console.error('Error fetching session tags:', error);
    }
  };

  const addTagToSession = (tagName: string) => {
    if (selectedTags.includes(tagName)) return;
    setSelectedTags(prev => [...prev, tagName]);
  };

  const removeTagFromSession = (tagName: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagName));
  };

  const saveTagsChanges = async () => {
    if (!conversation.chat_session_id) return;
    
    try {
      // Get current tags from API to compare
      const currentResponse = await api.get(`/chat/session-tags/${conversation.chat_session_id}`);
      const currentTags = currentResponse.data?.tags || [];
      
      // Find tags to add and remove
      const tagsToAdd = selectedTags.filter((tag: string) => !currentTags.includes(tag));
      const tagsToRemove = currentTags.filter((tag: string) => !selectedTags.includes(tag));
      
      // Add new tags
      if (tagsToAdd.length > 0) {
        await api.post('/chat/session-tags/add-history', {
          session_id: conversation.chat_session_id,
          tags: tagsToAdd
        });
      }
      
      // Remove tags
      if (tagsToRemove.length > 0) {
        await api.post('/chat/session-tags/remove-history', {
          session_id: conversation.chat_session_id,
          tags: tagsToRemove
        });
      }
      
      // Close modal and refresh
      setShowTagsInterface(false);
      fetchSessionTags();
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  };

  // Load tags on component mount
  useEffect(() => {
    fetchAvailableTags();
    fetchSessionTags();
  }, [conversation.chat_session_id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isTagsDropdownOpen && tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target as Node)) {
        setIsTagsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTagsDropdownOpen]);

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col relative">
      {/* Loading Overlay - Only show when closing */}
      {isClosing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Closing...</span>
          </div>
        </div>
      )}
      {/* Tabs Container */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <TabsList className="grid w-auto grid-cols-2 rounded-none bg-gray-100 border-b border-gray-200 h-auto p-0 gap-0">
              <TabsTrigger 
                value="transcript" 
                className="rounded-none bg-transparent shadow-none border-0 data-[state=active]:bg-blue-50 data-[state=active]:text-gray-900 data-[state=active]:border-t data-[state=active]:border-l data-[state=active]:border-r data-[state=active]:border-blue-300 py-1 px-2 font-bold text-xs cursor-pointer"
              >
                Transcript
              </TabsTrigger>
              <TabsTrigger 
                value="userinfo" 
                className="rounded-none bg-transparent shadow-none border-0 data-[state=active]:bg-blue-50 data-[state=active]:text-gray-900 data-[state=active]:border-t data-[state=active]:border-l data-[state=active]:border-r data-[state=active]:border-blue-300 py-1 px-2 font-bold text-xs cursor-pointer"
              >
                User info
              </TabsTrigger>
            </TabsList>
            
            {/* Action Icons */}
            <div className="flex items-center gap-1">
              {activeTab === 'transcript' && (
                <Button 
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 bg-gray-100 hover:bg-gray-200 rounded-sm"
                  title="Download transcript"
                >
                  <Download className="h-3 w-3 text-gray-600" />
                </Button>
              )}
              {activeTab === 'userinfo' && (
                <Button 
                  variant="destructive"
                  className="bg-[#cd3642] hover:bg-[#cd3642]/90 h-7  text-white font-semibold text-xs px-1 rounded-sm"
               
                >
                  Ban Visitor
                </Button>
              )}
              <Button 
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6 bg-gray-100 hover:bg-gray-200 rounded-sm"
              >
                <X className="h-3 w-3 text-gray-600" />
              </Button>
            </div>
          </div>

          {/* User Info Tab */}
          <TabsContent value="userinfo" className="flex-1 overflow-y-auto m-0 p-3 custom-scrollbar">
            <div className="space-y-3">
              {/* Visitor Profile */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-[#10418c] rounded-lg flex items-center justify-center flex-shrink-0">
                    <img 
                      src="/user.png" 
                      alt="User" 
                      className="w-8 h-8 object-contain"
                    />
                    </div>
                  <div className="flex-1 space-y-2">
                    {/* Name Field */}
                    {isNameEditing ? (
                      <input
                        type="text"
                        placeholder="Add name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveName();
                          } else if (e.key === 'Escape') {
                            setIsNameEditing(false);
                            setName(conversation.visitor_details?.first_name || conversation.metadata?.name || '');
                          }
                        }}
                        autoFocus={isNameEditing}
                        className="w-full h-7 px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white rounded-sm"
                      />
                    ) : (
                      <div
                        onClick={() => setIsNameEditing(true)}
                        className="w-full h-7 px-2 py-1 border border-transparent text-sm font-semibold bg-gray-50 rounded-sm cursor-pointer hover:bg-gray-100 overflow-hidden text-ellipsis whitespace-nowrap block"
                        title={name || "Click to add name"}
                      >
                        {name || "Add name"}
                      </div>
                    )}
                    
                    {/* Email Field */}
                    <div className="mt-1">
                      {isEmailEditing ? (
                        <input
                          type="email"
                          placeholder="Add email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEmail();
                            } else if (e.key === 'Escape') {
                              setIsEmailEditing(false);
                              setEmail(conversation.visitor_details?.email || conversation.metadata?.email || '');
                            }
                          }}
                          autoFocus={isEmailEditing}
                          className="w-full h-7 px-2 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white rounded-sm"
                        />
                      ) : (
                        <div
                          onClick={() => setIsEmailEditing(true)}
                          className="w-full h-7 px-2 py-2 border border-transparent text-xs bg-gray-50 rounded-sm cursor-pointer hover:bg-gray-100 overflow-hidden text-ellipsis whitespace-nowrap block"
                          title={email || "Click to add email"}
                        >
                          {email || "Add email"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Phone Field */}
                {isPhoneEditing ? (
                  <input
                    type="tel"
                    placeholder="Add phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSavePhone();
                      } else if (e.key === 'Escape') {
                        setIsPhoneEditing(false);
                        setPhone(conversation.visitor_details?.contact || "");
                      }
                    }}
                    autoFocus={isPhoneEditing}
                    className="w-full h-7 px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white rounded-sm"
                  />
                ) : (
                  <div
                    onClick={() => setIsPhoneEditing(true)}
                    className="w-full h-7 px-2 py-1 border border-transparent text-xs bg-gray-50 rounded-sm cursor-pointer hover:bg-gray-100 overflow-hidden text-ellipsis whitespace-nowrap block"
                    title={phone || "Click to add phone number"}
                  >
                    {phone || "Add phone number"}
                  </div>
                )}
                
                {/* Notes Field */}
                {isNotesEditing ? (
                  <textarea
                    placeholder="Add visitor notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleSaveNotes();
                      } else if (e.key === 'Escape') {
                        setIsNotesEditing(false);
                        setNotes("");
                      }
                    }}
                    autoFocus={isNotesEditing}
                    rows={3}
                    className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none bg-white rounded-sm"
                  />
                ) : (
                  <div
                    onClick={() => setIsNotesEditing(true)}
                    className="w-full px-2 py-1 border border-transparent text-xs bg-gray-50 rounded-sm cursor-pointer hover:bg-gray-100 min-h-[4.5rem] overflow-y-auto"
                    title="Click to edit"
                  >
                    {notes || "Add visitor notes"}
                  </div>
                )}
                    </div>


              {/* Visitor Statistics */}
              <div className="bg-white shadow-sm p-2">
                <div className="grid grid-cols-2 divide-x divide-gray-200">
                  {/* Past Visits */}
                  <div className="flex flex-col items-center justify-center px-2">
                    <div className="text-sm font-bold text-gray-900">{conversation.visitor_details?.past_visits || 0}</div>
                    <div className="text-xs text-gray-600 text-center">Past visits</div>
                  </div>
                  
                  {/* Message Count */}
                  <div className="flex flex-col items-center justify-center px-2">
                    <div className="text-sm font-bold text-gray-900">{conversation.visitor_details?.chat_count || 0}</div>
                    <div className="text-xs text-gray-600 text-center">Past chats</div>
                  </div>
                </div>
              </div>
                      
              {/* Visitor Path */}
              <div className="bg-white shadow-sm p-3">
                <h3 className="text-xs text-gray-900 mb-2">Visitor Path</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <span>↓</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a 
                          href={conversation.metadata?.page_url || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="truncate text-gray-600 hover:text-blue-600 hover:underline cursor-pointer"
                        >
                          {conversation.metadata?.page_url || '-'}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                        <p>{conversation.metadata?.page_url || 'No page URL available'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a 
                          href={conversation.metadata?.referrer || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="truncate text-gray-600 hover:text-blue-600 hover:underline cursor-pointer"
                        >
                          {conversation.metadata?.referrer || '-'}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                        <p>{conversation.metadata?.referrer || 'No referrer available'}</p>
                      </TooltipContent>
                    </Tooltip>
                      </div>
                    </div>
                      </div>

              {/* Visitor Technical Details */}
              <div className="bg-white shadow-sm p-3">
                <div className="space-y-1 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Location</span><br />
                    {conversation.metadata?.city || 'Unknown'}, {conversation.metadata?.country || 'Unknown'}
                    </div>
                  <div>
                    <span className="font-medium">Browser</span><br />
                    {conversation.metadata?.browser || 'Unknown'}
                      </div>
                  <div>
                    <span className="font-medium">Platform</span><br />
                    {conversation.metadata?.os || 'Unknown'}
                    </div>
                  <div>
                    <span className="font-medium">Device</span><br />
                    {conversation.metadata?.device_type || '-'}
                      </div>
                  <div>
                    <span className="font-medium">IP address</span><br />
                    {conversation.metadata?.ip_address || '-'}
                    </div>
                  <div>
                    <span className="font-medium">Hostname</span><br />
                    {'-'}
                      </div>
                  <div>
                    <span className="font-medium">User agent</span><br />
                    <span className="break-all">{conversation.metadata?.user_agent || '-'}</span>
                      </div>
                      </div>
                    </div>
            </div>
          </TabsContent>

          {/* Conversation Tab */}
          <TabsContent value="transcript" className="flex-1 m-0 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              {/* Conversation Details */}
               <div className="space-y-3 mb-6">
                 <div className="flex gap-2 text-sm">
                   <span className="text-gray-600 text-xs w-24">Rating:</span>
                   <span className="text-gray-900 text-xs">
                     {conversation.session_rating ? (
                       <div className="flex items-center gap-1">
                         {conversation.session_rating.rating === 'thumbs_up' ? (
                           <div className="flex items-center gap-1">
                             <ThumbsUp className="w-4 h-4 text-green-600" />
                             <span className="text-green-600 text-sm">Good</span>
                           </div>
                         ) : conversation.session_rating.rating === 'thumbs_down' ? (
                           <div className="flex items-center gap-1">
                             <ThumbsDown className="w-4 h-4 text-red-600" />
                             <span className="text-red-600 text-sm">Bad</span>
                           </div>
                         ) : (
                           <span className="text-gray-600 text-xs">{conversation.session_rating.rating}</span>
                         )}
                       </div>
                     ) : (
                       '—'
                     )}
                   </span>
                </div>
                 <div className="flex gap-2 text-sm">
                   <span className="text-gray-600 text-xs w-24">Comment:</span>
                   <span className="text-gray-900 text-xs">
                     {conversation.session_rating?.note || '—'}
                   </span>
                </div>
                 <div className="flex gap-2 text-sm">
                   <span className="text-gray-600 text-xs w-24">Support ticket:</span>
                   <span className="text-blue-600 cursor-pointer text-xs">Create ticket</span>
                </div>
                 <div className="flex gap-2 text-sm">
                   <span className="text-gray-600 text-xs w-24">Tags:</span>
                  <div className="flex items-center gap-2">
                    {selectedTags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedTags.map((tag, index) => (
                          <span
                            key={`${tag}-${index}`}
                            className="inline-flex items-center bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-sm border border-gray-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No tags</span>
                    )}
                    <div 
                      className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 cursor-pointer hover:bg-gray-200"
                      onClick={() => setShowTagsInterface(true)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dotted Line */}
              <div className="border-b border-dashed border-gray-300 mb-6"></div>

              {/* Edit Chat Tags Modal */}
              {showTagsInterface && (
                <div className="absolute inset-0 bg-white z-50 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Edit chat tags</h2>
                      <div className="w-full h-0.5 bg-blue-500 mt-1"></div>
                    </div>
                    <button
                      onClick={() => setShowTagsInterface(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <p className="text-sm text-gray-500 mb-4">
                      Tags added or deleted in history will not be reflected on the corresponding Zendesk Support ticket.
                    </p>
                    
                    {/* Tags Input */}
                    <div className="mb-4">
                      <div className="relative" ref={tagsDropdownRef}>
                        <input
                          type="text"
                          placeholder="Add chat tags"
                          className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          onFocus={() => setIsTagsDropdownOpen(true)}
                        />
                        
                        {isTagsDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-sm shadow-lg z-50 max-h-32 overflow-y-auto">
                            {loadingTags ? (
                              <div className="px-3 py-2 text-sm text-gray-500">Loading tags...</div>
                            ) : availableTags.length > 0 ? (
                              availableTags
                                .filter(tag => !selectedTags.includes(tag.tag_name))
                                .map((tag, index) => (
                                  <button
                                    key={`${tag.tag_id}-${index}`}
                                    onClick={() => {
                                      addTagToSession(tag.tag_name);
                                      setIsTagsDropdownOpen(false);
                                    }}
                                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center justify-between"
                                  >
                                    <span>{tag.tag_name}</span>
                                  </button>
                                ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">No tags available</div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Click to edit</p>
                    </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag, index) => (
                    <div
                      key={`${tag}-${index}`}
                      className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded-sm border border-gray-200"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => removeTagFromSession(tag)}
                        className="hover:bg-gray-200 rounded-sm p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save/Cancel Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={saveTagsChanges}
                className="px-4 py-2 text-white rounded text-sm hover:opacity-90"
                style={{ backgroundColor: '#1f73b7' }}
              >
                Save changes
              </button>
              <button
                onClick={() => setShowTagsInterface(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
                </div>
              )}

              {/* Chat Messages */}
              <HistoryChatInterface 
                conversation={conversation}
                selectedAgent={{
                  id: conversation.agent_id || '',
                  name: conversation.agent_info?.name || ''
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HistorySidebar;