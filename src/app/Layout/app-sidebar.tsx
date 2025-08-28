"use client";

import {
  FiHome,
  FiUsers,
  FiClock,
  FiChevronDown,
} from "react-icons/fi";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

const navItems = [
  { title: "Home", url: "/dashboard", icon: FiHome },
  { title: "Visitors", url: "/dashboard/visitors", icon: FiUsers },
  { title: "History", url: "/dashboard/history", icon: FiClock },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="bg-[#03363d] text-white"> {/* force background from screenshot */}
      {/* Header */}
      <SidebarHeader className="pt-4 px-3">
        <div className="flex items-center gap-3 w-full p-3 rounded-md bg-transparent hover:bg-teal-800 border border-teal-700 cursor-pointer">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-white">Online</span>
          <FiChevronDown className="w-4 h-4 ml-auto text-teal-300" />
        </div>
      </SidebarHeader>

      {/* Menu Items */}
      <SidebarContent className="flex-1 pt-4 px-3">
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.url;

            return (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url} className="block">
                  <SidebarMenuButton
                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors duration-200
                      ${isActive
                        ? "bg-teal-700 text-white shadow-sm"
                        : "bg-transparent hover:bg-teal-800 text-gray-300 hover:text-white"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
