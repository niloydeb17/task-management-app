import { SimpleKanbanBoard } from "@/components/SimpleKanbanBoard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Filter, 
  Search,
  Settings,
  Users
} from "lucide-react";

export default function KanbanPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Todoist Style */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <SimpleKanbanBoard />
      </div>
    </div>
  );
}
