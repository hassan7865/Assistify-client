"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  User,
  Mail,
  Calendar,
  Check,
} from "lucide-react";
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
      const response = await api.get(`/auth/agents/${user?.client_id}`);

      if (response.status === 200) {
        setAgents(response.data.agents || []);
      }
    } catch (error) {
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

  const getStatusColor = (agent: Agent) => {
    // Mock status for demo - in real app this would come from API
    const statuses = ["online", "offline", "away"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const enabledAgents = agents.filter((agent) => true); // All agents are enabled in current API

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
    <div className="p-4 bg-white min-h-screen">
      {/* Top Control Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 w-48 h-7 text-xs border-gray-300"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Only show Create Agent button for CLIENT_ADMIN users */}
          {user?.role === UserRoleEnum.CLIENT_ADMIN && (
            <CreateAgentDialog onAgentCreated={handleAgentCreated} />
          )}

           <span className="text-xs text-gray-600">
             {enabledAgents.length} enabled / {agents.length} agents
           </span>
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
                <TableHead className="text-xs font-medium text-gray-900 py-2">
                  Display name
                </TableHead>
                <TableHead className="text-xs font-medium text-gray-900 py-2">
                  Name
                </TableHead>
                <TableHead className="text-xs font-medium text-gray-900 py-2">
                  Email
                </TableHead>
                <TableHead className="text-xs font-medium text-gray-900 py-2">
                  Support email
                </TableHead>
                <TableHead className="text-xs font-medium text-gray-900 py-2">
                  Role
                </TableHead>
                <TableHead className="text-xs font-medium text-gray-900 py-2">
                  Enabled
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id} className="hover:bg-gray-50">
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 w-3 h-3"
                      />
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(
                          agent
                        )}`}
                      ></div>
                      <span className="text-xs text-gray-900">
                        {agent.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 py-2">
                    {agent.name}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 py-2">
                    {agent.email}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 py-2">
                    {/* Support email would come from API if available */}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 py-2">
                    {agent.role}
                  </TableCell>
                  <TableCell className="py-2">
                    <Check className="w-4 h-4 text-blue-600" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Bottom Message */}
      <div className="text-center mt-6">
        <p className="text-xs text-gray-600">
          Add agents to serve more visitors, respond faster to chats, and
          improve customer satisfaction.
        </p>
      </div>
    </div>
  );
};

export default AgentsPage;
