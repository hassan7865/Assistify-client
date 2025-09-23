import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import AppSidebar from "../Layout/app-sidebar";
import Header from "../Layout/header";
import { ProtectedRoute } from "@/components/protected-route";
import { VisitorActionsProvider } from "@/contexts/visitor-actions";
import { VisitorRequestsProvider } from "@/contexts/visitor-requests";
import VisitorMonitor from "./components/visitor-monitor";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <VisitorRequestsProvider>
        <VisitorActionsProvider>
          <SidebarProvider defaultOpen={true}>
            <div className="flex h-screen w-full overflow-hidden">
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
            </div>
          </SidebarProvider>
        </VisitorActionsProvider>
      </VisitorRequestsProvider>
    </ProtectedRoute>
  );
}
