"use client";

import { useEffect, useState } from 'react';
import VisitorSearch from './components/visitor-search';
import GroupedVisitorDisplay from './components/grouped-visitor-display';
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
  const [groupBy, setGroupBy] = useState('Activity');
  const {
    loading,
    searchTerm,
    incomingChats,
    servedVisitors,
    setSearchTerm,
    fetchVisitors,
    takeVisitorById,
    removeVisitor,
    handleVisitorClick,
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


  // Enhanced visitor click handler that auto-takes visitor
  const handleVisitorClickEnhanced = (visitor: Visitor) => {
    // Take the visitor if not already taken, which will open the chat after moving to active list
    if (!visitor.agent_id && CURRENT_AGENT?.id) {
      takeVisitorById(visitor.visitor_id, false);
    } else {
      // If already taken, just open the chat
      handleVisitorClick(visitor);
    }
  };

  // Group visitors based on selected criteria
  const getGroupedVisitors = () => {
    const allVisitors = [...incomingChats, ...servedVisitors];
    
    switch (groupBy) {
      case 'Activity':
        return {
          'incoming': incomingChats,
          'served': servedVisitors
        };
      
      case 'Country':
        const countryGroups: { [key: string]: Visitor[] } = {};
        allVisitors.forEach(visitor => {
          const country = visitor.metadata?.country || 'Unknown';
          if (!countryGroups[country]) {
            countryGroups[country] = [];
          }
          countryGroups[country].push(visitor);
        });
        return countryGroups;
      
      case 'Serving agent':
        const agentGroups: { [key: string]: Visitor[] } = {};
        allVisitors.forEach(visitor => {
          const agent = visitor.agent_name || 'Unassigned';
          if (!agentGroups[agent]) {
            agentGroups[agent] = [];
          }
          agentGroups[agent].push(visitor);
        });
        return agentGroups;
      
      case 'Browser':
        const browserGroups: { [key: string]: Visitor[] } = {};
        allVisitors.forEach(visitor => {
          const browser = visitor.metadata?.browser || 'Unknown';
          if (!browserGroups[browser]) {
            browserGroups[browser] = [];
          }
          browserGroups[browser].push(visitor);
        });
        return browserGroups;
      
      case 'Page title':
        const pageGroups: { [key: string]: Visitor[] } = {};
        allVisitors.forEach(visitor => {
          const pageTitle = visitor.metadata?.page_url?.split('/').pop() || 'Home';
          if (!pageGroups[pageTitle]) {
            pageGroups[pageTitle] = [];
          }
          pageGroups[pageTitle].push(visitor);
        });
        return pageGroups;
      
      case 'Page URL':
        const urlGroups: { [key: string]: Visitor[] } = {};
        allVisitors.forEach(visitor => {
          const url = visitor.metadata?.page_url || 'Unknown';
          if (!urlGroups[url]) {
            urlGroups[url] = [];
          }
          urlGroups[url].push(visitor);
        });
        return urlGroups;
      
      case 'Department':
        const deptGroups: { [key: string]: Visitor[] } = {};
        allVisitors.forEach(visitor => {
          const dept = 'General'; // Default department since not in metadata
          if (!deptGroups[dept]) {
            deptGroups[dept] = [];
          }
          deptGroups[dept].push(visitor);
        });
        return deptGroups;
      
      case 'Search engine':
        const searchEngineGroups: { [key: string]: Visitor[] } = {};
        allVisitors.forEach(visitor => {
          const referrer = visitor.metadata?.referrer || '';
          let searchEngine = 'Direct';
          if (referrer.includes('google')) searchEngine = 'Google';
          else if (referrer.includes('bing')) searchEngine = 'Bing';
          else if (referrer.includes('yahoo')) searchEngine = 'Yahoo';
          else if (referrer.includes('duckduckgo')) searchEngine = 'DuckDuckGo';
          else if (referrer) searchEngine = 'Other';
          
          if (!searchEngineGroups[searchEngine]) {
            searchEngineGroups[searchEngine] = [];
          }
          searchEngineGroups[searchEngine].push(visitor);
        });
        return searchEngineGroups;
      
      case 'Search term':
        const searchTermGroups: { [key: string]: Visitor[] } = {};
        allVisitors.forEach(visitor => {
          const referrer = visitor.metadata?.referrer || '';
          let searchTerm = 'Direct';
          if (referrer.includes('q=')) {
            const urlParams = new URLSearchParams(referrer.split('?')[1]);
            searchTerm = urlParams.get('q') || 'Unknown';
          }
          
          if (!searchTermGroups[searchTerm]) {
            searchTermGroups[searchTerm] = [];
          }
          searchTermGroups[searchTerm].push(visitor);
        });
        return searchTermGroups;
      
      default:
        return {
          'incoming': incomingChats,
          'served': servedVisitors
        };
    }
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
      <div className="p-6 bg-white min-h-screen relative">
        {/* Global notifications are handled by the global notification system */}
        
        {/* Search and Refresh */}
        <VisitorSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={fetchVisitors}
          loading={loading}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
        />

        {/* Dynamic Grouped Visitor Display */}
        <GroupedVisitorDisplay
          groupedVisitors={getGroupedVisitors()}
          groupBy={groupBy}
          onTakeVisitor={handleTakeVisitor}
          onRemoveVisitor={removeVisitor}
          onVisitorClick={handleVisitorClickEnhanced}
          searchTerm={searchTerm}
        />

        {/* Minimized Chat Tabs - Page Level */}
      </div>
    </ClientAgentOnly>
  );
};

export default VisitorPage;