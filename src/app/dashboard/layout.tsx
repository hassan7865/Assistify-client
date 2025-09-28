import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import DashboardSidebar from "../Layout/dashboard-sidebar";
import Header from "../Layout/header";
import { ProtectedRoute } from "@/components/protected-route";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
     
          <SidebarProvider defaultOpen={true} variant="dashboard">
            <div className="flex h-screen w-full overflow-hidden">
              <DashboardSidebar />

              <SidebarInset className="flex flex-col flex-1 h-full overflow-hidden">
                <Header />
                <div className="flex flex-col flex-1 overflow-hidden">
                 
                  {/* Page Content */}
                  <div className="fflex-1 overflow-y-auto custom-scrollbar p-1">
                    {children}
                  </div>
                </div>
              </SidebarInset>
            </div>
          </SidebarProvider>
    </ProtectedRoute>
  );
}
