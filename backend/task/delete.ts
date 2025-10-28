import { api, APIError } from "encore.dev/api";
import db from "../db";

interface DeleteTaskRequest {
  taskId: number;
}

// Deletes a task permanently.
export const deleteTask = api<DeleteTaskRequest, void>(
  { expose: true, method: "DELETE", path: "/tasks/:taskId", auth: true },
  async (req) => {
    const result = await db.queryRow<{ id: number }>`
      DELETE FROM tasks WHERE id = ${req.taskId} RETURNING id
    `;

    if (!result) {
      throw APIError.notFound("task not found");
    }
  }
);
