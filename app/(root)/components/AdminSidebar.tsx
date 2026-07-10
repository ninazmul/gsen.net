"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Tag,
  ArrowDownToLine,
  History,
  UserPlus,
  Settings,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasPageAccess } from "@/lib/permission-helpers";
import { type Admin } from "@/lib/actions/admin.actions";

const sidebarSections = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
        permission: "dashboard",
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        title: "Income",
        url: "/income",
        icon: TrendingUp,
        permission: "income",
      },
      {
        title: "Expenses",
        url: "/expenses",
        icon: Wallet,
        permission: "expenses",
      },
      {
        title: "Categories",
        url: "/categories",
        icon: Tag,
        permission: "categories",
      },
      {
        title: "Withdrawals",
        url: "/withdrawals",
        icon: ArrowDownToLine,
        permission: "withdrawals",
      },
    ],
  },
  {
    label: "Reports & Logs",
    items: [
      {
        title: "Reports",
        url: "/reports",
        icon: TrendingUp,
        permission: "reports",
      },
      {
        title: "Activity Log",
        url: "/activity-logs",
        icon: History,
        permission: "activityLogs",
      },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        title: "Manage Admins",
        url: "/admins",
        icon: UserPlus,
        permission: "admins",
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        permission: "settings",
      },
    ],
  },
];

const AdminSidebar = ({ currentAdmin }: { currentAdmin: Admin }) => {
  const currentPath = usePathname();

  // Filter sections and items based on permissions
  const filteredSections = sidebarSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        hasPageAccess(currentAdmin, item.url)
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <Sidebar
      className="text-[#3e0078] dark:text-purple-300 font-semibold font-serif bg-background border-border"
      collapsible="icon"
    >
      <SidebarContent className="bg-background border-r border-border">
        {/* Logo */}
        <div className="px-4 py-3">
          <Image
            src="/assets/images/logo.png"
            width={120}
            height={80}
            alt="GSEN NET"
          />
        </div>

        {/* Sections */}
        {filteredSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-xs uppercase tracking-wide text-muted-foreground px-4">
              {section.label}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    item.url === "/"
                      ? currentPath === item.url
                      : currentPath === item.url ||
                        currentPath.startsWith(`${item.url}/`);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={item.url}
                          className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all ${
                            isActive
                              ? "bg-[#3e0078] dark:bg-purple-700/80 text-white shadow-sm"
                              : "hover:bg-purple-50 dark:hover:bg-purple-900/30 text-foreground"
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
