import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import type { Task, Priority } from "./types";

interface CreateTaskRequest {
  name: string;
  category: string;
  priority: Priority;
  estimatedTime: number;
  deadline?: Date;
  description?: string;
}

// Creates a new task.
export const create = api<CreateTaskRequest, Task>(
  { expose: true, method: "POST", path: "/tasks", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    // Get internal user_id from clerk_id
    const user = await db.queryRow<{ id: number }>`
      SELECT id FROM users WHERE clerk_id = ${auth.userID}
    `;
    
    if (!user) {
      throw APIError.notFound("user not found");
    }
    if (!req.name || !req.category || !req.priority || !req.estimatedTime) {
      throw APIError.invalidArgument("name, category, priority and estimatedTime are required");
    }

    if (req.estimatedTime <= 0) {
      throw APIError.invalidArgument("estimatedTime must be positive");
    }

    const task = await db.queryRow<any>`
      INSERT INTO tasks (
        user_id, name, category, priority, estimated_time, deadline, description
      ) VALUES (
        ${user.id}, ${req.name}, ${req.category}, ${req.priority},
        ${req.estimatedTime}, ${req.deadline || null}, ${req.description || null}
      )
      RETURNING *
    `;

    if (!task) {
      throw APIError.internal("failed to create task");
    }

    return mapTaskFromDb(task);
  }
);

function mapTaskFromDb(row: any): Task {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    priority: row.priority,
    estimatedTime: row.estimated_time,
    deadline: row.deadline || undefined,
    description: row.description || undefined,
    completed: row.completed,
    kanbanStatus: row.kanban_status,
    postponements: row.postponements,
    allocatedDate: row.allocated_date || undefined,
    allocatedStartTime: row.allocated_start_time || undefined,
    allocatedEndTime: row.allocated_end_time || undefined,
    manualAllocation: row.manual_allocation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
