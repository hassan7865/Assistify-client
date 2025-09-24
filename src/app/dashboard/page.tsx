"use client";

import React from "react";
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
  Square
} from "lucide-react";

// Mock data for tickets
const mockTickets = [
  {
    id: 4,
    subject: "Chat with Shabbir",
    requester: "Shabbir",
    updated: "Apr 13, 2023",
    group: "Support",
    assignee: "Allen Wilson",
    status: "open"
  },
  {
    id: 5,
    subject: "Js",
    requester: "Visitor 82404976",
    updated: "Apr 13, 2023",
    group: "Support",
    assignee: "Allen Wilson",
    status: "open"
  },
  {
    id: 6,
    subject: "Message from: Text user: +12407065240",
    requester: "Text user: +12407065240",
    updated: "Apr 13, 2023",
    group: "Support",
    assignee: "Allen Wilson",
    status: "open"
  },
  {
    id: 7,
    subject: "Voicemail from: Caller +1 (844) 329-5283",
    requester: "Caller +1 (844) 329-5283",
    updated: "Apr 13, 2023",
    group: "Support",
    assignee: "Allen Wilson",
    status: "open"
  },
  {
    id: 8,
    subject: "Missed conversation with Visitor 21748408",
    requester: "Visitor 21748408",
    updated: "Apr 13, 2023",
    group: "Support",
    assignee: "-",
    status: "new"
  },
  {
    id: 9,
    subject: "Conversation with Visitor 67019758",
    requester: "Visitor 67019758",
    updated: "Apr 13, 2023",
    group: "Support",
    assignee: "-",
    status: "new"
  },
  {
    id: 10,
    subject: "Chat with Visitor 12345678",
    requester: "Visitor 12345678",
    updated: "Aug 07, 2024",
    group: "Support",
    assignee: "Allen Wilson",
    status: "open"
  },
  {
    id: 11,
    subject: "Support request from John Doe",
    requester: "John Doe",
    updated: "Aug 06, 2024",
    group: "Support",
    assignee: "Allen Wilson",
    status: "open"
  },
  {
    id: 12,
    subject: "Technical issue with login",
    requester: "Jane Smith",
    updated: "Aug 06, 2024",
    group: "Support",
    assignee: "Allen Wilson",
    status: "open"
  },
  {
    id: 13,
    subject: "Billing inquiry",
    requester: "Mike Johnson",
    updated: "Aug 06, 2024",
    group: "Support",
    assignee: "-",
    status: "new"
  }
];

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <h2 className="text-xs text-gray-800 mb-3 font-semibold">Dashboard</h2>
        <div className="mb-4">
          <h3 className="text-xs text-gray-800 mb-1 font-semibold">Updates to your tickets</h3>
          <p className="text-xs text-gray-500">No recent updates.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-hidden">
        {/* Statistics Cards */}
        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            {/* Open Tickets */}
            <div>
              <h3 className="text-xs text-gray-800 mb-2">Open tickets (current)</h3>
              <div className="flex">
                <Card className="w-16 h-16 flex items-center justify-center rounded-none border-r-0">
                  <div className="text-center">
                    <div className="text-xs text-gray-800 font-semibold">10</div>
                    <div className="text-xs text-gray-600">YOU</div>
                  </div>
                </Card>
                <Card className="w-16 h-16 flex items-center justify-center rounded-none">
                  <div className="text-center">
                    <div className="text-xs text-gray-800 font-semibold">14</div>
                    <div className="text-xs text-gray-600">GROUPS</div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Ticket Statistics */}
            <div>
              <h3 className="text-xs text-gray-800 mb-2">Ticket statistics (this week)</h3>
              <div className="flex">
                <Card className="w-16 h-16 flex items-center justify-center rounded-none border-r-0">
                  <div className="text-center">
                    <div className="text-xs text-gray-800 font-semibold">0</div>
                    <div className="text-xs text-gray-600">GOOD</div>
                  </div>
                </Card>
                <Card className="w-16 h-16 flex items-center justify-center rounded-none border-r-0">
                  <div className="text-center">
                    <div className="text-xs text-gray-800 font-semibold">0</div>
                    <div className="text-xs text-gray-600">BAD</div>
                  </div>
                </Card>
                <Card className="w-16 h-16 flex items-center justify-center rounded-none">
                  <div className="text-center">
                    <div className="text-xs text-gray-800 font-semibold ">0</div>
                    <div className="text-xs text-gray-600">SOLVED</div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs text-gray-800">
                Tickets requiring your attention (14)
              </h2>
              <a href="#" className="text-xs text-blue-600 underline">What is this?</a>
            </div>
            <Button variant="outline" size="sm" className="text-xs text-gray-600 border-gray-300 h-7 px-3">
              <Play className="w-3 h-3 mr-1" />
              Play
            </Button>
          </div>

          {/* Ticket List */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox className="w-3 h-3 border border-gray-300" />
                    </TableHead>
                    <TableHead className="text-xs font-semibold">ID</TableHead>
                    <TableHead className="text-xs font-semibold">Subject</TableHead>
                    <TableHead className="text-xs font-semibold">Requester updated</TableHead>
                    <TableHead className="text-xs font-semibold">Group</TableHead>
                    <TableHead className="text-xs font-semibold">Assignee</TableHead>
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
                          {ticket.status === 'open' ? (
                            <Circle className="w-2 h-2 text-red-500 fill-current" />
                          ) : (
                            <Square className="w-2 h-2 text-orange-500 fill-current" />
                          )}
                          <span className="text-xs">#{ticket.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-900 truncate">{ticket.subject}</div>
                        <div className="text-xs text-gray-500">{ticket.requester}</div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{ticket.updated}</TableCell>
                      <TableCell className="text-xs text-gray-500">{ticket.group}</TableCell>
                      <TableCell className="text-xs text-gray-500">{ticket.assignee}</TableCell>
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
