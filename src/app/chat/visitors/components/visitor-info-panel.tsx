"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getCountryFlag, getBrowserIcon, getOSIcon } from '@/lib/visitor-icons';
import { Visitor, ChatMessage, getChatDuration } from '../../types';
import api from '@/lib/axios';
import { useGlobalChat } from '@/contexts/global-chat-context';
import { globalEventEmitter, EVENTS } from '@/lib/event-emitter';
import { ChevronDown, X, ArrowDown } from 'lucide-react';

interface VisitorInfoPanelProps {
  visitor: Visitor;
  chatMessages?: ChatMessage[];
}

const VisitorInfoPanel: React.FC<VisitorInfoPanelProps> = ({ visitor, chatMessages = [] }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [currentDuration, setCurrentDuration] = useState('');
  const [timerActive, setTimerActive] = useState(true);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [isEmailEditing, setIsEmailEditing] = useState(false);
  const [isPhoneEditing, setIsPhoneEditing] = useState(false);
  const [isNotesEditing, setIsNotesEditing] = useState(false);
  const [savedName, setSavedName] = useState('');
  const [savedEmail, setSavedEmail] = useState('');
  const [savedPhone, setSavedPhone] = useState('');
  const [savedNotes, setSavedNotes] = useState('');
  
  // Tags state
  const [availableTags, setAvailableTags] = useState<Array<{tag_id: string, tag_name: string}>>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const tagsDropdownRef = useRef<HTMLDivElement>(null);
  
  const { updateVisitorName, isConnected } = useGlobalChat();

  // Fetch available tags
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

  // Fetch current session tags
  const fetchSessionTags = async () => {
    if (!visitor.session_id) return;
    
    try {
      const response = await api.get(`/chat/session-tags/${visitor.session_id}`);
      if (response.data?.tags) {
        setSelectedTags(response.data.tags);
      }
    } catch (error) {
      console.error('Error fetching session tags:', error);
    }
  };

  // Add tag to session
  const addTagToSession = async (tagName: string) => {
    if (!visitor.session_id || selectedTags.includes(tagName)) return;
    
    try {
      const response = await api.post('/chat/session-tags/add', {
        session_id: visitor.session_id,
        tags: [tagName]
      });
      
      if (response.data?.tags) {
        setSelectedTags(response.data.tags);
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  // Remove tag from session
  const removeTagFromSession = async (tagName: string) => {
    if (!visitor.session_id) return;
    
    try {
      const response = await api.post('/chat/session-tags/remove', {
        session_id: visitor.session_id,
        tags: [tagName]
      });
      
      if (response.data?.tags) {
        setSelectedTags(response.data.tags);
      }
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target as Node)) {
        setIsTagsDropdownOpen(false);
      }
    };

    if (isTagsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTagsDropdownOpen]);

  useEffect(() => {
    // Initialize from visitor_details
    const initialName = visitor.visitor_details?.first_name || '';
    const initialEmail = visitor.visitor_details?.email  || '';
    const initialPhone = visitor.visitor_details?.contact || '';
    const initialNotes = visitor.visitor_details?.notes || '';
    
    setName(initialName);
    setSavedName(initialName);
    setEmail(initialEmail);
    setSavedEmail(initialEmail);
    setPhone(initialPhone);
    setSavedPhone(initialPhone);
    setNotes(initialNotes);
    setSavedNotes(initialNotes);
    
    // If there's no saved value, start in editing mode
    setIsNameEditing(!initialName);
    setIsEmailEditing(!initialEmail);
    setIsPhoneEditing(!initialPhone);
    setIsNotesEditing(!initialNotes); // Notes start in editing mode if empty
  }, [visitor.visitor_details?.first_name, visitor.visitor_details?.email, visitor.visitor_details?.contact, visitor.visitor_details?.notes]);

  // Fetch tags when component mounts
  useEffect(() => {
    fetchAvailableTags();
    fetchSessionTags();
  }, [visitor.session_id]);

  // Timer effect - updates every second unless visitor is disconnected
  useEffect(() => {
    // If visitor is disconnected, freeze the timer at the current value
    if (visitor.isDisconnected && timerActive) {
      setCurrentDuration(getChatDuration(visitor.started_at));
      setTimerActive(false);
      return;
    }

    // If timer is not active (visitor disconnected), don't start interval
    if (!timerActive) {
      return;
    }

    // Update duration immediately
    setCurrentDuration(getChatDuration(visitor.started_at));

    // Set up interval to update every second
    const interval = setInterval(() => {
      setCurrentDuration(getChatDuration(visitor.started_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [visitor.started_at, visitor.isDisconnected, timerActive]);

  // Listen for visitor details updates from visitor (widget side)
  useEffect(() => {
    const handleVisitorDetailsUpdated = ({ visitor_details, source }: { visitor_details: any; source: 'agent' | 'visitor' }) => {
      // Only update form if the change came from visitor and it matches current visitor's IP
      const visitorIp = visitor.visitor_details?.ip_address || visitor.metadata?.ip_address;
      if (source === 'visitor' && visitor_details.ip_address === visitorIp) {
        // Update form fields
        if (visitor_details.first_name !== undefined) {
          setName(visitor_details.first_name || '');
          setSavedName(visitor_details.first_name || '');
          setIsNameEditing(false);
        }
        if (visitor_details.email !== undefined) {
          setEmail(visitor_details.email || '');
          setSavedEmail(visitor_details.email || '');
          setIsEmailEditing(false);
        }
        if (visitor_details.contact !== undefined) {
          setPhone(visitor_details.contact || '');
          setSavedPhone(visitor_details.contact || '');
          setIsPhoneEditing(false);
        }
        if (visitor_details.notes !== undefined) {
          setNotes(visitor_details.notes || '');
          setSavedNotes(visitor_details.notes || '');
          setIsNotesEditing(false);
        }
      }
    };

    globalEventEmitter.on(EVENTS.VISITOR_DETAILS_UPDATED, handleVisitorDetailsUpdated);

    return () => {
      globalEventEmitter.off(EVENTS.VISITOR_DETAILS_UPDATED, handleVisitorDetailsUpdated);
    };
  }, [visitor.visitor_details?.ip_address, visitor.metadata?.ip_address]);

  // Save visitor details using visitor-details API
  const saveVisitorDetails = async (updates: { first_name?: string; email?: string; contact?: string; notes?: string }) => {
    const ipAddress = visitor.visitor_details?.ip_address || visitor.metadata?.ip_address;
    if (!ipAddress) {
      console.error('No IP address available to save visitor details');
      return false;
    }

    try {
      const response = await api.post('/chat/visitor-details', {
        ip_address: ipAddress,
        first_name: updates.first_name !== undefined ? updates.first_name : savedName || null,
        last_name: null,
        email: updates.email !== undefined ? updates.email : savedEmail || null,
        contact: updates.contact !== undefined ? updates.contact : savedPhone || null,
        notes: updates.notes !== undefined ? updates.notes : savedNotes || null,
      });
      
      if (response.data) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving visitor details:', error);
      return false;
    }
  };

  // Handle saving visitor name
  const handleSaveName = async () => {
    if (!name.trim()) return;

    const success = await saveVisitorDetails({ first_name: name.trim() });
    if (success) {
      setSavedName(name.trim());
      setIsNameEditing(false);
      updateVisitorName(visitor.visitor_id, name.trim());
    }
  };

  // Handle saving email
  const handleSaveEmail = async () => {
    if (!email.trim()) return;

    const success = await saveVisitorDetails({ email: email.trim() });
    if (success) {
      setSavedEmail(email.trim());
      setIsEmailEditing(false);
    }
  };

  // Handle saving phone
  const handleSavePhone = async () => {
    if (!phone.trim()) return;

    const success = await saveVisitorDetails({ contact: phone.trim() });
    if (success) {
      setSavedPhone(phone.trim());
      setIsPhoneEditing(false);
    }
  };

  // Handle saving notes
  const handleSaveNotes = async () => {
    const success = await saveVisitorDetails({ notes: notes.trim() });
    if (success) {
      setSavedNotes(notes.trim());
      setIsNotesEditing(false);
    }
  };

  // Handle Enter key press on name input
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    }
  };

  // Handle Enter key press on email input
  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEmail();
    }
  };

  // Handle Enter key press on phone input
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSavePhone();
    }
  };

  // Handle Enter key press on notes textarea
  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveNotes();
    }
  };

  // Handle click to enable editing
  const handleNameClick = () => {
    if (savedName) {
      setIsNameEditing(true);
    }
  };

  const handleEmailClick = () => {
    if (savedEmail) {
      setIsEmailEditing(true);
    }
  };

  const handlePhoneClick = () => {
    if (savedPhone) {
      setIsPhoneEditing(true);
    }
  };

  const handleNotesClick = () => {
    if (savedNotes) {
      setIsNotesEditing(true);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 space-y-3 overflow-y-auto custom-scrollbar">
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
            <div className="flex-1 min-w-0">
              {isNameEditing || !savedName ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <input
                      type="text"
                      placeholder="Add name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={handleNameKeyDown}
                      onBlur={handleSaveName}
                      autoFocus={isNameEditing}
                      className="w-full h-7 px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white rounded-sm"
                    />
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                    <p>Click to edit</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={handleNameClick}
                      className="w-full h-7 px-2 py-1 border border-transparent text-sm font-semibold bg-gray-50 rounded-sm cursor-pointer hover:bg-gray-100 overflow-hidden text-ellipsis whitespace-nowrap block"
                      title={savedName}
                    >
                      {savedName}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                    <p>Click to edit</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <div className="mt-1">
                {isEmailEditing || !savedEmail ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <input
                      type="email"
                      placeholder="Add email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleEmailKeyDown}
                      onBlur={handleSaveEmail}
                      autoFocus={isEmailEditing}
                      className="w-full h-7 px-2 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white rounded-sm"
                    />
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                    <p>Click to edit</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={handleEmailClick}
                      className="w-full h-7 px-2 py-2 border border-transparent text-xs bg-gray-50 rounded-sm cursor-pointer hover:bg-gray-100 overflow-hidden text-ellipsis whitespace-nowrap block"
                      title={savedEmail}
                    >
                      {savedEmail}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                    <p>Click to edit</p>
                  </TooltipContent>
                </Tooltip>
              )}
              </div>
            </div>
          </div>
          
          {isPhoneEditing || !savedPhone ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <input
                  type="tel"
                  placeholder="Add phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={handlePhoneKeyDown}
                  onBlur={handleSavePhone}
                  autoFocus={isPhoneEditing}
                  className="w-full h-7 px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white rounded-sm"
                />
              </TooltipTrigger>
              <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                <p>Click to edit</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={handlePhoneClick}
                  className="w-full h-7 px-2 py-1 border border-transparent text-xs bg-gray-50 rounded-sm cursor-pointer hover:bg-gray-100 overflow-hidden text-ellipsis whitespace-nowrap block"
                  title={savedPhone}
                >
                  {savedPhone}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                <p>Click to edit</p>
              </TooltipContent>
            </Tooltip>
          )}
          {isNotesEditing || !savedNotes ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <textarea
                  placeholder="Add visitor notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onKeyDown={handleNotesKeyDown}
                  onBlur={handleSaveNotes}
                  autoFocus={isNotesEditing}
                  rows={3}
                  className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none bg-white rounded-sm"
                />
              </TooltipTrigger>
              <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                <p>Click to edit</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={handleNotesClick}
                  className="w-full px-2 py-1 border border-transparent text-xs bg-gray-50 rounded-sm cursor-pointer hover:bg-gray-100 min-h-[4.5rem] overflow-y-auto"
                  title="Click to edit"
                >
                  {savedNotes}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                <p>Click to edit</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

      

        {/* Tags */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Tags</h3>
          
          {/* Tags Dropdown */}
          <div className="relative" ref={tagsDropdownRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsTagsDropdownOpen(!isTagsDropdownOpen)}
                  disabled={!isConnected}
                  className={`w-full px-2 py-1 border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent rounded-sm flex items-center justify-between ${
                    isConnected 
                      ? 'border-gray-300 bg-white text-gray-700' 
                      : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className={isConnected ? 'text-gray-500' : 'text-gray-400'}>
                    {isConnected ? 'Add tags' : 'Connect to add tags'}
                  </span>
                  <ChevronDown className={`w-3 h-3 ${isConnected ? 'text-gray-400' : 'text-gray-300'}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                <p>Tags are only editable during the chat</p>
              </TooltipContent>
            </Tooltip>
            
            {isTagsDropdownOpen && isConnected && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-sm shadow-lg z-50 max-h-32 overflow-y-auto">
                {loadingTags ? (
                  <div className="px-2 py-1 text-xs text-gray-500">Loading tags...</div>
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
                        className="w-full px-2 py-1 text-xs text-left hover:bg-gray-100 flex items-center justify-between"
                      >
                        <span>{tag.tag_name}</span>
                      </button>
                    ))
                ) : (
                  <div className="px-2 py-1 text-xs text-gray-500">No tags available</div>
                )}
              </div>
            )}
          </div>
          
          {/* Selected Tags Chips - Below dropdown */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedTags.map((tag, index) => (
                <div
                  key={`${tag}-${index}`}
                  className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-sm border border-gray-200"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTagFromSession(tag)}
                    disabled={!isConnected}
                    className={`hover:bg-gray-200 rounded-sm p-0.5 ${
                      isConnected ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Visitor Statistics */}
        <div className="bg-white shadow-sm p-2">
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            {/* Past Visits */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className="text-sm font-bold text-gray-900">{visitor.visitor_details?.past_visit || 0}</div>
              <div className="text-xs text-gray-600 text-center">Past visits</div>
            </div>
            
            {/* Past Chats */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className="text-sm font-bold text-gray-900">{visitor.visitor_details?.chat_count || 0}</div>
              <div className="text-xs text-gray-600 text-center">Past chats</div>
            </div>

            {/* Time on Site */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className="text-sm font-bold text-gray-900">{currentDuration}</div>
              <div className="text-xs text-gray-600 text-center">Time on site</div>
            </div>
          </div>
        </div>

        {/* Visitor Path */}
        <div className="bg-white shadow-sm p-3">
          <h3 className="text-xs text-gray-900 mb-2">Visitor Path</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-4 flex items-center justify-center">
                <ArrowDown className="w-3 h-3 text-gray-600" />
              </div>
              <div>
                {visitor.metadata?.platform 
                  ? visitor.metadata.platform.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                  : 'Direct Path'}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a 
                    href={visitor.metadata?.page_url || '-'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="truncate text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    {visitor.metadata?.page_url || '-'}
                  </a>
                </TooltipTrigger>
                <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                  <div className="space-y-1">
                    {visitor.metadata?.referrer && <p>Referrer: {visitor.metadata.referrer}</p>}
                    {visitor.metadata?.matchtype && <p>Match Type: {visitor.metadata.matchtype}</p>}
                    {visitor.metadata?.keyword && <p>Keyword: {visitor.metadata.keyword}</p>}
                    {!visitor.metadata?.referrer && !visitor.metadata?.matchtype && !visitor.metadata?.keyword && (
                      <p>No referrer available</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Zendesk Support */}
        <div className="bg-white shadow-sm p-3">
          <h3 className="text-xs text-gray-900 mb-2">Zendesk Support</h3>
          <div className="space-y-2">
            <div className="text-xs text-blue-600 underline cursor-pointer">
              (Set ticket assignee)
            </div>
            <div className="text-xs text-gray-600">Current ticket -</div>
            <div className="text-xs text-gray-600">Previous tickets -</div>
            <button className="w-full bg-gray-200 hover:bg-gray-300 text-xs py-1 px-2 text-gray-700">
              Create ticket
            </button>
          </div>
        </div>

        {/* Visitor Technical Details */}
        <div className="bg-white shadow-sm p-3">
          <div className="space-y-1 text-xs text-gray-600">
            <div>
              <span className="font-medium">Location</span><br />
              {visitor.metadata?.city || 'Unknown'}, {visitor.metadata?.country || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Browser</span><br />
              {visitor.metadata?.browser || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Platform</span><br />
              {visitor.metadata?.os || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Device</span><br />
              {visitor.metadata?.device_type || '-'}
            </div>
            <div>
              <span className="font-medium">IP address</span><br />
              {visitor.metadata?.ip_address || '-'}
            </div>
            <div>
              <span className="font-medium">Hostname</span><br />
              {'-'}
            </div>
            <div>
              <span className="font-medium">User agent</span><br />
              <span className="break-all">{visitor.metadata?.user_agent || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorInfoPanel;