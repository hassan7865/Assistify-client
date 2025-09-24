"use client";

import {
  MdHome,
  MdPeople,
  MdBusiness,
  MdBarChart,
  MdSettings,
  MdAccountBalance,
  MdAssessment,
} from "react-icons/md";
import { BsTicketPerforatedFill } from "react-icons/bs";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { UserRoleEnum } from "@/lib/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url?: string;
  icon: React.ComponentType<any>;
  roles?: UserRoleEnum[];
}

const navItems: NavItem[] = [
  { title: "Home", url: "/dashboard", icon: MdHome },
  { title: "Tickets", url: "/dashboard/tickets", icon: BsTicketPerforatedFill },
  { title: "Customers", url: "/dashboard/customers", icon: MdPeople },
  { title: "Organizations", url: "/dashboard/organizations", icon: MdBusiness },
  { title: "Reporting", url: "/dashboard/reporting", icon: MdBarChart },
];

const getNavItems = (userRole?: UserRoleEnum): NavItem[] => {
  return navItems.filter((item) => !item.roles || item.roles.includes(userRole!));
};

export default function DashboardSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const filteredNavItems = getNavItems(user?.role as UserRoleEnum);

  return (
    <Sidebar 
      className="border-r border-gray-200 bg-[#03363d]" 
      style={{ width: '4rem' }}
      collapsible="none"
    >
      <SidebarHeader className="p-2">
        <div className="flex items-center justify-center">
          <Image
            src="/vercel.svg"
            alt="Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-0">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.url;
            
            if (item.url) {
              return (
                <Link key={item.title} href={item.url}>
                  <div
                    className={`w-full h-12 flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-[#56777a] text-white"
                        : "text-gray-400 hover:bg-[#56777a] hover:text-white"
                    }`}
                    title={item.title}
                  >
                    <item.icon className="w-6 h-6" />
                  </div>
                </Link>
              );
            } else {
              return (
                <div
                  key={item.title}
                  className="w-full h-12 flex items-center justify-center text-gray-400 cursor-not-allowed opacity-50"
                  title={`${item.title} (Coming Soon)`}
                >
                  <item.icon className="w-6 h-6" />
                </div>
              );
            }
          })}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
