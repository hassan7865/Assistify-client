"use client";

import {
  MdHome,
  MdPeople,
  MdAccessTime,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdSettings,
  MdPerson,
  MdTune,
  MdBarChart,
  MdMonitor,
  MdSecurity,
  MdGpsFixed,
  MdFlashOn,
  MdFlag,
} from "react-icons/md";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useVisitorRequests } from "@/contexts/visitor-requests";
import { useVisitorActions } from "@/contexts/visitor-actions";
import { UserRoleEnum } from "@/lib/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  title: string;
  url?: string;
  icon: React.ComponentType<any>;
  children?: NavItem[];
  roles?: UserRoleEnum[];
  badge?: number;
}

type Status = "online" | "away" | "invisible";

const statusConfig = {
  online: { label: "Online", color: "bg-green-500", dotColor: "rgb(30, 184, 72)" },
  away: { label: "Away", color: "bg-yellow-500", dotColor: "rgb(255, 178, 77)" },
  invisible: { label: "Invisible", color: "bg-gray-500", dotColor: "rgb(153, 153, 153)" },
};

const navItems: NavItem[] = [
  { title: "Home", url: "/dashboard", icon: MdHome },
  { title: "Visitors", url: "/dashboard/visitors", icon: MdPeople, roles: [UserRoleEnum.CLIENT_AGENT] },
  { title: "History", url: "/dashboard/history", icon: MdAccessTime },
  { title: "Analytics", url: "/dashboard/analytics", icon: MdBarChart },
  { title: "Monitor", url: "/dashboard/monitor", icon: MdMonitor },
  {
    title: "Settings",
    icon: MdSettings,
    children: [
      { title: "Agents", url: "/dashboard/setting/agents", icon: MdPerson },
      { title: "Departments", url: "/dashboard/setting/departments", icon: MdPeople },
      { title: "Roles", url: "/dashboard/setting/roles", icon: MdSecurity },
      { title: "Routing", url: "/dashboard/setting/routing", icon: MdTune },
      { title: "Shortcuts", url: "/dashboard/setting/shortcuts", icon: MdFlashOn },
      { title: "Banned", url: "/dashboard/setting/banned", icon: MdFlag },
      { title: "Triggers", url: "/dashboard/setting/triggers", icon: MdGpsFixed },
    ],
  },
];

const getNavItems = (userRole?: UserRoleEnum): NavItem[] => {
  const filterByRole = (items: NavItem[]): NavItem[] => {
    return items
      .filter((item) => !item.roles || item.roles.includes(userRole!))
      .map((item) => ({
        ...item,
        children: item.children ? filterByRole(item.children) : undefined,
      }));
  };

  return filterByRole(navItems);
};

interface NavItemProps {
  item: NavItem;
  level?: number;
  isOpen?: boolean;
  onToggle?: () => void;
}

