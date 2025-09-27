// Core types for TaskFlow application

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  teamId: string;
  role: 'admin' | 'member' | 'lead';
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  type: 'design' | 'content' | 'development' | 'marketing' | 'other';
  color: string;
  boardTemplate: BoardTemplate;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardTemplate {
  id: string;
  name: string;
  columns: Column[];
  teamType: Team['type'];
}

export interface Column {
  id: string;
  name: string;
  order: number;
  color: string;
  isHandoffColumn: boolean;
  targetTeamId?: string; // For handoff columns
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  teamId: string;
  columnId: string;
  tags: string[];
  attachments: Attachment[];
  comments: Comment[];
  handoffHistory: Handoff[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
}

export interface TaskStatus {
  id: string;
  name: string;
  color: string;
  order: number;
  isCompleted: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'other';
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  taskId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Handoff {
  id: string;
  fromTeamId: string;
  toTeamId: string;
  taskId: string;
  handoffData: HandoffData;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectedReason?: string;
}

export interface HandoffData {
  notes: string;
  requirements: string[];
  files: Attachment[];
  specifications?: Record<string, any>;
}

export interface TeamStreak {
  id: string;
  teamId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  totalTasksCompleted: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'team' | 'individual';
  criteria: AchievementCriteria;
  unlockedAt?: Date;
}

export interface AchievementCriteria {
  type: 'streak' | 'tasks_completed' | 'handoffs' | 'time_based';
  value: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

// Google Sheets integration types
export interface GoogleSheetsConfig {
  spreadsheetId: string;
  teamSheets: Record<string, string>; // teamId -> sheetName
  syncFields: string[];
  lastSyncAt?: Date;
}

// Real-time update types
export interface RealtimeUpdate {
  type: 'task_created' | 'task_updated' | 'task_moved' | 'handoff_created' | 'comment_added';
  data: any;
  teamId: string;
  userId: string;
  timestamp: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface CreateTaskForm {
  title: string;
  description?: string;
  priority: Task['priority'];
  assigneeId?: string;
  tags: string[];
  dueDate?: Date;
}

export interface CreateTeamForm {
  name: string;
  type: Team['type'];
  color: string;
}

export interface HandoffForm {
  toTeamId: string;
  notes: string;
  requirements: string[];
  files: File[];
}
