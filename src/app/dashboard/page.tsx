import { TodoistSidebar } from "@/components/TodoistSidebar";
import { TodoistKanban } from "@/components/TodoistKanban";

export default function Dashboard() {
  const user = {
    name: "Sam",
    email: "sam@example.com",
    teamId: "team-1",
    role: "Designer"
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <TodoistSidebar user={user} />
      
      {/* Main Content */}
      <TodoistKanban />
    </div>
  );
}
