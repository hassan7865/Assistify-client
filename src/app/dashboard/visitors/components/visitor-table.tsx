"use client";

import React from 'react';
import { FiEye, FiAlertCircle } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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

interface VisitorTableProps {
  title: string;
  visitors: Visitor[];
  visitorCount: number;
  type: 'incoming' | 'served' | 'active';
  onTakeVisitor: (visitor: Visitor) => void;
  onRemoveVisitor: (visitorId: string) => void;
  onVisitorClick: (visitor: Visitor) => void;
  searchTerm: string;
}

const VisitorTable: React.FC<VisitorTableProps> = ({
  title,
  visitors,
  visitorCount,
  type,
  onTakeVisitor,
  onRemoveVisitor,
  onVisitorClick,
  searchTerm
}) => {
  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'assigned':
      case 'active':
        return <div className="w-3 h-3 bg-green-500 rounded-sm"></div>;
      case 'pending':
      case 'idle':
        return <div className="w-3 h-3 bg-teal-400 rounded-sm"></div>;
      default:
        return <div className="w-3 h-3 bg-muted-foreground rounded-sm"></div>;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'assigned':
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-1 py-0">Active</Badge>;
      case 'pending':
      case 'idle':
        return <Badge variant="secondary" className="bg-teal-100 text-teal-800 text-xs px-1 py-0">Pending</Badge>;
      case 'closed':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs px-1 py-0">Closed</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs px-1 py-0">{status}</Badge>;
    }
  };

  const getOnlineStatus = (startedAt?: string) => {
    if (!startedAt) return 'N/A';
    const startTime = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '0 secs';
    if (diffMins < 60) return `${diffMins} mins`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hours`;
  };

  const renderActions = (visitor: Visitor) => {
    if (type === 'incoming' || type === 'active') {
      return (
        <div className="flex gap-1">
          <Button 
            size="sm" 
            onClick={() => onTakeVisitor(visitor)}
            className="text-xs px-2 py-1 h-6"
          >
            Pick
          </Button>
          {(visitor.status?.toLowerCase() === 'disconnected' || 
            visitor.status?.toLowerCase() === 'offline' || 
            visitor.status?.toLowerCase() === 'closed' || 
            visitor.status?.toLowerCase() === 'inactive') && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onRemoveVisitor(visitor.visitor_id)}
              className="text-destructive border-destructive hover:bg-destructive/10 text-xs px-2 py-1 h-6"
            >
              Remove
            </Button>
          )}
        </div>
      );
    }
    
    return null;
  };

  const renderTableHeaders = () => {
    const baseHeaders = [
      { key: 'visitor', label: 'Visitor' },
      { key: 'online', label: 'Online' },
      { key: 'status', label: 'Status' },
      { key: 'started', label: 'Started' }
    ];

    if (type === 'served') {
      baseHeaders.splice(2, 0, { key: 'servedBy', label: 'Served by' });
    }

    if (type !== 'served') {
      baseHeaders.push({ key: 'actions', label: 'Actions' });
    }

    return baseHeaders;
  };

  const renderTableRow = (visitor: Visitor) => {
    const cells = [
      <TableCell key="visitor" className="font-medium py-2">
        <div className="flex items-center gap-2">
          {type === 'incoming' && <FiAlertCircle className="w-3 h-3 text-destructive" />}
          {type === 'served' && getStatusIcon(visitor.status)}
          {type === 'active' && getStatusIcon(visitor.status)}
          <span 
            className={cn(
              "cursor-pointer hover:underline text-xs",
              type === 'incoming' || type === 'active' ? 'text-blue-600' : 'text-foreground'
            )}
            onClick={() => onVisitorClick(visitor)}
          >
            {visitor.visitor_id?.substring(0, 8)}...
          </span>
          <FiEye className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-foreground" />
          {visitor.metadata?.name && (
            <span className="text-xs text-muted-foreground">({visitor.metadata.name})</span>
          )}
        </div>
      </TableCell>,
      <TableCell key="online" className="text-xs py-2">{getOnlineStatus(visitor.started_at)}</TableCell>,
      <TableCell key="status" className="py-2">{getStatusBadge(visitor.status)}</TableCell>
    ];

    if (type === 'served') {
      cells.splice(2, 0, 
        <TableCell key="servedBy" className="text-xs text-foreground py-2">
          {visitor.agent_name || 'Unassigned'}
        </TableCell>
      );
    }

    cells.push(
      <TableCell key="started" className="text-xs text-foreground py-2">
        {visitor.started_at ? new Date(visitor.started_at).toLocaleString() : 'N/A'}
      </TableCell>
    );

    if (type !== 'served') {
      cells.push(
        <TableCell key="actions" className="py-2">
          {renderActions(visitor)}
        </TableCell>
      );
    }

    return cells;
  };

  const getEmptyMessage = () => {
    if (searchTerm) {
      return `No ${title.toLowerCase()} match your search`;
    }
    
    switch (type) {
      case 'incoming':
        return 'No incoming chats at the moment';
      case 'served':
        return 'No visitors currently being served';
      case 'active':
        return 'No active website visitors found';
      default:
        return 'No visitors found';
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-3">
        {visitors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            {getEmptyMessage()}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {renderTableHeaders().map(header => (
                  <TableHead key={header.key} className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-2">
                    {header.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors.map((visitor) => (
                <TableRow key={visitor.visitor_id} className="hover:bg-muted/50 py-1">
                  {renderTableRow(visitor)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default VisitorTable;
