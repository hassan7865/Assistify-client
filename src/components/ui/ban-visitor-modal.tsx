"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getCountryFlag, getBrowserIcon, getOSIcon } from '@/lib/visitor-icons';
import api from '@/lib/axios';
import { toast } from 'sonner';

interface BanVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  ipAddress: string;
  visitorName?: string;
  visitorMetadata?: {
    country?: string;
    browser?: string;
    os?: string;
    user_agent?: string;
  };
  onBanSuccess?: () => void;
}

const BanVisitorModal: React.FC<BanVisitorModalProps> = ({
  isOpen,
  onClose,
  clientId,
  ipAddress,
  visitorName,
  visitorMetadata,
  onBanSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [banIpAddress, setBanIpAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBan = async () => {
    if (!ipAddress) {
      alert('IP address not available');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/chat/ban-ip', {
        client_id: clientId,
        ip_address: ipAddress,
        reason: reason.trim() || null,
      });

      if (response.data.success) {
        toast.success('Visitor banned successfully', {
          style: {
            backgroundColor: '#F78E3F',
            color: 'white',
            border: 'none',
          },
          position: 'top-center',
        });
        onBanSuccess?.();
        onClose();
        // Reset form
        setReason('');
        setBanIpAddress(false);
      } else {
        toast.error(`Failed to ban visitor: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error banning visitor:', error);
      toast.error(`Error banning visitor: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setReason('');
      setBanIpAddress(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!fixed !top-[10%] !left-[10%] !w-[80vw] !h-[80vh] !max-w-none !max-h-none !p-0 !border-0 !m-0 !rounded-none !z-[9999] !translate-x-0 !translate-y-0 flex flex-col" showCloseButton={false}>
        {/* Visitor Header - Very small */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 bg-[#303030] text-white">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-sm bg-[#10418c] flex items-center justify-center flex-shrink-0">
              <img 
                src="/user.png" 
                alt="User" 
                className="w-2.5 h-2.5 object-contain"
              />
            </div>
            <span style={{ fontSize: '12px' }} className="font-medium text-white">
              {visitorName || 'Visitor'}
            </span>
            {visitorMetadata?.country && getCountryFlag(visitorMetadata.country)}
            {visitorMetadata?.browser && getBrowserIcon(visitorMetadata.browser, visitorMetadata.user_agent, 'h-2 w-2')}
            {visitorMetadata?.os && getOSIcon(visitorMetadata.os, visitorMetadata.user_agent, 'h-2 w-2')}
          </div>
        </div>
        
        {/* Modal Content - Centered */}
        <div className="flex-1 flex flex-col justify-center items-center p-6">
          <DialogHeader className="text-center mb-6">
            <DialogTitle className="text-xl font-semibold text-gray-900">Ban visitor</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 w-full max-w-md">
          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium text-gray-700">Reason (optional)</Label>
            <Input
              id="reason"
              placeholder=""
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
              className="w-full h-8 text-sm border border-gray-300 bg-white px-3"
            />
          </div>

          {/* IP Ban Checkbox */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="ban-ip"
              checked={banIpAddress}
              onCheckedChange={(checked) => setBanIpAddress(checked as boolean)}
              disabled={isLoading}
              className="h-4 w-4"
            />
            <Label htmlFor="ban-ip" className="text-sm font-normal text-gray-700 cursor-pointer">
              Also ban visitor's IP address
            </Label>
          </div>
          </div>

          <DialogFooter className="flex justify-end space-x-3 mt-6 w-full max-w-md">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm h-8"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBan}
              disabled={isLoading || !ipAddress}
              className="text-white px-4 py-2 text-sm h-8"
              style={{ backgroundColor: '#1f73b7' }}
            >
              {isLoading ? 'Banning...' : 'Ban user'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BanVisitorModal;