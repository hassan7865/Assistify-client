"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { UserRoleEnum } from "@/lib/constants";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Hello, {user?.name || user?.organization_name || 'User'}!
      </h1>
      

      {/* Visitors Card */}
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-700" />
            <CardTitle>Visitors</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            See a list of visitors to your website and start a conversation.
          </p>
          <Link
            href={user?.role === UserRoleEnum.CLIENT_ADMIN ? '/dashboard/history' : '/dashboard/visitors'}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View visitors {user?.role === UserRoleEnum.CLIENT_ADMIN ? 'history' : 'list'}
          </Link>
        </CardContent>
      </Card>

      {/* Agents Card - For both Client Admin and Client Agent */}
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-700" />
            <CardTitle>Team Agents</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            {user?.role === UserRoleEnum.CLIENT_ADMIN 
              ? 'Manage your team members and their roles for handling customer chats.'
              : 'View your team members and their roles.'
            }
          </p>
          <Link
            href="/dashboard/setting/agents"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {user?.role === UserRoleEnum.CLIENT_ADMIN ? 'Manage agents' : 'View agents'}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
