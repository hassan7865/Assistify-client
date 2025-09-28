"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search,
  ChevronLeft,
  ChevronsUpDown,
  ExternalLink,
  Building,
  Plus
} from "lucide-react";

// Mock data for organizations
const mockOrganizations = [
  {
    id: 1,
    name: "Wordpress Prof",
    domain: "-",
    tags: "-",
    createdAt: "Apr 13, 2023",
    lastUpdated: "Apr 13, 2023"
  },
  {
    id: 2,
    name: "Tech Solutions Inc",
    domain: "techsolutions.com",
    tags: "Technology, Enterprise",
    createdAt: "Mar 15, 2023",
    lastUpdated: "Apr 10, 2023"
  },
  {
    id: 3,
    name: "Creative Agency",
    domain: "creativeagency.co",
    tags: "Design, Marketing",
    createdAt: "Feb 28, 2023",
    lastUpdated: "Apr 05, 2023"
  },
  {
    id: 4,
    name: "Global Corp",
    domain: "globalcorp.net",
    tags: "Enterprise, Finance",
    createdAt: "Jan 20, 2023",
    lastUpdated: "Mar 30, 2023"
  },
  {
    id: 5,
    name: "StartupXYZ",
    domain: "startupxyz.io",
    tags: "Startup, Innovation",
    createdAt: "Dec 10, 2022",
    lastUpdated: "Mar 15, 2023"
  }
];

const sidebarItems = [
  { name: "All organizations", active: true },
  { name: "Suspended organizations", active: false }
];

export default function OrganizationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="relative h-screen bg-white">
      {/* Left Sidebar */}
      <div className={`absolute left-0 top-0 h-full w-64 bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out z-10 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs text-gray-800 font-semibold">Organization lists</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-3 h-3 text-gray-600" />
            </button>
          </div>
          
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <div
                key={item.name}
                className={`px-3 py-2 rounded text-xs cursor-pointer ${
                  item.active
                    ? "bg-blue-100 text-blue-800 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.name}
              </div>
            ))}
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSidebarOpen(true)}
                  className="p-1 h-8 w-8 hover:bg-gray-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-800">Organizations</h1>
                <p className="text-sm text-gray-600">Add, search, and manage your organizations all in one place.</p>
                <div className="flex items-center gap-1 mt-1">
                  <a href="#" className="text-xs text-blue-600 hover:underline">Learn about organizations</a>
                  <ExternalLink className="w-3 h-3 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8 px-3 border-blue-200 text-blue-700 hover:bg-blue-50">
                <ExternalLink className="w-3 h-3 mr-1" />
                Bulk import
              </Button>
              <Button size="sm" className="text-xs h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-3 h-3 mr-1" />
                Add organization
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search organizations" 
                className="pl-10 text-sm h-8"
              />
            </div>
          </div>

          {/* Organization Count */}
          <div className="mb-4">
            <span className="text-xs text-gray-600">{mockOrganizations.length} organization{mockOrganizations.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Organization Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden flex-1">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox className="w-3 h-3 border border-gray-300" />
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      <div className="flex items-center gap-1">
                        Name
                        <ChevronsUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold">Domain</TableHead>
                    <TableHead className="text-xs font-semibold">Tags</TableHead>
                    <TableHead className="text-xs font-semibold">
                      <div className="flex items-center gap-1">
                        Created at
                        <ChevronsUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      <div className="flex items-center gap-1">
                        Last updated
                        <ChevronsUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockOrganizations.map((organization) => (
                    <TableRow key={organization.id} className="hover:bg-gray-50">
                      <TableCell className="w-12">
                        <Checkbox className="w-3 h-3 border border-gray-300" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                            <Building className="w-3 h-3 text-gray-600" />
                          </div>
                          <a href="#" className="text-xs text-blue-600 hover:underline">{organization.name}</a>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">{organization.domain}</TableCell>
                      <TableCell className="text-xs text-gray-700">{organization.tags}</TableCell>
                      <TableCell className="text-xs text-gray-700">{organization.createdAt}</TableCell>
                      <TableCell className="text-xs text-gray-700">{organization.lastUpdated}</TableCell>
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
