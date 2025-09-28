"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DndContext, DragEndEvent, DragStartEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Plus,
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
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import { useTeams } from "@/hooks/useTeams";
import { TeamCreationModal } from "@/components/TeamCreationModal";
import { TeamEditModal } from "@/components/TeamEditModal";
import { TeamDeleteModal } from "@/components/TeamDeleteModal";

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
  const { teams, loading: teamsLoading, createTeam, updateTeam, deleteTeam, updateTeamPositions } = useTeams();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [activeTeam, setActiveTeam] = useState<any>(null);

  const quickActions = [
    // Removed Add task and Search buttons
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

  const handleCreateTeam = async (teamData: {
    name: string;
    type: 'design' | 'content' | 'development' | 'marketing' | 'other';
    color?: string;
  }) => {
    await createTeam(teamData);
  };

  const handleEditTeam = (team: any) => {
    setSelectedTeam(team);
    setIsEditModalOpen(true);
  };

  const handleDeleteTeam = (team: any) => {
    setSelectedTeam(team);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateTeam = async (teamId: string, teamData: {
    name: string;
    type: 'design' | 'content' | 'development' | 'marketing' | 'other';
    color?: string;
  }) => {
    await updateTeam(teamId, teamData);
  };

  const handleConfirmDelete = async (teamId: string) => {
    await deleteTeam(teamId);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const team = teams.find(t => t.id === active.id);
    setActiveTeam(team || null);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTeam(null);
      return;
    }
    
    const activeTeam = teams.find(t => t.id === active.id);
    const overTeam = teams.find(t => t.id === over.id);
    
    if (!activeTeam || !overTeam || activeTeam.id === overTeam.id) {
      setActiveTeam(null);
      return;
    }
    
    const activeIndex = teams.findIndex(t => t.id === activeTeam.id);
    const overIndex = teams.findIndex(t => t.id === overTeam.id);
    
    // Reorder teams
    const newTeams = arrayMove(teams, activeIndex, overIndex);
    
    // Update positions
    const updatedTeams = newTeams.map((team, index) => ({
      ...team,
      position: index
    }));
    
    // Update database
    try {
      const teamUpdates = updatedTeams.map((team, index) => ({
        id: team.id,
        position: index
      }));
      
      await updateTeamPositions(teamUpdates);
      console.log('✅ Team order updated successfully!');
    } catch (err) {
      console.error('❌ Failed to update team order:', err);
      alert('Failed to save team order. Please try again.');
    }
    
    setActiveTeam(null);
  };

  return (
    <div 
      className="bg-white border-r border-gray-200 h-screen flex flex-col w-64 fixed left-0 top-0 overflow-hidden"
    >
      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo-m.svg" 
            alt="User Avatar" 
            className="w-8 h-8"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-900">
                MoreTaasks
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions section removed */}

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

      {/* Teams */}
      <div className="px-4 pb-4 flex-1 overflow-y-auto">
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Teams
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTeamModalOpen(true)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          
          {teamsLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading teams...</div>
          ) : teams.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No teams yet. Create one to get started!
            </div>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={teams.map(team => team.id)}
                strategy={verticalListSortingStrategy}
              >
                {teams.map((team) => (
                  <SortableTeamItem
                    key={team.id}
                    team={team}
                    pathname={pathname}
                    onEditTeam={handleEditTeam}
                    onDeleteTeam={handleDeleteTeam}
                    isActive={activeTeam?.id === team.id}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
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

      {/* Team Creation Modal */}
      <TeamCreationModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onCreateTeam={handleCreateTeam}
      />

      {/* Team Edit Modal */}
      <TeamEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateTeam={handleUpdateTeam}
        team={selectedTeam}
      />

      {/* Team Delete Confirmation Modal */}
      <TeamDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleteTeam={handleConfirmDelete}
        team={selectedTeam}
      />
    </div>
  );
}

// Sortable Team Item Component
interface SortableTeamItemProps {
  team: any;
  pathname: string;
  onEditTeam: (team: any) => void;
  onDeleteTeam: (team: any) => void;
  isActive: boolean;
}

function SortableTeamItem({ team, pathname, onEditTeam, onDeleteTeam, isActive }: SortableTeamItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isLinkActive = pathname === `/team/${team.id}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors group cursor-grab active:cursor-grabbing ${
        isLinkActive
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      } ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
      {...attributes}
      {...listeners}
    >
      {/* Team link */}
      <Link
        href={`/team/${team.id}`}
        className="flex items-center space-x-3 flex-1"
        onClick={(e) => {
          // Prevent navigation when dragging
          if (isDragging) {
            e.preventDefault();
          }
        }}
      >
        <FolderOpen className="w-4 h-4" />
        <span>#{team.name}</span>
      </Link>
      
      {/* Dropdown menu */}
      <div 
        className="flex items-center space-x-2"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEditTeam(team)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Team
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDeleteTeam(team)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
