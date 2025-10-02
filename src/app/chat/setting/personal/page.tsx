"use client"

import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink, Upload, User } from "lucide-react"

export default function PersonalizePage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading user information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 min-h-screen bg-white">
      <div className="max-w-[75%]">

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <div className="bg-gray-100 border-b border-gray-200 mb-4">
          <TabsList className="flex w-fit bg-transparent h-auto p-0 gap-0">
            <TabsTrigger 
              value="profile" 
              className="text-xs font-bold px-2 py-1 bg-white text-gray-800 border-t border-l border-r border-blue-300 rounded-none data-[state=active]:bg-blue-100 data-[state=active]:text-gray-800 relative min-w-fit cursor-pointer"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="sounds" 
              className="text-xs font-bold px-2 py-1 bg-white text-gray-800 border-l border-gray-300 rounded-none data-[state=active]:bg-blue-100 data-[state=active]:text-gray-800 data-[state=active]:border-blue-300 min-w-fit cursor-pointer"
            >
              Sounds & notifications
            </TabsTrigger>
            <TabsTrigger 
              value="timeout" 
              className="text-xs font-bold px-2 py-1 bg-white text-gray-800 border-l border-gray-300 rounded-none data-[state=active]:bg-blue-100 data-[state=active]:text-gray-800 data-[state=active]:border-blue-300 min-w-fit cursor-pointer"
            >
              Idle timeout
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="text-xs font-bold px-2 py-1 bg-white text-gray-800 border-l border-gray-300 rounded-none data-[state=active]:bg-blue-100 data-[state=active]:text-gray-800 data-[state=active]:border-blue-300 min-w-fit cursor-pointer"
            >
              Email reports
            </TabsTrigger>
            <TabsTrigger 
              value="labs" 
              className="text-xs font-bold px-2 py-1 bg-white text-gray-800 border-l border-gray-300 rounded-none data-[state=active]:bg-blue-100 data-[state=active]:text-gray-800 data-[state=active]:border-blue-300 min-w-fit cursor-pointer"
            >
              Labs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="mt-0">
          <div className="space-y-4">
            {/* User Information Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-medium text-gray-900">Name:</h3>
                  <p className="text-xs text-gray-600">{user.name || user.organization_name || "Not provided"}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-medium text-gray-900">Email:</h3>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-medium text-gray-900">Profile:</h3>
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 p-0 h-auto">
                  Edit profile
                  <ExternalLink className="w-2.5 h-2.5 ml-1" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">Update your name, email, and password</p>
            </div>

            {/* Editable Profile Details */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-900 mb-1 block">Display name:</label>
                <Input 
                  value={user.name || user.organization_name || ""} 
                  className="text-xs border-gray-300 focus:border-gray-400 h-7"
                  placeholder="Enter display name"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-900 mb-1 block">Tagline:</label>
                <Input 
                  placeholder="Enter tagline" 
                  className="text-xs border-gray-300 focus:border-gray-400 h-7"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-900 mb-1 block">Avatar:</label>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 border border-gray-300 rounded bg-gray-50 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      <Button size="sm" className="text-xs bg-gray-800 hover:bg-gray-900 text-white px-2 py-1 h-6">
                        Upload image
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs border-gray-300 text-gray-700 px-2 py-1 h-6">
                        Remove
                      </Button>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-gray-500">Appears when chatting with visitors using the new widget</p>
                      <p className="text-xs text-gray-500">Maximum size 100 KB, recommended dimensions 50x50px</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

     
      </Tabs>
      </div>
    </div>
  )
}
