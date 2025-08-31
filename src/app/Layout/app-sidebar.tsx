"use client";

import {
  FiHome,
  FiUsers,
  FiClock,
  FiChevronDown,
  FiSettings,
  FiUser,
  FiSliders,
} from "react-icons/fi";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
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
}

type Status = "online" | "away" | "invisible";

const statusConfig = {
  online: { label: "Online", color: "bg-green-500" },
  away: { label: "Away", color: "bg-yellow-500" },
  invisible: { label: "Invisible", color: "bg-gray-500" },
};

const navItems: NavItem[] = [
  { title: "Home", url: "/dashboard", icon: FiHome },
  { title: "History", url: "/dashboard/history", icon: FiClock },
  {
    title: "Visitors",
    url: "/dashboard/visitors",
    icon: FiUsers,
    roles: [UserRoleEnum.CLIENT_AGENT],
  },
  {
    title: "Settings",
    icon: FiSettings,
    children: [
      { title: "Personal", url: "/dashboard/setting/personal", icon: FiSliders },
      {
        title: "Agents",
        url: "/dashboard/setting/agents",
        icon: FiUser,
      },
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
        <SidebarMenuButton
          className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors duration-200 w-full
            ${
              isChildActive || isOpen
                ? "bg-teal-700 text-white shadow-sm"
                : "bg-transparent hover:bg-teal-800 text-gray-300 hover:text-white"
            }`}
          onClick={onToggle}
        >
          <item.icon className="w-4 h-4" />
          <span className="flex-1">{item.title}</span>
          <FiChevronDown
            className={`w-4 h-4 text-teal-300 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </SidebarMenuButton>

        {showChildren && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children!.map((child) => (
              <NavItemComponent key={child.title} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href={item.url!} className="block">
      <SidebarMenuButton
        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors duration-200
          ${
            isActive
              ? "bg-teal-700 text-white shadow-sm"
              : "bg-transparent hover:bg-teal-800 text-gray-300 hover:text-white"
          }`}
      >
        <item.icon className="w-4 h-4" />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </Link>
  );
}

export default function AppSidebar() {
  const { user } = useAuth();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [currentStatus, setCurrentStatus] = useState<Status>("online");

  const toggleItem = (title: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleStatusChange = (status: Status) => {
    setCurrentStatus(status);
    console.log("Status changed to:", status);
  };

  const filteredNavItems = getNavItems(user?.role as UserRoleEnum);

  return (
    <Sidebar className="bg-[#03363d] text-white">
      <SidebarHeader className="pt-4 px-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 w-full p-3 rounded-md bg-transparent hover:bg-teal-800 border border-teal-700 cursor-pointer">
              <div className={`w-3 h-3 rounded-full ${statusConfig[currentStatus].color}`}></div>
              <span className="text-sm font-medium text-white">
                {statusConfig[currentStatus].label}
              </span>
              <FiChevronDown className="w-4 h-4 ml-auto text-teal-300" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-48 bg-[#03363d] border-teal-700 text-white"
          >
            <DropdownMenuItem
              onClick={() => handleStatusChange("online")}
              className="flex items-center gap-3 cursor-pointer hover:bg-teal-700 focus:bg-teal-700"
            >
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Online</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("away")}
              className="flex items-center gap-3 cursor-pointer hover:bg-teal-700 focus:bg-teal-700"
            >
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Away</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("invisible")}
              className="flex items-center gap-3 cursor-pointer hover:bg-teal-700 focus:bg-teal-700"
            >
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span>Invisible</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent className="flex-1 pt-4 px-3">
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
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
