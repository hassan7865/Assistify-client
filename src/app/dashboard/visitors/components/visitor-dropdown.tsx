"use client";

import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Button } from "@/components/ui/button";

interface VisitorDropdownProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const VisitorDropdown: React.FC<VisitorDropdownProps> = ({ 
  title, 
  children, 
  defaultExpanded = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-auto text-sm font-medium text-gray-700 p-2"
      >
        {isExpanded ? <FiChevronUp className="w-4 h-4 mr-2" /> : <FiChevronDown className="w-4 h-4 mr-2" />}
        {title}
      </Button>
      
      {isExpanded && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default VisitorDropdown;
