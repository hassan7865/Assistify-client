"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FiMessageCircle, 
  FiBookOpen, 
  FiPhone, 
  FiMessageSquare 
} from "react-icons/fi";

export default function ReportingPage() {
  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Reporting</h1>
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex space-x-8">
            <button className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-2">
              Explore
            </button>
          </div>
          <a 
            href="#" 
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            Learn more
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center py-16">
        {/* Large Icon */}
        <div className="mb-8">
          <div className="relative">
            {/* Teal Triangle */}
            <div className="w-24 h-24 bg-teal-500 transform rotate-12 relative">
              <div className="absolute inset-0 bg-teal-500"></div>
            </div>
            {/* Dark Green Triangle */}
            <div className="w-16 h-16 bg-green-700 transform -rotate-12 absolute -top-2 -right-2">
              <div className="absolute inset-0 bg-green-700"></div>
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Reporting is now powered by Explore.
        </h2>

        {/* Description */}
        <p className="text-lg text-gray-600 text-center max-w-2xl mb-16">
          Zendesk Explore provides analytics for businesses to measure and improve the entire customer experience.
        </p>

        {/* Product Icons Row */}
        <div className="flex space-x-8">
          {/* Zendesk Support */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center">
                <FiMessageCircle className="w-8 h-8 text-white" />
              </div>
              {/* Notification Badge */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">10</span>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700">Zendesk Support</span>
          </div>

          {/* Zendesk Guide */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 flex items-center justify-center mb-3">
              <div className="relative">
                {/* Green shape */}
                <div className="w-8 h-8 bg-green-500 transform rotate-45 absolute -top-1 -left-1"></div>
                {/* Dark green shape */}
                <div className="w-8 h-8 bg-green-700 transform rotate-45"></div>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700">Zendesk Guide</span>
          </div>

          {/* Zendesk Talk */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 flex items-center justify-center mb-3">
              <div className="relative">
                {/* Teal semi-circle */}
                <div className="w-8 h-4 bg-teal-600 rounded-t-full"></div>
                {/* Yellow semi-circle */}
                <div className="w-8 h-4 bg-yellow-500 rounded-b-full absolute top-2"></div>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700">Zendesk Talk</span>
          </div>

          {/* Zendesk Chat */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 flex items-center justify-center mb-3">
              <div className="relative">
                {/* Orange shape */}
                <div className="w-8 h-8 bg-orange-500 transform rotate-45 absolute -top-1 -left-1"></div>
                {/* Teal shape */}
                <div className="w-8 h-8 bg-teal-600 transform rotate-45"></div>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700">Zendesk Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
