"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FiSettings, 
  FiUsers, 
  FiBarChart, 
  FiZap 
} from "react-icons/fi";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Greeting Section */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 mb-1">
          Hello, {user?.name || user?.organization_name}!
        </h1>
        <div className="w-full h-0.5 bg-gray-300 relative">
          <div className="absolute top-0 left-0 h-full bg-blue-500" style={{ width: '25%' }}></div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        {/* Widget Card */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FiSettings className="h-4 w-4 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-800">Widget</h3>
          </div>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            Embed and customize the widget on your website.
          </p>
          <Link
            href="/dashboard/setting/widget"
            className="text-xs text-blue-600 hover:text-blue-500 underline font-medium"
          >
            Manage widget
          </Link>
        </Card>

        {/* Visitors Card */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FiUsers className="h-4 w-4 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-800">Visitors</h3>
          </div>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            See a list of visitors to your website and start a conversation.
          </p>
          <Link
            href="/dashboard/visitors"
            className="text-xs text-blue-600 hover:text-blue-500 underline font-medium"
          >
            View visitors list
          </Link>
        </Card>

        {/* Analytics Card */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FiBarChart className="h-4 w-4 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-800">Analytics</h3>
          </div>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            Track the conversations you have with customers.
          </p>
          <Link
            href="/dashboard/analytics"
            className="text-xs text-blue-600 hover:text-blue-500 underline font-medium"
          >
            View analytics
          </Link>
        </Card>

        {/* Triggers Card */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FiZap className="h-4 w-4 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-800">Triggers</h3>
          </div>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            Proactively start conversations or send custom messages to leads.
          </p>
          <Link
            href="/dashboard/setting/triggers"
            className="text-xs text-blue-600 hover:text-blue-500 underline font-medium"
          >
            Manage triggers
          </Link>
        </Card>
      </div>
    </div>
  );
}
