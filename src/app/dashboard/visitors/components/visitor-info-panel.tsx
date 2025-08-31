"use client";

import React, { useEffect, useState } from 'react';
import { User, Edit2, MapPin, Monitor, Clock } from 'lucide-react';

interface VisitorInfoPanelProps {
  visitor: {
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
  };
}

const VisitorInfoPanel: React.FC<VisitorInfoPanelProps> = ({ visitor }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    setName(visitor.metadata?.name || '');
    setEmail(visitor.metadata?.email || '');
  }, [visitor.metadata?.name, visitor.metadata?.email]);

  return (
    <div className="w-96 flex flex-col bg-gray-50 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Visitor Details */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Visitor Details
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Add name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Add email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Add phone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Notes
            </h3>
          </div>
          <div className="p-4">
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add visitor notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Tags</h3>
          </div>
          <div className="p-4">
            <input 
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add tags (comma separated)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Visitor Stats */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Visitor Information</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-lg font-bold text-gray-900">{visitor.agent_id ? 'Assigned' : 'Unassigned'}</div>
                <div className="text-xs text-gray-600">Status</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-lg font-bold text-gray-900">{visitor.agent_name || 'Unassigned'}</div>
                <div className="text-xs text-gray-600">Agent</div>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </h3>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <div><span className="font-medium">Country:</span> {visitor.metadata?.country || 'Unknown'}</div>
            <div><span className="font-medium">Region:</span> {visitor.metadata?.region || 'Unknown'}</div>
            <div><span className="font-medium">City:</span> {visitor.metadata?.city || 'Unknown'}</div>
            <div><span className="font-medium">IP:</span> {visitor.metadata?.ip_address || 'Unknown'}</div>
            <div><span className="font-medium">Timezone:</span> {visitor.metadata?.timezone || 'Unknown'}</div>
          </div>
        </div>

        {/* Device Info */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Device Info
            </h3>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <div><span className="font-medium">Browser:</span> {visitor.metadata?.browser || 'Unknown'}</div>
            <div><span className="font-medium">OS:</span> {visitor.metadata?.os || 'Unknown'}</div>
            <div><span className="font-medium">Device:</span> {visitor.metadata?.device_type || 'Unknown'}</div>
            <div><span className="font-medium">User Agent:</span> <span className="text-xs break-all">{visitor.metadata?.user_agent || 'Unknown'}</span></div>
          </div>
        </div>

        {/* Session Details */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Session Details
            </h3>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <div><span className="font-medium">Started:</span> {visitor.started_at ? new Date(visitor.started_at).toLocaleString() : 'Unknown'}</div>
            <div><span className="font-medium">Status:</span> {visitor.status}</div>
            <div><span className="font-medium">Session ID:</span> <span className="text-xs break-all">{visitor.session_id || 'Unknown'}</span></div>
            <div><span className="font-medium">Referrer:</span> <span className="text-xs break-all">{visitor.metadata?.referrer || 'Direct'}</span></div>
            <div><span className="font-medium">Page URL:</span> <span className="text-xs break-all">{visitor.metadata?.page_url || 'Unknown'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorInfoPanel;


