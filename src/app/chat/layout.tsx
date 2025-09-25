import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import AppSidebar from "../Layout/app-sidebar";
import Header from "../Layout/header";
import { ProtectedRoute } from "@/components/protected-route";
import { VisitorActionsProvider } from "@/contexts/visitor-actions";
import { VisitorRequestsProvider } from "@/contexts/visitor-requests";
import { GlobalChatProvider } from "@/contexts/global-chat-context";
import GlobalChatComponents from "@/components/global-chat-components";
import VisitorMonitor from "./components/visitor-monitor";
import GlobalMinimizedChatTabs from "./components/global-minimized-chat-tabs";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <GlobalChatProvider>
        <VisitorRequestsProvider>
          <VisitorActionsProvider>
            <SidebarProvider defaultOpen={true} variant="sidebar">
              <div className="flex h-screen w-full overflow-hidden relative">
                <AppSidebar />

                <SidebarInset className="flex flex-col flex-1 h-full overflow-hidden">
                  <Header />
                  <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Global Visitor Monitor - Runs regardless of current page */}
                    <VisitorMonitor />
                    
                    {/* Page Content */}
                    <div className="flex-1 overflow-y-auto p-1">
                      {children}
                    </div>
                  </div>
                </SidebarInset>
                
                {/* Global Minimized Chat Tabs - Visible on all chat pages */}
                <GlobalMinimizedChatTabs />
              </div>
            </SidebarProvider>
          </VisitorActionsProvider>
        </VisitorRequestsProvider>
        <GlobalChatComponents />
      </GlobalChatProvider>
    </ProtectedRoute>
  );
}
