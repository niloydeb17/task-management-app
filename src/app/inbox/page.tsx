'use client';

import { useState, useEffect } from "react";
import { TodoistSidebar } from "@/components/TodoistSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Filter, 
  CheckCircle2, 
  Settings, 
  Inbox,
  Calendar,
  Clock,
  Flag,
  User,
  Mail,
  AlertCircle,
  Circle,
  Archive,
  Zap,
  AtSign
} from "lucide-react";

interface TaskActivity {
  id: string;
  title: string;
  type: 'assignment' | 'unassignment' | 'creation' | 'subtask' | 'update';
  actor: string;
  target?: string;
  date: string;
  status: 'todo' | 'in-progress' | 'completed';
  count?: number;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  description?: string;
}

export default function InboxPage() {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'important' | 'other' | 'snoozed' | 'cleared'>('inbox');

  const handleClearActivity = (activityId: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== activityId));
  };

  const handleClearAll = () => {
    setActivities([]);
  };

  const handleTabClick = (tab: 'inbox' | 'important' | 'other' | 'snoozed' | 'cleared') => {
    setActiveTab(tab);
  };

  const userData = {
    name: "User",
    email: "user@example.com",
    teamId: "default-team",
    role: "member"
  };

  // Mock data for now - in real implementation, this would come from database
  useEffect(() => {
    const mockActivities: TaskActivity[] = [
      // Earlier this month
      {
        id: '2',
        title: 'Product mockup for Avanair 200mg',
        type: 'assignment',
        actor: 'Shalini Jain',
        target: 'you',
        date: 'Sep 6',
        status: 'todo',
        count: 3
      },
      {
        id: '3',
        title: 'Optimize UI for Mobile',
        type: 'assignment',
        actor: 'Imran ladiwala',
        target: 'you',
        date: 'Sep 6',
        status: 'in-progress',
        priority: 'high'
      },
      {
        id: '4',
        title: 'New Designs for collections 4 Each',
        type: 'subtask',
        actor: 'Mayank Sharma',
        target: 'Mock Ups',
        date: 'Sep 3',
        status: 'in-progress',
        count: 4
      },
      {
        id: '5',
        title: 'Checkout journey, Shipping - Payment (Prep & Design)',
        type: 'unassignment',
        actor: 'Imran ladiwala',
        target: 'you',
        date: 'Sep 3',
        status: 'completed',
        count: 1
      },
      {
        id: '6',
        title: 'Designing pdf',
        type: 'unassignment',
        actor: 'Imran ladiwala',
        target: 'you',
        date: 'Sep 3',
        status: 'completed'
      },
      {
        id: '7',
        title: 'Revenue Display for saved profit and lost profit in frontend.',
        type: 'unassignment',
        actor: 'Imran ladiwala',
        target: 'you',
        date: 'Sep 3',
        status: 'todo',
        count: 1
      },
      {
        id: '8',
        title: 'Ext design for mobile, tablet',
        type: 'assignment',
        actor: 'Mohit Mayank',
        target: 'you',
        date: 'Sep 3',
        status: 'todo',
        priority: 'urgent'
      },
      {
        id: '9',
        title: 'Design to show download report option',
        type: 'assignment',
        actor: 'Ansh',
        target: 'you',
        date: 'Sep 3',
        status: 'todo'
      },
      {
        id: '10',
        title: 'Design add a popup for showing text "your report is generat',
        type: 'assignment',
        actor: 'Ansh',
        target: 'you',
        date: 'Sep 3',
        status: 'todo'
      },
      {
        id: '11',
        title: 'Design of Already test created flow.',
        type: 'unassignment',
        actor: 'Imran ladiwala',
        target: 'you',
        date: 'Sep 3',
        status: 'completed',
        count: 1
      },
      {
        id: '12',
        title: 'Dashboard Improvement',
        type: 'unassignment',
        actor: 'Imran ladiwala',
        target: 'you',
        date: 'Sep 3',
        status: 'completed',
        count: 2
      },
      {
        id: '13',
        title: 'Testtube landing page 2.0',
        type: 'unassignment',
        actor: 'Imran ladiwala',
        target: 'you',
        date: 'Sep 3',
        status: 'completed',
        count: 2
      },
      {
        id: '14',
        title: 'Design the new landing page',
        type: 'unassignment',
        actor: 'Imran ladiwala',
        target: 'you',
        date: 'Sep 3',
        status: 'completed',
        count: 1
      },
      {
        id: '15',
        title: 'Design',
        type: 'unassignment',
        actor: 'Imran ladiwala',
        target: 'you',
        date: 'Sep 3',
        status: 'completed',
        count: 1
      }
    ];

    // Simulate loading
    setTimeout(() => {
      setActivities(mockActivities);
      setLoading(false);
    }, 1000);
  }, []);

  const getActivityText = (activity: TaskActivity) => {
    switch (activity.type) {
      case 'assignment':
        return `${activity.actor} assigned this task to ${activity.target}`;
      case 'unassignment':
        return `${activity.actor} unassigned ${activity.target} from this task`;
      case 'creation':
        return activity.description || `${activity.actor} created this task`;
      case 'subtask':
        return `${activity.actor} created subtask: ${activity.target}`;
      case 'update':
        return `${activity.actor} updated this task`;
      default:
        return 'Activity';
    }
  };

  const getActivityIcon = (activity: TaskActivity) => {
    switch (activity.status) {
      case 'todo':
        return <Circle className="w-4 h-4 text-gray-400" strokeDasharray="2,2" />;
      case 'in-progress':
        return <Circle className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 256 256">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm72-88a72,72,0,1,1-72-72A72.08,72.08,0,0,1,200,128Z"></path>
          </svg>
        );
      default:
        return <Circle className="w-4 h-4 text-gray-400" strokeDasharray="2,2" />;
    }
  };

  const getPriorityIcon = (priority?: string) => {
    if (!priority) return null;
    
    switch (priority) {
      case 'urgent':
        return <Flag className="w-3 h-3 text-red-500" />;
      case 'high':
        return <Flag className="w-3 h-3 text-orange-500" />;
      default:
        return null;
    }
  };

  const getAdditionalIcons = (activity: TaskActivity) => {
    const icons = [];
    if (activity.type === 'assignment' && activity.title === 'Optimize UI for Mobile') {
      icons.push(<Mail className="w-4 h-4 text-gray-400" />);
      icons.push(<Clock className="w-4 h-4 text-gray-400" />);
    }
    
    return icons;
  };

  // Group activities by timeframe
  const last7Days = activities.filter(activity => {
    const activityDate = new Date(`2024-09-${activity.date.split(' ')[1]}`);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return activityDate >= sevenDaysAgo;
  });

  const earlierThisMonth = activities.filter(activity => {
    const activityDate = new Date(`2024-09-${activity.date.split(' ')[1]}`);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return activityDate < sevenDaysAgo;
  });

  if (loading) {
    return (
      <div className="h-screen bg-gray-50">
        {/* Fixed Sidebar */}
        <TodoistSidebar user={userData} />
        
        {/* Main Content */}
        <div className="ml-64 h-screen flex items-center justify-center">
          <div className="text-gray-500">Loading inbox...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <TodoistSidebar user={userData} />
      
      {/* Main Content */}
      <div className="ml-64 h-screen overflow-y-auto bg-white">
          {/* Top Navigation Tabs */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-8">
                <button 
                  onClick={() => handleTabClick('inbox')}
                  className={`text-sm font-medium pb-3 ${
                    activeTab === 'inbox' 
                      ? 'text-gray-900 border-b-2 border-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Inbox
                </button>
                <button 
                  onClick={() => handleTabClick('important')}
                  className={`text-sm font-medium pb-3 flex items-center space-x-2 ${
                    activeTab === 'important' 
                      ? 'text-gray-900 border-b-2 border-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>Important</span>
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                    99+
                  </Badge>
                </button>
                <button 
                  onClick={() => handleTabClick('other')}
                  className={`text-sm font-medium pb-3 flex items-center space-x-2 ${
                    activeTab === 'other' 
                      ? 'text-gray-900 border-b-2 border-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>Other</span>
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                    29
                  </Badge>
                </button>
                <button 
                  onClick={() => handleTabClick('snoozed')}
                  className={`text-sm font-medium pb-3 ${
                    activeTab === 'snoozed' 
                      ? 'text-gray-900 border-b-2 border-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Snoozed
                </button>
                <button 
                  onClick={() => handleTabClick('cleared')}
                  className={`text-sm font-medium pb-3 ${
                    activeTab === 'cleared' 
                      ? 'text-gray-900 border-b-2 border-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cleared
                </button>
              </div>
              
              {/* Header Controls */}
              <div className="flex items-center space-x-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 h-8 px-3">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="start">
                    <div className="space-y-1">
                      <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-gray-700">
                        <User className="w-4 h-4 mr-2" />
                        Assigned to me
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-gray-700">
                        <AtSign className="w-4 h-4 mr-2" />
                        Mentioning me
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-gray-700">
                        <Mail className="w-4 h-4 mr-2" />
                        Unread
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-600 hover:text-gray-900 h-8 px-3"
                  onClick={handleClearAll}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Clear all
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 h-8 px-3">
                  <Settings className="w-4 h-4 mr-2" />
                  Customize
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Tab Content */}
            {activeTab === 'inbox' && (
              <>
                {/* Earlier this month */}
                {earlierThisMonth.length > 0 && (
                  <div>
                    <h2 className="text-sm font-medium text-gray-900 mb-4">Earlier this month</h2>
                    <div className="space-y-0">
                      {earlierThisMonth.map((activity) => (
                        <div key={activity.id} className="group flex items-start space-x-2 py-3 hover:bg-gray-50 rounded-lg relative">
                          <div className="flex-shrink-0 mt-0.5">
                            {getActivityIcon(activity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-900">#{activity.title}</h3>
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{getActivityText(activity)}</p>
                              </div>
                              <div className="flex items-center space-x-3 ml-6">
                                {getAdditionalIcons(activity).map((icon, index) => (
                                  <div key={index}>{icon}</div>
                                ))}
                                {getPriorityIcon(activity.priority)}
                                {activity.count && (
                                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-xs font-medium text-gray-600">{activity.count}</span>
                                  </div>
                                )}
                                <span className="text-xs text-gray-500 font-medium">{activity.date}</span>
                                
                                {/* Hover Tabs */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-1 ml-3">
                                  {/* Mark as Read */}
                                  <button className="w-8 h-8 rounded-md border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm">
                                    <Archive className="w-4 h-4 text-gray-600" />
                                  </button>
                                  
                                  {/* Snooze */}
                                  <button className="w-8 h-8 rounded-md border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm">
                                    <Clock className="w-4 h-4 text-gray-600" />
                                  </button>
                                  
                                  {/* Clear */}
                                  <button 
                                    onClick={() => handleClearActivity(activity.id)}
                                    className="px-3 py-1.5 rounded-md bg-blue-500 text-white text-xs hover:bg-blue-600 transition-colors flex items-center space-x-1 shadow-sm"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Clear</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'important' && (
              <div className="text-center py-12">
                <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Important tasks</h3>
                <p className="text-gray-500">No important tasks at the moment</p>
              </div>
            )}

            {activeTab === 'other' && (
              <div className="text-center py-12">
                <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Other tasks</h3>
                <p className="text-gray-500">No other tasks to show</p>
              </div>
            )}

            {activeTab === 'snoozed' && (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Snoozed tasks</h3>
                <p className="text-gray-500">No snoozed tasks</p>
              </div>
            )}

            {activeTab === 'cleared' && (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Cleared tasks</h3>
                <p className="text-gray-500">No cleared tasks to show</p>
              </div>
            )}

            {/* Empty state for inbox */}
            {activeTab === 'inbox' && activities.length === 0 && (
              <div className="text-center py-12">
                <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your inbox is empty</h3>
                <p className="text-gray-500">No new activities or assignments</p>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}