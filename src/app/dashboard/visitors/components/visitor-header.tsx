"use client";

import React from 'react';
import { FiGrid, FiUser } from 'react-icons/fi';
import { cn } from "@/lib/utils";

interface VisitorHeaderProps {
  agentName: string;
  agentId: string;
  totalVisitors: number;
  filteredCount?: number;
  searchTerm: string;
  sseStatus: string;
}

const VisitorHeader: React.FC<VisitorHeaderProps> = ({
  agentName,
  agentId,
  totalVisitors,
  filteredCount,
  searchTerm,
  sseStatus
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Visitors Dashboard</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FiGrid className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
          <FiUser className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {totalVisitors} {searchTerm && `(${filteredCount} filtered)`}
        </div>
      </div>
    </div>
  );
};

export default VisitorHeader;
