"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiRefreshCw, FiX, FiChevronDown, FiChevronsDown } from 'react-icons/fi';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VisitorSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
  groupBy?: string;
  onGroupByChange?: (value: string) => void;
}

const VisitorSearch: React.FC<VisitorSearchProps> = ({
  searchTerm,
  onSearchChange,
  onRefresh,
  loading,
  groupBy = 'Activity',
  onGroupByChange
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const groupByOptions = [
    'Activity',
    'Page title',
    'Page URL', 
    'Country',
    'Serving agent',
    'Department',
    'Browser',
    'Search engine',
    'Search term'
  ];

  const handleGroupBySelect = (option: string) => {
    if (onGroupByChange) {
      onGroupByChange(option);
    }
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
      <div className="flex items-center gap-3">
         {/* Circular icon button */}
         <button className="w-7 h-7 rounded-full border-2 border-blue-400 bg-blue-50 flex items-center justify-center hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
           <FiChevronsDown className="w-4 h-4" />
         </button>
        
        {/* Group by dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors min-w-[160px] justify-between"
          >
            <span>Group by {groupBy}</span>
            <FiChevronDown className={cn("w-4 h-4 text-gray-600 transition-transform duration-200", isDropdownOpen && "rotate-180")} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-[160px]">
              {groupByOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleGroupBySelect(option)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs hover:bg-gray-50 first:rounded-t last:rounded-b",
                    option === groupBy && "bg-blue-500 text-white hover:bg-blue-600"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <Input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 w-48 h-7 text-xs border-gray-300"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-auto p-1 hover:bg-gray-100"
            >
              <FiX className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        {/* <Button 
          onClick={onRefresh} 
          disabled={loading} 
          variant="outline"
          className="text-xs px-2 py-1 h-7 border-gray-300"
        >
          <FiRefreshCw className={cn("w-3 h-3 mr-1", loading && "animate-spin")} />
          {loading ? 'Loading...' : 'Refresh'}
        </Button> */}
      </div>
    </div>
  );
};

export default VisitorSearch;