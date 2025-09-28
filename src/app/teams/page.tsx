"use client";

import { TodoistSidebar } from "@/components/TodoistSidebar";
import { useTeams } from "@/hooks/useTeams";
import { useState } from "react";
import { TeamCreationModal } from "@/components/TeamCreationModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Calendar, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";

function TeamsPageContent() {
  const { teams, loading, createTeam } = useTeams();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const { user } = useAuth();

  const handleCreateTeam = async (teamData: {
    name: string;
    type: 'design' | 'content' | 'development' | 'marketing' | 'other';
    color?: string;
    description?: string;
    isPrivate?: boolean;
  }) => {
    await createTeam(teamData);
  };

  const userData = {
    name: user?.name || "User",
    email: user?.email || "",
    teamId: user?.teamId,
    role: user?.role || "member"
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
        <TodoistSidebar user={userData} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
              <p className="text-gray-600">Manage your teams and collaborate on projects</p>
            </div>
            <Button onClick={() => setIsTeamModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </div>

          {/* Teams Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading teams...</div>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
              <p className="text-gray-600 mb-4">Create your first team to get started with collaboration</p>
              <Button onClick={() => setIsTeamModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Team
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Link key={team.id} href={`/team/${team.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: team.color }}
                          />
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </div>
                      <CardDescription className="flex items-center space-x-2">
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{ backgroundColor: team.color, color: 'white' }}
                        >
                          {team.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Created {new Date(team.created_at).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Board Columns</span>
                          <span className="font-medium">{team.board_template.columns.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Status</span>
                          <span className="text-green-600 font-medium">Active</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Creation Modal */}
      <TeamCreationModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onCreateTeam={handleCreateTeam}
      />
    </div>
  );
}

export default function TeamsPage() {
  return (
    <ProtectedRoute>
      <TeamsPageContent />
    </ProtectedRoute>
  );
}
