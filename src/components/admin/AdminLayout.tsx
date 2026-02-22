import { Outlet, Link, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Layout, DollarSign, Heart, Settings, Wallet, FolderOpen, Mail as MailIcon, Users as UsersIcon, Home } from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Celebrations", url: "/admin/celebrations", icon: Heart },
  { title: "Events", url: "/admin/events", icon: Calendar },
  { title: "Files", url: "/admin/files", icon: FolderOpen },
  { title: "Mail", url: "/admin/mail", icon: MailIcon },
  { title: "Payments", url: "/admin/payments", icon: Wallet },
  { title: "Pricing", url: "/admin/pricing", icon: DollarSign },
  { title: "Sales", url: "/admin/sales", icon: DollarSign },
  { title: "Users", url: "/admin/users", icon: UsersIcon },
];

function AdminSidebar() {
  return (
    <Sidebar className="border-r">
      <div className="p-4 border-b">
        <Link to="/admin" className="font-bold text-lg">
          <span className="text-indigo-600">Make</span>Moments
        </Link>
        <p className="text-xs text-muted-foreground">Admin Panel</p>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-indigo-50 text-indigo-700 font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-white px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm font-medium text-muted-foreground">Admin</span>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link to="/">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
                <Home className="h-4 w-4 sm:hidden" />
              </Link>
            </Button>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
