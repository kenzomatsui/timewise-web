import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import type { Task } from "./types";

interface ListTasksRequest {
  status?: Query<string>;
  completed?: Query<boolean>;
}

interface ListTasksResponse {
  tasks: Task[];
}

// Retrieves all tasks for a user, with optional filtering.
export const list = api<ListTasksRequest, ListTasksResponse>(
  { expose: true, method: "GET", path: "/tasks", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    // Get internal user_id from clerk_id
    const user = await db.queryRow<{ id: number }>`
      SELECT id FROM users WHERE clerk_id = ${auth.userID}
    `;
    
    if (!user) {
      throw APIError.notFound("user not found");
    }
    
    let query = `SELECT * FROM tasks WHERE user_id = $1`;
    const params: any[] = [user.id];
    let paramCount = 2;

    if (req.status) {
      query += ` AND kanban_status = $${paramCount++}`;
      params.push(req.status);
    }

    if (req.completed !== undefined) {
      query += ` AND completed = $${paramCount++}`;
      params.push(req.completed);
    }

    query += ` ORDER BY created_at DESC`;

    const rows = await db.rawQueryAll<any>(query, ...params);

    return {
      tasks: rows.map(mapTaskFromDb),
    };
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
