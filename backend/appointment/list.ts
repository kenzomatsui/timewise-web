import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import type { Appointment } from "./types";

interface ListAppointmentsRequest {
  startDate?: Query<string>;
  endDate?: Query<string>;
}

interface ListAppointmentsResponse {
  appointments: Appointment[];
}

// Retrieves all appointments for a user within a date range.
export const list = api<ListAppointmentsRequest, ListAppointmentsResponse>(
  { expose: true, method: "GET", path: "/appointments", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    // Get internal user_id from clerk_id
    const user = await db.queryRow<{ id: number }>`
      SELECT id FROM users WHERE clerk_id = ${auth.userID}
    `;
    
    if (!user) {
      throw APIError.notFound("user not found");
    }
    
    let query = `SELECT * FROM appointments WHERE user_id = $1`;
    const params: any[] = [user.id];
    let paramCount = 2;

    if (req.startDate) {
      query += ` AND date >= $${paramCount++}`;
      params.push(req.startDate);
    }

    if (req.endDate) {
      query += ` AND date <= $${paramCount++}`;
      params.push(req.endDate);
    }

    query += ` ORDER BY date, start_time`;

    const rows = await db.rawQueryAll<any>(query, ...params);

    return {
      appointments: rows.map(mapAppointmentFromDb),
    };
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
