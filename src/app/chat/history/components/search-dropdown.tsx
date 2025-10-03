"use client";

import React from 'react';
import { Calendar, MessageCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface SearchFilters {
  searchQuery: string;
  chatStatus: 'all' | 'active' | 'pending' | 'resolved';
  minMessageCount: number;
  dateFrom?: string;
  dateTo?: string;
  assignmentStatus: 'all' | 'assigned' | 'unassigned';
}

interface SearchDropdownProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  isLoading = false
}) => {
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-80 max-h-96 overflow-y-auto custom-scrollbar">
      <div className="p-4">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-900">Search</h3>
        </div>

        {/* Chat Status Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateFilter('chatStatus', 'all')}
            className={`flex-1 h-6 text-xs px-2 rounded-xs font-bold ${
              filters.chatStatus === 'all' 
                ? 'bg-blue-100 text-gray-800 border-t border-l border-r border-blue-300' 
                : 'bg-white text-gray-800 border-t border-l border-r border-gray-300'
            }`}
          >
            All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateFilter('chatStatus', 'active')}
            className={`flex-1 h-6 text-xs px-2 rounded-xs font-bold ${
              filters.chatStatus === 'active' 
                ? 'bg-blue-100 text-gray-800 border-t border-l border-r border-blue-300' 
                : 'bg-white text-gray-800 border-l border-gray-300'
            }`}
          >
            Active
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateFilter('chatStatus', 'pending')}
            className={`flex-1 h-6 text-xs px-2 rounded-xs font-bold ${
              filters.chatStatus === 'pending' 
                ? 'bg-blue-100 text-gray-800 border-t border-l border-r border-blue-300' 
                : 'bg-white text-gray-800 border-l border-gray-300'
            }`}
          >
            Pending
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateFilter('chatStatus', 'resolved')}
            className={`flex-1 h-6 text-xs px-2 rounded-xs font-bold ${
              filters.chatStatus === 'resolved' 
                ? 'bg-blue-100 text-gray-800 border-t border-l border-r border-blue-300' 
                : 'bg-white text-gray-800 border-l border-gray-300'
            }`}
          >
            Resolved
          </Button>
        </div>


        {/* Keywords Input */}
        <div className="space-y-1 mb-4">
          <Label className="text-xs text-gray-600">Keywords</Label>
          <Input
            placeholder="Search messages, visitors..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="h-7 text-xs"
          />
        </div>

        {/* Date Range */}
        <div className="space-y-2 mb-4">
          <Label className="text-xs text-gray-600">Date range</Label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className="h-7 text-xs flex-1"
            />
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className="h-7 text-xs flex-1"
            />
          </div>
        </div>

        {/* CHATS Section */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-3 h-3 text-gray-500" />
            <Label className="text-xs text-gray-600">Chats</Label>
          </div>

          {/* Message Count Filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-600">At least</Label>
              <Input
                type="number"
                min="0"
                value={filters.minMessageCount}
                onChange={(e) => updateFilter('minMessageCount', parseInt(e.target.value) || 0)}
                className="h-7 w-12 text-xs"
              />
              <Label className="text-xs text-gray-600">messages</Label>
            </div>
          </div>

          {/* Assignment Status Filters */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Assignment</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="assigned"
                  checked={filters.assignmentStatus === 'assigned'}
                  onCheckedChange={(checked) => 
                    updateFilter('assignmentStatus', checked ? 'assigned' : 'all')
                  }
                  className="w-3 h-3"
                />
                <Label htmlFor="assigned" className="text-xs">Assigned</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unassigned"
                  checked={filters.assignmentStatus === 'unassigned'}
                  onCheckedChange={(checked) => 
                    updateFilter('assignmentStatus', checked ? 'unassigned' : 'all')
                  }
                  className="w-3 h-3"
                />
                <Label htmlFor="unassigned" className="text-xs">Unassigned</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClearFilters}
            disabled={isLoading}
            className="h-6 text-xs px-3 rounded-xs hover:bg-gray-50 hover:text-gray-900"
          >
            Cancel
          </Button>
          <Button
            onClick={onApplyFilters}
            disabled={isLoading}
            className="h-6 text-xs px-3 bg-blue-600 hover:bg-blue-700 rounded-xs"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchDropdown;
