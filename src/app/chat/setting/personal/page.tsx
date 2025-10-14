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

      {/* Header */}
  
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
        <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Profile</h1>
        <div className="w-12 h-0.5 bg-blue-600"></div>
        <div className="w-full h-px bg-gray-200 mt-4"></div>
      </div>

          <div className="space-y-8">
            {/* User Information Section - Static */}
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-24 text-xs font-medium text-gray-900">Name</div>
                <div className="text-xs text-gray-600">{user.name || user.organization_name || "Not provided"}</div>
              </div>
              
              <div className="flex items-start">
                <div className="w-24 text-xs font-medium text-gray-900">Email</div>
                <div className="text-xs text-gray-600">{user.email}</div>
              </div>
              
              <div className="flex items-start">
                <div className="w-24 text-xs font-medium text-gray-900">Profile</div>
                <div className="space-y-1">
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 p-0 h-auto">
                    Edit profile
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                  <p className="text-xs text-gray-500">Update your name, email, and password</p>
                </div>
              </div>
            </div>

            {/* Editable Profile Details */}
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-24 text-xs font-medium text-gray-900">Display name</div>
                <div className="flex-1 max-w-xs">
                  <Input 
                    value={user.name || user.organization_name || ""} 
                    className="text-xs border-gray-300 focus:border-gray-400 h-8"
                    placeholder="Enter display name"
                  />
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-24 text-xs font-medium text-gray-900">Tagline</div>
                <div className="flex-1 max-w-xs">
                  <Input 
                    placeholder="Enter tagline" 
                    className="text-xs border-gray-300 focus:border-gray-400 h-8"
                  />
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-24 text-xs font-medium text-gray-900">Avatar</div>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 border border-gray-300 rounded bg-gray-50 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button size="sm" className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 h-7 border border-gray-300">
                        Upload image
                      </Button>
                      <Button size="sm" className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 h-7 border border-gray-300">
                        Remove
                      </Button>
                    </div>
                    <div className="space-y-1">
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
