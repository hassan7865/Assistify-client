"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Play,
  Circle,
  ChevronDown,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronsUpDown
} from "lucide-react";

// Mock data for tickets
const mockTickets = [
  {
    id: 1,
    subject: "Conversation with Visitor 67019758",
    requester: "Visitor 67019758",
    requested: "Aug 06, 2024",
    type: "Ticket",
    priority: "",
    status: "open"
  },
  {
    id: 2,
    subject: "Missed conversation with Visitor 21748408",
    requester: "Visitor 21748408",
    requested: "Aug 06, 2024",
    type: "Ticket",
    priority: "",
    status: "open"
  },
  {
    id: 3,
    subject: "Message from: Text user: +12407065240",
    requester: "Text user: +12407065240",
    requested: "Apr 19, 2023",
    type: "Ticket",
    priority: "",
    status: "open"
  },
  {
    id: 4,
    subject: "Js",
    requester: "Shabbir",
    requested: "Apr 12, 2023",
    type: "Ticket",
    priority: "",
    status: "open"
  },
  {
    id: 5,
    subject: "Chat with Visitor 82404976",
    requester: "Visitor 82404976",
    requested: "Apr 12, 2023",
    type: "Ticket",
    priority: "",
    status: "open"
  },
  {
    id: 6,
    subject: "Chat with Shabbir",
    requester: "Shabbir",
    requested: "Apr 12, 2023",
    type: "Ticket",
    priority: "",
    status: "open"
  },
  {
    id: 7,
    subject: "f",
    requester: "Shabbir",
    requested: "Apr 12, 2023",
    type: "Ticket",
    priority: "",
    status: "open"
  },
  {
    id: 8,
    subject: "hello",
    requester: "Test",
    requested: "Apr 12, 2023",
    type: "Ticket",
    priority: "",
    status: "open"
  },
  {
    id: 9,
    subject: "Sample ticket: Meet the ticket",
    requester: "The Customer",
    requested: "Apr 12, 2023",
    type: "Incident",
    priority: "Normal",
    status: "open"
  },
  {
    id: 10,
    subject: "Additional ticket for testing",
    requester: "Test User",
    requested: "Apr 12, 2023",
    type: "Ticket",
    priority: "",
    status: "open"
  }
];

const sidebarViews = [
  { name: "Your unsolved tickets", count: 10, active: true },
  { name: "Unassigned tickets", count: 4, active: false },
  { name: "All unsolved tickets", count: 14, active: false },
  { name: "Recently updated tickets", count: 0, active: false },
  { name: "Pending tickets", count: 0, active: false },
  { name: "Recently solved tickets", count: 0, active: false },
  { name: "Suspended tickets", count: 0, active: false },
  { name: "Deleted tickets", count: 0, active: false }
];

export default function TicketsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="relative h-screen bg-white">
      {/* Left Sidebar */}
      <div className={`absolute left-0 top-0 h-full w-64 bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out z-10 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm text-gray-800 font-semibold">Views</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        
          <div className="space-y-1">
            {sidebarViews.map((view) => (
              <div
                key={view.name}
                className={`flex items-center justify-between px-3 py-2 rounded text-sm cursor-pointer ${
                  view.active
                    ? "bg-blue-100 text-blue-800 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{view.name}</span>
                <span className="text-gray-500">{view.count}</span>
              </div>
            ))}
          </div>
          
          {/* Divider Line */}
          <div className="my-4 border-t border-gray-200"></div>
          
          <div className="mt-2">
            <div className="flex items-center gap-2 text-xs text-blue-600 cursor-pointer hover:underline">
              <span>Manage views</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`h-full p-4 overflow-hidden transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-3 h-3 text-gray-600" />
                </button>
              )}
              <h1 className="text-lg font-semibold text-gray-800">Your unsolved tickets</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8 px-3 border-blue-200 text-blue-700 hover:bg-blue-50">
                Actions
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
              <Button size="sm" className="text-xs h-8 px-3 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-full">
                <div className="w-6 h-6 rounded-full border border-blue-200 flex items-center justify-center mr-2">
                  <Play className="w-3 h-3 text-blue-700" />
                </div>
                Play
              </Button>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-4">
            <Button variant="outline" size="sm" className="text-xs h-8 px-3 border-blue-200 text-blue-700 hover:bg-blue-50">
              <Filter className="w-3 h-3 mr-1" />
              Filter
            </Button>
          </div>

          {/* Ticket Count */}
          <div className="mb-4">
            <span className="text-xs text-gray-600">10 tickets</span>
          </div>

          {/* Ticket List */}
          <div className="border border-gray-200 rounded-lg overflow-hidden flex-1">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox className="w-3 h-3 border border-gray-300" />
                    </TableHead>
                    <TableHead className="text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        Subject
                        <ChevronsUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        Requester
                        <ChevronsUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        Requested
                        <ChevronsUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        Type
                        <ChevronsUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        Priority
                        <ChevronsUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-gray-50">
                      <TableCell className="w-12">
                        <Checkbox className="w-3 h-3 border border-gray-300" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Circle className="w-2 h-2 text-red-500 fill-current" />
                          <span className="text-sm text-gray-900">{ticket.subject}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{ticket.requester}</TableCell>
                      <TableCell className="text-sm text-gray-700">{ticket.requested}</TableCell>
                      <TableCell className="text-sm text-gray-700">{ticket.type}</TableCell>
                      <TableCell className="text-sm text-gray-700">{ticket.priority}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
