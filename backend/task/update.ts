import { api, APIError } from "encore.dev/api";
import db from "../db";
import type { Task, Priority, KanbanStatus } from "./types";

interface UpdateTaskRequest {
  taskId: number;
  name?: string;
  category?: string;
  priority?: Priority;
  estimatedTime?: number;
  deadline?: Date;
  description?: string;
  kanbanStatus?: KanbanStatus;
  allocatedDate?: string;
  allocatedStartTime?: string;
  allocatedEndTime?: string;
  manualAllocation?: boolean;
}

// Updates an existing task.
export const update = api<UpdateTaskRequest, Task>(
  { expose: true, method: "PUT", path: "/tasks/:taskId", auth: true },
  async (req) => {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (req.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(req.name);
    }
    if (req.category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(req.category);
    }
    if (req.priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(req.priority);
    }
    if (req.estimatedTime !== undefined) {
      updates.push(`estimated_time = $${paramCount++}`);
      values.push(req.estimatedTime);
    }
    if (req.deadline !== undefined) {
      updates.push(`deadline = $${paramCount++}`);
      values.push(req.deadline);
    }
    if (req.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(req.description);
    }
    if (req.kanbanStatus !== undefined) {
      updates.push(`kanban_status = $${paramCount++}`);
      values.push(req.kanbanStatus);
      
      if (req.kanbanStatus === "completed") {
        updates.push(`completed = true`);
      }
    }
    if (req.allocatedDate !== undefined) {
      updates.push(`allocated_date = $${paramCount++}`);
      values.push(req.allocatedDate || null);
    }
    if (req.allocatedStartTime !== undefined) {
      updates.push(`allocated_start_time = $${paramCount++}`);
      values.push(req.allocatedStartTime || null);
    }
    if (req.allocatedEndTime !== undefined) {
      updates.push(`allocated_end_time = $${paramCount++}`);
      values.push(req.allocatedEndTime || null);
    }
    if (req.manualAllocation !== undefined) {
      updates.push(`manual_allocation = $${paramCount++}`);
      values.push(req.manualAllocation);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("no fields to update");
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.taskId);

    const query = `
      UPDATE tasks
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const task = await db.rawQueryRow<any>(query, ...values);

    if (!task) {
      throw APIError.notFound("task not found");
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
