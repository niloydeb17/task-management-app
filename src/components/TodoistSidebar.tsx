"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Search,
  Inbox,
  Calendar,
  Clock,
  Filter,
  ChevronDown,
  Home,
  Users,
  Settings,
  Star,
  FolderOpen,
  MoreHorizontal
} from "lucide-react";

interface TodoistSidebarProps {
  user?: {
    name: string;
    email: string;
    teamId: string;
    role: string;
  };
}

export function TodoistSidebar({ user }: TodoistSidebarProps) {
  const pathname = usePathname();

  const quickActions = [
    { label: "Add task", icon: Plus, href: "#" },
    { label: "Search", icon: Search, href: "#" },
  ];

  const mainSections = [
    { label: "Inbox", icon: Inbox, href: "/inbox", count: 0 },
    { label: "Today", icon: Calendar, href: "/today", count: 1 },
    { label: "Upcoming", icon: Clock, href: "/upcoming", count: 2 },
  ];

  const projects = [
    { label: "My work", icon: Home, href: "/my-work", count: 6 },
    { label: "Home", icon: Home, href: "/home", count: 8 },
  ];

  const teamProjects = [
    { label: "Design Sprint", icon: FolderOpen, href: "/design-sprint", count: 34, active: true },
    { label: "Set up your team", icon: FolderOpen, href: "/setup-team", count: 10 },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback className="bg-blue-500 text-white text-sm">
              {user?.name?.charAt(0) || "S"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-900">
                {user?.name || "Sam"}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              className="w-full justify-start text-gray-600 hover:text-gray-900"
              asChild
            >
              <Link href={action.href}>
                <Icon className="w-4 h-4 mr-2" />
                {action.label}
              </Link>
            </Button>
          );
        })}
      </div>

      {/* Main Sections */}
      <div className="px-4 pb-4">
        <div className="space-y-1">
          {mainSections.map((section) => {
            const Icon = section.icon;
            const isActive = pathname === section.href;
            
            return (
              <Link
                key={section.href}
                href={section.href}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors group ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>{section.label}</span>
                </div>
                {section.count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {section.count}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Filters & Labels */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-500">
          <span>Filters & Labels</span>
          <Filter className="w-4 h-4" />
        </div>
      </div>

      {/* My Projects */}
      <div className="px-4 pb-4">
        <div className="space-y-1">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            My Projects
          </div>
          {projects.map((project) => {
            const Icon = project.icon;
            const isActive = pathname === project.href;
            
            return (
              <Link
                key={project.href}
                href={project.href}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors group ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>#{project.label}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {project.count}
                </Badge>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Team Projects */}
      <div className="px-4 pb-4 flex-1">
        <div className="space-y-1">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            SLMobbin
          </div>
          {teamProjects.map((project) => {
            const Icon = project.icon;
            const isActive = pathname === project.href || project.active;
            
            return (
              <Link
                key={project.href}
                href={project.href}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors group ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>#{project.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {project.count}
                  </Badge>
                  <MoreHorizontal className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200">
        <Link
          href="/templates"
          className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
        >
          <Star className="w-4 h-4" />
          <span>Browse templates</span>
        </Link>
      </div>
    </div>
  );
}
