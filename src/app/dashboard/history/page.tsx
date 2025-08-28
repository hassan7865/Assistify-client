"use client";

import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import HistorySidebar from './components/history-sidebar';

interface ChatHistoryItem {
  id: string;
  name: string;
  agent: string;
  time: string;
  rating: number | null;
  messages: number;
  lastMessage: string;
}

const chatHistoryData: ChatHistoryItem[] = [
  {
    id: "#41162089",
    name: "",
    agent: "Arthur",
    time: "18 hrs ago",
    rating: 5,
    messages: 2,
    lastMessage: "Hi! Thanks for stopping by. What services are you looking for? Unlike automated bots, I'm here to chat with you!"
  },
  {
    id: "Margo",
    name: "Margo",
    agent: "Arthur",
    time: "18 hrs ago",
    rating: null,
    messages: 5,
    lastMessage: "Hi Margo! With me?"
  },
  {
    id: "#83742133",
    name: "",
    agent: "Arthur",
    time: "18 hrs ago",
    rating: null,
    messages: 3,
    lastMessage: "Hi! Thanks for stopping by. What services are you looking for? Feel free to ask for assistance. You're talking to a"
  },
  {
    id: "#87756477",
    name: "",
    agent: "Arthur",
    time: "18 hrs ago",
    rating: null,
    messages: 2,
    lastMessage: "Hi there! How's your day coming along? Could you elucidate your precise requirements?"
  },
  {
    id: "#83951273",
    name: "",
    agent: "Arthur",
    time: "18 hrs ago",
    rating: null,
    messages: 2,
    lastMessage: "🙂 Thanks for stopping by. What services are you looking for? Well, this is a LIVE chat. I am not a BOT :)"
  },
  {
    id: "#6217128",
    name: "",
    agent: "Arthur",
    time: "18 hrs ago",
    rating: null,
    messages: 2,
    lastMessage: "Hi! Thanks for stopping by. What services are you looking for? Feel free to ask for assistance. You're talking to a"
  },
  {
    id: "#77170191",
    name: "",
    agent: "Mia Hoffman",
    time: "18 hrs ago",
    rating: null,
    messages: 3,
    lastMessage: "Hi! Thanks for stopping by. What services are you looking for? Btw I am not a bot allow me to assist you further"
  },
  {
    id: "#83951273",
    name: "",
    agent: "Mia Hoffman - Arthur",
    time: "18 hrs ago",
    rating: null,
    messages: 10,
    lastMessage: "Hi! Thanks for stopping by. What services are you looking for? Feel free to ask for assistance. You're talking to a"
  },
  {
    id: "#78819721",
    name: "",
    agent: "Mia Hoffman",
    time: "18 hrs ago",
    rating: null,
    messages: 2,
    lastMessage: "Hi! Thanks for stopping by. What services are you looking for? Btw I am not a bot allow me to assist you further"
  },
  {
    id: "#78819721",
    name: "",
    agent: "Arthur",
    time: "18 hrs ago",
    rating: null,
    messages: 9,
    lastMessage: "Hi! Thanks for stopping by. What services are you looking for? Feel free to ask for assistance. You're talking to a"
  },
  {
    id: "",
    name: "",
    agent: "Arthur",
    time: "",
    rating: null,
    messages: 0,
    lastMessage: "meet.google.com is sharing your screen. What services are you looking for? Feel free to ask for assistance. You're talking to a"
  }
];

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVisitor, setSelectedVisitor] = useState<ChatHistoryItem | null>(null);
  const totalItems = 498;
  const itemsPerPage = 10;

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleRowClick = (item: ChatHistoryItem) => {
    setSelectedVisitor(item);
  };

  const closeVisitorDetails = () => {
    setSelectedVisitor(null);
  };

  const renderStarRating = (rating: number | null) => {
    if (!rating) return "-";
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatMessages = (count: number) => {
    if (count === 0) return "";
    return count.toString();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className={`flex-1 ${selectedVisitor ? 'mr-96' : ''} transition-all duration-300`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">History</h1>
            <div className="flex items-center gap-4">
              <User className="w-8 h-8 p-2 bg-gray-200 rounded-full text-gray-600" />
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={clearSearch}>
                Clear search
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">0 unread</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">Page 1 of 498</span>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-900">Name</TableHead>
                  <TableHead className="font-semibold text-gray-900">Agent</TableHead>
                  <TableHead className="font-semibold text-gray-900">Time</TableHead>
                  <TableHead className="font-semibold text-gray-900">Rating</TableHead>
                  <TableHead className="font-semibold text-gray-900">Messages</TableHead>
                  <TableHead className="font-semibold text-gray-900 w-1/2">Messages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chatHistoryData.map((item, index) => (
                  <TableRow 
                    key={index} 
                    className={`hover:bg-gray-50 cursor-pointer ${selectedVisitor?.id === item.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleRowClick(item)}
                  >
                    <TableCell className="font-medium text-gray-900">
                      {item.name || item.id}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {item.agent}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {item.time}
                    </TableCell>
                    <TableCell>
                      {renderStarRating(item.rating)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="rounded-full w-6 h-6 flex items-center justify-center p-0 text-xs">
                        {formatMessages(item.messages)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm max-w-0">
                      <div className="truncate">
                        {item.lastMessage}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

  
      </div>

      {/* Right Sidebar - Visitor Details */}
      {selectedVisitor && (
        <HistorySidebar 
          visitor={selectedVisitor} 
          onClose={closeVisitorDetails} 
        />
      )}
    </div>
  );
}