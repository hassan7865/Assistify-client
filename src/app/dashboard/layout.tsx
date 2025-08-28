import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import AppSidebar from "../Layout/app-sidebar";
import Header from "../Layout/header";
import { ProtectedRoute } from "@/components/protected-route";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar />

          <SidebarInset className="flex flex-col flex-1 h-full overflow-hidden">
            <Header />
            <div className="flex-1 overflow-y-auto p-1">
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
