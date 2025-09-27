import { TodoistSidebar } from "@/components/TodoistSidebar";
import { TodoistKanban } from "@/components/TodoistKanban";

interface TeamPageProps {
  params: {
    teamId: string;
  };
}

export default function TeamPage({ params }: TeamPageProps) {
  const user = {
    name: "Sam",
    email: "sam@example.com",
    teamId: params.teamId,
    role: "Designer"
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
        <TodoistSidebar user={user} />
      </div>
      
      {/* Main Content - Takes remaining space */}
      <div className="flex-1 overflow-x-auto transition-all duration-150">
        <TodoistKanban teamId={params.teamId} />
      </div>
    </div>
  );
}
