'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut, User, ChevronDown, MessageCircle, HelpCircle, Phone, Search, ShoppingCart, Calendar, ClipboardCheck, Bot, Grid3X3, Grid2X2, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean); 
  const { user, logout } = useAuth();
  
  // Check if current route contains 'chat'
  const isChatActive = pathname.includes('/chat');

  const filteredSegments = segments.filter(segment => 
    segment.toLowerCase() !== 'dashboard' && segment.toLowerCase() !== 'setting'
  );

  return (
    <header className="flex h-12 shrink-0 items-center px-4 transition-[width,height] ease-linear group-[data-collapsible=icon]/sidebar-wrapper:h-10">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />

        {/* Breadcrumb starts here */}
        <nav className="flex items-center text-xs text-muted-foreground space-x-1">
          <Link href="/dashboard" className="hover:text-primary font-medium">Home</Link>
          {filteredSegments.map((segment, index) => {
            const href = '/' + filteredSegments.slice(0, index + 1).join('/');
            const isLast = index === filteredSegments.length - 1;

            return (
              <React.Fragment key={href}>
                <span className="px-1">/</span>
                {isLast ? (
                  <span className="text-foreground font-medium capitalize">{segment}</span>
                ) : (
                  <Link
                    href={href}
                    className={cn('hover:text-primary capitalize')}
                  >
                    {segment}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
      
      {/* User menu */}
      <div className="ml-auto flex items-center gap-2">
        {/* Product Dropdown */}
        <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-xs p-2">
          <Grid2X2 className="h-4 w-4 text-gray-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-0">
         {/* Support */}
         <DropdownMenuItem className="px-4 py-3 cursor-pointer">
           <div className="flex items-center gap-3 w-full">
             <div className="w-4 h-4 bg-gray-800 rounded-sm flex items-center justify-center">
               <div className="w-2 h-2 bg-white rounded-[1px]"></div>
             </div>
             <span className="text-gray-900">Support</span>
           </div>
         </DropdownMenuItem>

         {/* Guide */}
         <DropdownMenuItem className="px-4 py-3 cursor-pointer">
           <div className="flex items-center gap-3 w-full">
             <div className="w-4 h-4 bg-gray-800 flex items-center justify-center">
               <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-white"></div>
             </div>
             <span className="text-gray-900">Guide</span>
           </div>
         </DropdownMenuItem>

         {/* Chat - Active/Selected with orange left border */}
         <DropdownMenuItem asChild>
           <Link 
             href="/chat" 
             className={`px-4 py-3 cursor-pointer relative flex items-center gap-3 w-full ${
               isChatActive 
                 ? 'bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-500' 
                 : 'hover:bg-gray-50'
             }`}
           >
             <div className="w-4 h-4 flex items-center justify-center">
               <div className={`w-3 h-3 rounded-sm flex items-center justify-center ${
                 isChatActive ? 'bg-orange-500' : 'bg-gray-800'
               }`}>
                 <div className="w-1.5 h-1.5 bg-white rounded-[1px] transform rotate-45"></div>
               </div>
             </div>
             <span className={`font-medium ${
               isChatActive ? 'text-orange-700' : 'text-gray-900'
             }`}>Chat</span>
           </Link>
         </DropdownMenuItem>

         {/* Talk */}
         <DropdownMenuItem className="px-4 py-3 cursor-pointer">
           <div className="flex items-center gap-3 w-full">
             <div className="w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center">
               <div className="w-2 h-2 bg-white rounded-full"></div>
             </div>
             <span className="text-gray-900">Talk</span>
           </div>
         </DropdownMenuItem>

         {/* Explore */}
         <DropdownMenuItem className="px-4 py-3 cursor-pointer">
           <div className="flex items-center gap-3 w-full">
             <div className="w-4 h-4 bg-gray-800 flex items-center justify-center">
               <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-white transform rotate-45"></div>
             </div>
             <span className="text-gray-900">Explore</span>
           </div>
         </DropdownMenuItem>

         {/* Sell */}
         <DropdownMenuItem className="px-4 py-3 cursor-pointer">
           <div className="flex items-center gap-3 w-full">
             <div className="w-4 h-4 bg-gray-800 flex items-center justify-center">
               <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-white transform -rotate-45"></div>
             </div>
             <span className="text-gray-900">Sell</span>
           </div>
         </DropdownMenuItem>

         {/* Workforce management */}
         <DropdownMenuItem className="px-4 py-3 cursor-pointer">
           <div className="flex items-center gap-3 w-full">
             <Calendar className="h-4 w-4 text-gray-800" />
             <span className="text-gray-900">Workforce management</span>
           </div>
         </DropdownMenuItem>

         {/* Quality assurance */}
         <DropdownMenuItem className="px-4 py-3 cursor-pointer">
           <div className="flex items-center gap-3 w-full">
             <ClipboardCheck className="h-4 w-4 text-gray-800" />
             <span className="text-gray-900">Quality assurance</span>
           </div>
         </DropdownMenuItem>

         {/* AI agents */}
         <DropdownMenuItem className="px-4 py-3 cursor-pointer">
           <div className="flex items-center gap-3 w-full">
             <Bot className="h-4 w-4 text-gray-800" />
             <span className="text-gray-900">AI agents</span>
           </div>
         </DropdownMenuItem>

         <DropdownMenuSeparator className="my-1" />

         {/* Admin Center */}
         <DropdownMenuItem className="px-4 py-3 cursor-pointer">
           <span className="text-blue-600 font-medium">Admin Center</span>
         </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-gray-600" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* User Info Section */}
            <DropdownMenuLabel className="px-4 py-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-600" />
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name || user?.organization_name}
                  </p>
                  <Link href="/chat/setting/personal" className="text-xs text-gray-500 hover:text-gray-700">
                    View Profile
                  </Link>
                </div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            {/* Menu Options */}
            <DropdownMenuItem className="px-4 py-2 cursor-pointer">
              <span className="text-sm text-gray-900">Get help</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="px-4 py-2 cursor-pointer">
              <span className="text-sm text-gray-900">Chat help center</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="px-4 py-2 cursor-pointer">
              <span className="text-sm text-gray-900">Keyboard shortcuts</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="px-4 py-2 cursor-pointer">
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-gray-900">Check connection</span>
                <Info className="h-3 w-3 text-gray-400" />
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="px-4 py-2 cursor-pointer">
              <span className="text-sm text-gray-900">Download debug report</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="px-4 py-2 cursor-pointer">
              <span className="text-sm text-gray-900">Privacy Policy</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Logout Section */}
            <DropdownMenuItem onClick={logout} className="px-4 py-2 cursor-pointer text-center justify-center">
              <span className="text-sm text-red-500">Leave session</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
