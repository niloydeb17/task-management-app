import { useState } from "react";
import { SimpleKanbanBoard } from "@/components/SimpleKanbanBoard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserButton } from "@clerk/nextjs";
import { 
  Plus, 
  Filter, 
  Search,
  Settings,
  Users
} from "lucide-react";

function KanbanPageContent() {
  const user = {
    name: "User",
    email: "user@example.com",
    image: null
  };
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">SLMobbin /</div>
            <h1 className="text-2xl font-semibold text-gray-900">Design Sprint</h1>
          </div>
          <Badge variant="outline" className="text-xs">
            Design Team
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-8 w-8"
              }
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <SimpleKanbanBoard />
    </div>
  );
}

export default function KanbanPage() {
  return <KanbanPageContent />;
}
