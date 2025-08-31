"use client"

import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { UserRoleEnum } from "@/lib/constants"

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

  const getRoleColor = (role: string) => {
    switch (role) {
      case UserRoleEnum.CLIENT_ADMIN:
        return "bg-red-100 text-red-800 border-red-200"
      case UserRoleEnum.CLIENT_AGENT:
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="p-6 min-h-screen bg-background">
      <h1 className="text-2xl font-semibold mb-6">Personal</h1>

      <Card className="max-w-2xl shadow-sm border">
        <CardContent className="p-6 space-y-6">
          {/* Name / Organization */}
          <div className="grid grid-cols-3 gap-4">
            <span className="text-sm font-medium text-muted-foreground">
              {user.role === UserRoleEnum.CLIENT_ADMIN ? "Organization Name" : "Name"}
            </span>
            <span className="col-span-2 font-medium">
              {user.name || user.organization_name || "Not provided"}
            </span>
          </div>

          {/* Email */}
          <div className="grid grid-cols-3 gap-4">
            <span className="text-sm font-medium text-muted-foreground">Email</span>
            <span className="col-span-2 font-medium">{user.email}</span>
          </div>

          {/* Role */}
          <div className="grid grid-cols-3 gap-4">
            <span className="text-sm font-medium text-muted-foreground">Role</span>
            <div className="col-span-2">
              <Badge className={`px-3 py-1 text-sm border rounded-full ${getRoleColor(user.role)}`}>
                {user.role}
              </Badge>
            </div>
          </div>

          {/* Avatar */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <span className="text-sm font-medium text-muted-foreground">Avatar</span>
            <div className="col-span-2 flex items-center space-x-4">
              <Avatar className="h-16 w-16 border">
                <AvatarFallback className="text-xl font-semibold bg-muted text-muted-foreground">
                  {user.name
                    ? user.name.charAt(0).toUpperCase()
                    : user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                Appears when chatting with visitors
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
