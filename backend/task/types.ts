export type Priority = "high" | "medium" | "low";
export type KanbanStatus = "todo" | "in_progress" | "completed";

export interface Task {
  id: number;
  userId: number;
  name: string;
  category: string;
  priority: Priority;
  estimatedTime: number;
  deadline?: Date;
  description?: string;
  completed: boolean;
  kanbanStatus: KanbanStatus;
  postponements: number;
  allocatedDate?: string;
  allocatedStartTime?: string;
  allocatedEndTime?: string;
  manualAllocation: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskRow {
  id: number;
  user_id: number;
  name: string;
  category: string;
  priority: string;
  estimated_time: number;
  deadline: Date | null;
  description: string | null;
  completed: boolean;
  kanban_status: string;
  postponements: number;
  allocated_date: string | null;
  allocated_start_time: string | null;
  allocated_end_time: string | null;
  manual_allocation: boolean;
  created_at: Date;
  updated_at: Date;
}
