'use client';

import { useUser } from "@clerk/nextjs";
import { TodoistSidebar } from "@/components/TodoistSidebar";
import { TodoistKanban } from "@/components/TodoistKanban";

export default function Dashboard() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Please sign in to access the dashboard</h1>
          <p className="mt-2 text-gray-600">You need to be authenticated to view this page.</p>
        </div>
      </div>
    );
  }

  const userData = {
    name: user.fullName || user.firstName || "User",
    email: user.primaryEmailAddress?.emailAddress || "user@example.com",
    teamId: "default-team",
    role: "member"
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
