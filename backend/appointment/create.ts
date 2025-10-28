import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import type { Appointment, Recurrence } from "./types";

interface CreateAppointmentRequest {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  recurrence?: Recurrence;
  description?: string;
}

// Creates a new appointment.
export const create = api<CreateAppointmentRequest, Appointment>(
  { expose: true, method: "POST", path: "/appointments", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    // Get internal user_id from clerk_id
    const user = await db.queryRow<{ id: number }>`
      SELECT id FROM users WHERE clerk_id = ${auth.userID}
    `;
    
    if (!user) {
      throw APIError.notFound("user not found");
    }
    if (!req.title || !req.date || !req.startTime || !req.endTime || !req.category) {
      throw APIError.invalidArgument("title, date, startTime, endTime and category are required");
    }

    const appointment = await db.queryRow<any>`
      INSERT INTO appointments (
        user_id, title, date, start_time, end_time, category, recurrence, description
      ) VALUES (
        ${user.id}, ${req.title}, ${req.date}, ${req.startTime},
        ${req.endTime}, ${req.category}, ${req.recurrence || "none"}, ${req.description || null}
      )
      RETURNING *
    `;

    if (!appointment) {
      throw APIError.internal("failed to create appointment");
    }

    return mapAppointmentFromDb(appointment);
  }
);

function mapAppointmentFromDb(row: any): Appointment {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    category: row.category,
    recurrence: row.recurrence,
    description: row.description || undefined,
    createdAt: row.created_at,
  };
}
