"use client";

import React from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from "@/lib/utils";
import { 
  getCountryFlag, 
  getBrowserIcon, 
  getOSIcon, 
  getOnlineStatus, 
  getReferrerDisplay, 
  getMessageCount, 
  getStatusIcon,
  getCountryName
} from '@/lib/visitor-icons';
import { Visitor } from '../../types';

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

  // Filter out empty groups and sort by visitor count (descending) except for Activity
  const sortedGroups = Object.entries(groupedVisitors)
    .filter(([, visitors]) => visitors.length > 0) // Only show groups with visitors
    .sort(([, a], [, b]) => {
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
      <div className="text-center py-8 text-gray-500 text-sm">
        No visitors at the moment
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedGroups.map(([groupKey, visitors]) => {
        const isExpanded = expandedGroups.has(groupKey);
        
        return (
          <div key={groupKey} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            {/* Group Header */}
            <div 
              className="flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
              onClick={() => toggleGroup(groupKey)}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white border border-gray-300 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {getGroupDisplayName(groupKey, visitors)}
                </span>
              </div>
              <span className="text-sm text-gray-600 font-medium">
                Visitors: {visitors.length}
              </span>
            </div>

            {/* Group Content */}
            {isExpanded && (
              <div className="bg-white">
                {/* Table Headers */}
                 <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-200 bg-gray-50">
                   <div className="w-32 text-xs font-semibold text-gray-700">Visitor</div>
                   <div className="w-20"></div>
                   <div className="w-32 text-xs font-semibold text-gray-700 text-center">Online</div>
                   <div className="w-40 text-xs font-semibold text-gray-700">Referrer</div>
                   <div className="w-28 text-xs font-semibold text-gray-700 text-center">Served by</div>
                   <div className="flex-1 text-xs font-semibold text-gray-700">Messages</div>
                 </div>

                {/* Visitor Rows */}
                <div className="divide-y divide-gray-100">
                  {visitors.map((visitor) => (
                    <div
                      key={visitor.visitor_id}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => onVisitorClick(visitor)}
                    >
                      {/* Visitor */}
                      <div className="w-32 flex items-center gap-2">
                        {getStatusIcon(visitor)}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs font-medium text-gray-900 truncate cursor-pointer">
                              #{visitor.visitor_id.substring(0, 8)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden [&>svg]:opacity-0" side="top">
                            <p className="max-w-xs break-all">
                              Visitor ID: {visitor.visitor_id}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Icons */}
                      <div className="w-20 flex items-center justify-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center">
                              {getCountryFlag(visitor.metadata?.country)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden [&>svg]:opacity-0" side="top">
                            <p>{getCountryName(visitor.metadata?.country)}</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center">
                              {getOSIcon(visitor.metadata?.os, visitor.metadata?.user_agent)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden [&>svg]:opacity-0" side="top">
                            <p>{visitor.metadata?.os || 'Unknown OS'}</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center">
                              {getBrowserIcon(visitor.metadata?.browser, visitor.metadata?.user_agent)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden [&>svg]:opacity-0" side="top">
                            <p>{visitor.metadata?.browser || 'Unknown Browser'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Online */}
                      <div className="w-32 flex items-center justify-center">
                        <span className="text-xs text-gray-900">{getOnlineStatus(visitor.started_at)}</span>
                      </div>
                      
                      {/* Referrer */}
                      <div className="w-40 flex items-center gap-2">
                        <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <span className="text-xs text-gray-700 truncate cursor-pointer">
                               {getReferrerDisplay(visitor.metadata?.referrer)}
                             </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden [&>svg]:opacity-0" side="top">
                            <p className="max-w-xs break-all">
                              {visitor.metadata?.referrer || 'No referrer'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Served by */}
                      <div className="w-28 flex items-center justify-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <span className="text-xs text-gray-700 truncate cursor-pointer">
                               {visitor.agent_name || 'Unassigned'}
                             </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden [&>svg]:opacity-0" side="top">
                            <p>
                              {visitor.agent_name ? `Agent: ${visitor.agent_name}` : 'No agent assigned'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Last Message */}
                      <div className="flex-1 min-w-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <span className="text-xs text-gray-700 truncate block cursor-pointer">
                               {visitor.last_message?.content || 'No messages yet'}
                             </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden [&>svg]:opacity-0" side="top">
                            <p className="max-w-xs break-words">
                              {visitor.last_message?.content || 'No messages yet'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
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