'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
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

  const filteredSegments = segments.filter(segment => segment.toLowerCase() != 'dashboard');

  return (
    <header className="flex h-16 shrink-0 items-center px-4 transition-[width,height] ease-linear group-[data-collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />

        {/* Breadcrumb starts here */}
        <nav className="flex items-center text-sm text-muted-foreground space-x-1">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline-block">
                {user?.name || user?.email || 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
