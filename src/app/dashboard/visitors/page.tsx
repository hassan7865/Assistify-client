"use client";

import React, { useEffect } from 'react';
import VisitorDropdown from './components/visitor-dropdown';
import VisitorDetailsPopup from './components/visitor-details-popup';
import VisitorHeader from './components/visitor-header';
import VisitorSearch from './components/visitor-search';
import VisitorTable from './components/visitor-table';
import { useVisitors } from './hooks/use-visitors';
import { useAuth } from '@/contexts/auth-context';
import { useVisitorActions } from '@/contexts/visitor-actions';
import { ClientAgentOnly } from '@/components/role-guard';
// No local notifications needed - global system handles everything

// Import Visitor type from the table component
interface Visitor {
  visitor_id: string;
  status: string;
  agent_id?: string;
  agent_name?: string;
  started_at?: string;
  session_id?: string;
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
}

const VisitorPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { setTakeVisitorHandler } = useVisitorActions();
  const {
    selectedVisitor,
    isPopupOpen,
    visitors,
    loading,
    searchTerm,
    allVisitors,
    incomingChats,
    servedVisitors,
    activeWebsiteVisitors,
    setSearchTerm,
    fetchVisitors,
    takeVisitorById,
    removeVisitor,
    handleVisitorClick,
    closePopup,
    CURRENT_AGENT
  } = useVisitors();

  // Register the takeVisitorById function with the global context
  useEffect(() => {
    setTakeVisitorHandler(takeVisitorById);
  }, [takeVisitorById, setTakeVisitorHandler]);

  // Wrapper function to convert Visitor object to visitor ID for takeVisitorById
  const handleTakeVisitor = (visitor: Visitor) => {
    takeVisitorById(visitor.visitor_id);
  };

  // Wrapper function to handle chat ended - close popup and refresh visitors
  const handleChatEnded = () => {
    closePopup();
    fetchVisitors();
  };

  // Show loading while authentication is being checked
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ClientAgentOnly>
      <div className="p-6 bg-white min-h-screen">
        {/* Global notifications are handled by the global notification system */}
        
        {/* Header */}
        <VisitorHeader
          agentName={CURRENT_AGENT?.name || 'Agent'}
          agentId={CURRENT_AGENT?.id || ''}
          totalVisitors={visitors.length}
          filteredCount={allVisitors.length}
          searchTerm={searchTerm}
    
                />

          {/* Search and Refresh */}
        <VisitorSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={fetchVisitors}
          loading={loading}
        />

        {/* Incoming Chats Section */}
        <VisitorDropdown title="Incoming chats" defaultExpanded={true}>
          <VisitorTable
            title="Incoming chats"
            visitors={incomingChats}
            visitorCount={incomingChats.length}
            type="incoming"
            onTakeVisitor={handleTakeVisitor}
            onRemoveVisitor={removeVisitor}
            onVisitorClick={handleVisitorClick}
            searchTerm={searchTerm}
          />
        </VisitorDropdown>

        {/* Currently Served Section */}
        <VisitorDropdown title="Currently served" defaultExpanded={true}>
          <VisitorTable
            title="Currently served"
            visitors={servedVisitors}
            visitorCount={servedVisitors.length}
            type="served"
            onTakeVisitor={handleTakeVisitor}
            onRemoveVisitor={removeVisitor}
            onVisitorClick={handleVisitorClick}
            searchTerm={searchTerm}
          />
        </VisitorDropdown>

        {/* Active Website Visitors Section */}
        {/* <VisitorDropdown title="Active website visitors" defaultExpanded={true}>
          <VisitorTable
            title="Active website visitors"
            visitors={activeWebsiteVisitors}
            visitorCount={activeWebsiteVisitors.length}
            type="active"
            onTakeVisitor={handleTakeVisitor}
            onRemoveVisitor={removeVisitor}
            onVisitorClick={handleVisitorClick}
            searchTerm={searchTerm}
          />
        </VisitorDropdown> */}

        {/* Visitor Details Popup */}
        {selectedVisitor && isPopupOpen && (
          <VisitorDetailsPopup
            visitor={selectedVisitor}
            selectedAgent={CURRENT_AGENT || undefined}
            isOpen={isPopupOpen}
            onClose={closePopup}
            onChatEnded={handleChatEnded}
          />
        )}
      </div>
    </ClientAgentOnly>
  );
};

export default VisitorPage;