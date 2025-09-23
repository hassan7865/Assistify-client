"use client";

import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRoleEnum } from '@/lib/constants';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/axios';

interface CreateAgentDialogProps {
  onAgentCreated: () => void;
  variant?: 'default' | 'empty-state';
}

const CreateAgentDialog: React.FC<CreateAgentDialogProps> = ({ onAgentCreated, variant = 'default' }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleCreateAgent = async () => {
    // Validate form
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      alert('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      setCreateLoading(true);
      const response = await api.post('/auth/agents', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        client_id: user?.client_id
      });

      if (response.status === 200) {
        // Reset form and close dialog
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setIsOpen(false);
        
        // Notify parent component to refresh agents list
        onAgentCreated();
        
      
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to create agent';
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when dialog is closed
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    }
  };

  // Only render for client admin users
  if (!user || user.role !== UserRoleEnum.CLIENT_ADMIN) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center rounded-none justify-center gap-2 bg-blue-600 hover:bg-blue-600/90 text-xs h-7 px-3">
          <Plus className="h-3 w-3" />
          {variant === 'empty-state' ? 'Create Your First Agent' : 'Create Agent'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Create New Agent</DialogTitle>
          <DialogDescription className="text-xs text-gray-600">
            Add a new team member to handle customer chats. They will receive an email with login credentials.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-3">
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="name" className="text-right text-xs font-medium">
              Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-3 h-7 text-xs border-gray-300 focus:border-gray-400"
              placeholder="Full name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="email" className="text-right text-xs font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="col-span-3 h-7 text-xs border-gray-300 focus:border-gray-400"
              placeholder="email@example.com"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="password" className="text-right text-xs font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="col-span-3 h-7 text-xs border-gray-300 focus:border-gray-400"
              placeholder="Minimum 8 characters"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="confirmPassword" className="text-right text-xs font-medium">
              Confirm
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="col-span-3 h-7 text-xs border-gray-300 focus:border-gray-400"
              placeholder="Confirm password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={createLoading}
            className="text-xs h-7 px-3 border-gray-300"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateAgent}
            disabled={createLoading}
            className="text-xs h-7 px-3 bg-blue-600 hover:bg-blue-700"
          >
            {createLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Creating...
              </>
            ) : (
              'Create Agent'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAgentDialog;
