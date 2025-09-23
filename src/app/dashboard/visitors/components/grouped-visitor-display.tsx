"use client";

import React from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Globe, Search } from 'lucide-react';
import { cn } from "@/lib/utils";
import { 
  getCountryFlag, 
  getBrowserIcon, 
  getOSIcon, 
  getDeviceIcon, 
  getOnlineStatus, 
  getReferrerDisplay, 
  getMessageCount, 
  getStatusColor 
} from '@/lib/visitor-icons';

interface Visitor {
  visitor_id: string;
  status: string;
  agent_id?: string;
  agent_name?: string;
  started_at?: string;
  session_id?: string;
  message_count?: number;
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

interface GroupedVisitors {
  [key: string]: Visitor[];
}

interface GroupedVisitorDisplayProps {
  groupedVisitors: GroupedVisitors;
  groupBy: string;
  onTakeVisitor: (visitor: Visitor) => void;
  onRemoveVisitor: (visitorId: string) => void;
  onVisitorClick: (visitor: Visitor) => void;
  searchTerm: string;
}

const GroupedVisitorDisplay: React.FC<GroupedVisitorDisplayProps> = ({
  groupedVisitors,
  groupBy,
  onTakeVisitor,
  onRemoveVisitor,
  onVisitorClick,
  searchTerm
}) => {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  
  // Initialize all groups as expanded by default
  React.useEffect(() => {
    const allGroupKeys = Object.keys(groupedVisitors);
    setExpandedGroups(new Set(allGroupKeys));
  }, [groupedVisitors]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const getGroupDisplayName = (groupKey: string, visitors: Visitor[]) => {
    switch (groupBy) {
      case 'Activity':
        return groupKey === 'incoming' ? 'Incoming chats' : 'Currently served';
      case 'Country':
        return groupKey;
      case 'Serving agent':
        return groupKey === 'Unassigned' ? 'Unassigned' : groupKey;
      case 'Browser':
        return groupKey;
      case 'Page title':
        return groupKey;
      case 'Page URL':
        return groupKey;
      case 'Department':
        return groupKey;
      case 'Search engine':
        return groupKey;
      case 'Search term':
        return groupKey;
      default:
        return groupKey;
    }
  };





  // Sort groups by visitor count (descending) except for Activity
  const sortedGroups = Object.entries(groupedVisitors).sort(([, a], [, b]) => {
    if (groupBy === 'Activity') {
      // For Activity, show incoming first, then served
      return a[0]?.agent_id ? 1 : -1;
    }
    return b.length - a.length;
  });

  // Check if there are any visitors at all
  const totalVisitors = Object.values(groupedVisitors).flat().length;
  
  if (totalVisitors === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-xs">
        No visitors at the moment
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sortedGroups.map(([groupKey, visitors]) => {
        const isExpanded = expandedGroups.has(groupKey);
        
        return (
          <div key={groupKey} className="border border-gray-200 rounded">
            {/* Group Header */}
            <div 
              className="flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 cursor-pointer border-b border-gray-200"
              onClick={() => toggleGroup(groupKey)}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-gray-600" />
                  )}
                </div>
                <span className="text-xs font-medium text-gray-900">
                  {getGroupDisplayName(groupKey, visitors)}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Visitors: {visitors.length}
              </span>
            </div>

            {/* Group Content */}
            {isExpanded && (
              <div className="bg-white">
                {/* Table Headers */}
                <div className="flex items-center gap-3 px-3 py-1 border-b border-gray-200 bg-gray-50">
                  <div className="w-20 text-xs font-medium text-gray-600 uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>Visitor</div>
                  <div className="w-32 text-xs font-medium text-gray-600 uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>Online</div>
                  <div className="w-32 text-xs font-medium text-gray-600 uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>Referrer</div>
                  <div className="w-12 text-xs font-medium text-gray-600 uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>Messages</div>
                </div>

                {/* Visitor Rows */}
                <div className="divide-y divide-gray-100">
                  {visitors.map((visitor) => (
                    <div
                      key={visitor.visitor_id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => onVisitorClick(visitor)}
                    >
                      {/* Visitor */}
                      <div className="w-20 flex items-center gap-1">
                        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(visitor))} />
                        <MessageCircle className="h-3 w-3 text-gray-600 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-900 truncate">
                          #{visitor.visitor_id.substring(0, 8)}
                        </span>
                      </div>
                      
                      {/* Online */}
                      <div className="w-32 flex items-center gap-1">
                        <span className="text-xs text-gray-600">{getOnlineStatus(visitor.started_at)}</span>
                        <div className="flex items-center gap-1">
                          {getCountryFlag(visitor.metadata?.country)}
                          {getOSIcon(visitor.metadata?.os, visitor.metadata?.user_agent)}
                          {getBrowserIcon(visitor.metadata?.browser, visitor.metadata?.user_agent)}
                        </div>
                      </div>
                      
                      {/* Referrer */}
                      <div className="w-32 flex items-center gap-1">
                        <Search className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600 truncate">
                          {getReferrerDisplay(visitor.metadata?.referrer)}
                        </span>
                      </div>
                      
                      {/* Messages */}
                      <div className="w-12">
                        <span className="text-xs text-gray-600">
                          {getMessageCount(visitor)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GroupedVisitorDisplay;
