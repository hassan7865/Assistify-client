"use client";

import React from 'react';
import { FiSearch, FiRefreshCw, FiX } from 'react-icons/fi';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VisitorSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

const VisitorSearch: React.FC<VisitorSearchProps> = ({
  searchTerm,
  onSearchChange,
  onRefresh,
  loading
}) => {
  return (
    <div className="flex justify-end items-center mb-6">
      <div className="flex items-center gap-4">
        {/* <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search visitors..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-64"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1 hover:bg-muted"
            >
              <FiX className="w-4 h-4" />
            </Button>
          )}
        </div> */}
        <Button onClick={onRefresh} disabled={loading} variant="outline">
          <FiRefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>
    </div>
  );
};

export default VisitorSearch;
