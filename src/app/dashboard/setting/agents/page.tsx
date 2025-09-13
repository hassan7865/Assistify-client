"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, User, Mail, Calendar } from "lucide-react";
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
import { useAuth } from "@/contexts/auth-context";
import { UserRoleEnum } from "@/lib/constants";
import api from "@/lib/axios";
import CreateAgentDialog from "./components/create-agent-dialog";

interface Agent {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const AgentsPage = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch agents on component mount
  useEffect(() => {
    if (user?.client_id) {
      fetchAgents();
    }
  }, [user]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/auth/agents/${user?.client_id}`
      );

      if (response.status === 200) {
        setAgents(response.data.agents || []);
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentCreated = () => {
    // Refresh agents list when a new agent is created
    fetchAgents();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "TEAM_LEAD":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "AGENT":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading agents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Team Agents</h1>

          {/* Only show Create Agent button for CLIENT_ADMIN users */}
          {user?.role === UserRoleEnum.CLIENT_ADMIN && (
            <CreateAgentDialog onAgentCreated={handleAgentCreated} />
          )}
        </div>

        <p className="text-gray-600 mt-1">
          {user?.role === UserRoleEnum.CLIENT_ADMIN
            ? "Manage your team members and their roles"
            : "View your team members and their roles"}
        </p>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <span className="text-sm text-gray-600">
            {filteredAgents.length} of {agents.length} agents
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-600">Total Agents</div>
            <div className="text-2xl font-semibold text-gray-900">
              {agents.length}
            </div>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        {filteredAgents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Agents Found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery
                ? "No agents match your search criteria."
                : "You haven't created any agents yet."}
            </p>
            {!searchQuery && user?.role === UserRoleEnum.CLIENT_ADMIN && (
              <div className="flex justify-center">
                <CreateAgentDialog
                  onAgentCreated={handleAgentCreated}
                  variant="empty-state"
                />
              </div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-900">
                  Agent
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  Role
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  Email
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  Created
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  Last Updated
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-gray-500">
                          ID: {agent.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`px-3 py-1 text-sm font-medium border ${getRoleColor(
                        agent.role
                      )}`}
                    >
                      {agent.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {agent.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(agent.created_at)}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(agent.updated_at)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AgentsPage;
