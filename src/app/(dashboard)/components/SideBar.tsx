"use client";

import { useUser } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../../../components/ui/sidebar";

import {
  Cog,
  Home,
  NotebookPenIcon,
  SearchIcon,
  User,
  Bell
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function AppSideBar() {
  const pathname = usePathname();
  const { user } = useUser();
  const metadata = user?.publicMetadata;
  const role = metadata?.role;

  const [unreadCount, setUnreadCount] = useState(0);

  // 🔹 Fetch unread notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        const data = await res.json();
        setUnreadCount(data.count);
      } catch {
        console.error("Failed to fetch notifications");
      }
    };

    fetchNotifications();
  }, []);

  const sideBarItems: {
    name: string;
    href: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { name: "Dashboard", href: "/dashboard", icon: <Home /> },

    ...(role === "admin"
      ? [
          { name: "Users", href: "/admin/users", icon: <User /> },
          { name: "Reports", href: "/reports", icon: <SearchIcon /> },
        ]
      : []),

    { name: "Transactions", href: "/transactions", icon: <NotebookPenIcon /> },

    // 🔔 Notifications
    {
      name: "Notifications",
      href: "/notifications",
      icon: <Bell />,
      badge: unreadCount,
    },

    { name: "Setting", href: "/setting", icon: <Cog /> },
  ];

  return (
    <Sidebar collapsible="icon" side="left">
      <SidebarHeader>
        <h1 className="text-2xl font-bold text-primary">
          Admin Portal
        </h1>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {sideBarItems.map((item, index) => (
            <SidebarMenuItem key={index}>
              <Link href={item.href}>
                <SidebarMenuButton isActive={pathname === item.href}>
                  <div className="relative flex items-center gap-2">
                    {item.icon}
                    <span>{item.name}</span>

                    {/* 🔴 Notification Badge */}
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}