function NavItemComponent({ item, level = 0, isOpen, onToggle }: NavItemProps) {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.url ? pathname === item.url : false;
  const isChildActive = hasChildren && item.children!.some((child) => pathname === child.url);
  const showChildren = hasChildren && isOpen;

  if (hasChildren) {
    return (
      <div>
        <div
          className={`h-12 px-5 cursor-pointer whitespace-nowrap flex items-center ${
            isChildActive || isOpen
              ? "bg-[#56777a] opacity-100"
              : "opacity-55 hover:opacity-100"
          }`}
          onClick={onToggle}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          <div className="flex-1 pl-5 text-white text-sm flex items-center">
            <span className="w-auto overflow-hidden whitespace-nowrap text-ellipsis">
              {item.title}
            </span>
          </div>
          {isOpen ? (
            <MdKeyboardArrowUp className="w-4 h-4 flex-shrink-0 flex items-center justify-center" />
          ) : (
            <MdKeyboardArrowDown className="w-4 h-4 flex-shrink-0 flex items-center justify-center" />
          )}
        </div>

        {showChildren && (
          <div className="py-2.5 bg-[#012c32]">
            {item.children!.map((child) => (
              <NavItemComponent key={child.title} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSubItem = level > 0;
  const itemHeight = isSubItem ? "h-9" : "h-12";
  const itemFontSize = isSubItem ? "text-xs" : "text-sm";
  const iconVisibility = isSubItem ? "invisible" : "visible";

  return (
    <Link href={item.url!} className="block">
      <div
        className={`${itemHeight} px-5 cursor-pointer whitespace-nowrap flex items-center ${
          isActive
            ? "bg-[#56777a] opacity-100"
            : "opacity-55 hover:opacity-100"
        } ${isSubItem ? "bg-transparent" : ""}`}
      >
        <item.icon className={`w-4 h-4 flex-shrink-0 ${iconVisibility}`} />
        <div className={`flex-1 pl-5 text-white ${itemFontSize} flex items-center`}>
          <span className="w-auto overflow-hidden whitespace-nowrap text-ellipsis">
            {item.title}
          </span>
          {item.badge && (
            <div className="ml-auto w-7 h-5 bg-white text-[#03363d] text-xs rounded-full flex items-center justify-center flex-shrink-0">
              {item.badge}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function AppSidebar() {
  const { user } = useAuth();
  const { requests, getRequestCount, serveRequest } = useVisitorRequests();
  const { takeVisitor } = useVisitorActions();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ Settings: true, Team: true });
  const [currentStatus, setCurrentStatus] = useState<Status>("invisible");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const toggleItem = (title: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleServeRequest = () => {
    const request = serveRequest();
    if (request) {
      takeVisitor(request.visitor_id);
    }
  };

  const requestCount = getRequestCount();

  const handleStatusChange = (status: Status) => {
    setCurrentStatus(status);
    setStatusDropdownOpen(false);
  };

  const filteredNavItems = getNavItems(user?.role as UserRoleEnum);

  return (
    <Sidebar className="bg-[#03363d] text-white w-50 custom-scrollbar">
      {/* Logo Section */}
      <div className="flex justify-center py-2.5">
        <div className="w-7.5 h-7.5 flex items-center justify-center">
          <Image
            src="/vercel.svg"
            alt="Next.js Logo"
            width={30}
            height={30}
            className="w-7.5 h-7.5"
          />
        </div>
      </div>

      {/* Status Indicator */}
      <div className="relative h-12 px-5 z-10">
        <div 
          className="relative w-40 h-7.5 bg-[rgba(7,27,29,0.5)] rounded-full px-2.5 pl-5 cursor-pointer select-none"
          onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
        >
          <div 
            className="inline-block w-2.5 h-2.5 my-2.5 mr-2.5 rounded-full"
            style={{ backgroundColor: statusConfig[currentStatus].dotColor }}
          ></div>
          <span 
            className="inline-block text-xs align-top leading-7.5 text-white w-24 text-ellipsis overflow-hidden whitespace-nowrap"
            title={statusConfig[currentStatus].label}
          >
            {statusConfig[currentStatus].label}
          </span>
          <MdKeyboardArrowDown className="inline-block w-3 h-3 align-top my-3" />
        </div>

        {/* Status Dropdown */}
        {statusDropdownOpen && (
          <div className="absolute top-11 left-5 z-10 bg-white w-auto py-2.5 rounded shadow-lg">
            <div 
              className="px-5 text-xs cursor-pointer min-w-40 whitespace-nowrap hover:bg-gray-100"
              onClick={() => handleStatusChange("online")}
            >
              <div className="inline-block w-2.5 h-2.5 my-2.5 mr-2.5 rounded-full bg-green-500"></div>
              <span className="inline-block text-black text-xs align-top leading-8">Online</span>
            </div>
            <div 
              className="px-5 text-xs cursor-pointer min-w-40 whitespace-nowrap hover:bg-gray-100"
              onClick={() => handleStatusChange("away")}
            >
              <div className="inline-block w-2.5 h-2.5 my-2.5 mr-2.5 rounded-full bg-yellow-500"></div>
              <span className="inline-block text-black text-xs align-top leading-8">Away</span>
            </div>
            <div 
              className="px-5 text-xs cursor-pointer min-w-40 whitespace-nowrap hover:bg-gray-100"
              onClick={() => handleStatusChange("invisible")}
            >
              <div className="inline-block w-2.5 h-2.5 my-2.5 mr-2.5 rounded-full bg-gray-500"></div>
              <span className="inline-block text-black text-xs align-top leading-8">Invisible</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <SidebarContent className="flex-1 overflow-y-auto custom-scrollbar">
        <SidebarMenu>
          {filteredNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.children ? (
                <NavItemComponent
                  item={item}
                  isOpen={openItems[item.title]}
                  onToggle={() => toggleItem(item.title)}
                />
              ) : (
                <NavItemComponent item={item} />
              )}
            </SidebarMenuItem>
          ))}
          
          {/* Team Section with Arthur */}
          <SidebarMenuItem>
            <div>
              <div 
                className={`h-12 px-5 cursor-pointer whitespace-nowrap flex items-center ${
                  openItems.Team
                    ? "bg-[#56777a] opacity-100"
                    : "bg-[rgba(255,255,255,0.2)] opacity-55 hover:opacity-100"
                }`}
                onClick={() => toggleItem("Team")}
              >
                <MdPeople className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 pl-5 text-white text-sm flex items-center">
                  <span className="w-auto overflow-hidden whitespace-nowrap text-ellipsis">Team</span>
                </div>
                {openItems.Team ? (
                  <MdKeyboardArrowUp className="w-4 h-4 flex-shrink-0 flex items-center justify-center" />
                ) : (
                  <MdKeyboardArrowDown className="w-4 h-4 flex-shrink-0 flex items-center justify-center" />
                )}
              </div>
              {openItems.Team && (
                <div className="py-2.5 bg-[#012c32]">
                  <div className="h-12 px-5 cursor-pointer whitespace-nowrap flex items-center opacity-55">
                    <div className="w-5 h-5 flex-shrink-0 invisible"></div>
                    <div className="flex-1 pl-5 text-white text-sm flex items-center">
                      <span className="w-auto overflow-hidden whitespace-nowrap text-ellipsis">View all</span>
                      <div className="ml-auto w-7 h-5 bg-white text-[#03363d] text-xs rounded-full flex items-center justify-center flex-shrink-0">1</div>
                    </div>
                  </div>
                  <div className="bg-[#012c32] h-9 px-5 pl-16 opacity-50 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2.5 flex-shrink-0"></div>
                    <span className="text-white text-xs">Arthur</span>
                  </div>
                </div>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* Bottom Request Counter */}
      <div className="px-2.5 py-2.5">
        {requestCount > 0 ? (
          <button
            onClick={handleServeRequest}
            className="w-full h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-all duration-200 animate-request-bounce"
            title={`Serve request (${requestCount} pending)`}
          >
            Serve {requestCount} request{requestCount > 1 ? 's' : ''}
          </button>
        ) : (
          <div className="h-10 rounded-full bg-[rgba(7,27,29,0.5)] flex items-center justify-center">
            <span 
              className="text-white opacity-40 text-sm leading-5"
              title="0 requests"
            >
              0 requests
            </span>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
