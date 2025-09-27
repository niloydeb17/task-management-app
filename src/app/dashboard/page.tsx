'use client';

import { TodoistSidebar } from "@/components/TodoistSidebar";
import { TodoistKanban } from "@/components/TodoistKanban";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";

function DashboardContent() {
  const { user } = useAuth();

  const userData = {
    name: user?.name || "User",
    email: user?.email || "",
    teamId: user?.teamId,
    role: user?.role || "member"
  };

  return (
    <div className="h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <TodoistSidebar user={userData} />
      
      {/* Main Content - Takes remaining space */}
      <div className="ml-64 h-screen overflow-x-auto transition-all duration-150">
        <TodoistKanban showLoading={false} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
