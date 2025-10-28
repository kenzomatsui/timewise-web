import { api, APIError } from "encore.dev/api";
import db from "../db";

interface DeleteAppointmentRequest {
  appointmentId: number;
}

// Deletes an appointment permanently.
export const deleteAppointment = api<DeleteAppointmentRequest, void>(
  { expose: true, method: "DELETE", path: "/appointments/:appointmentId", auth: true },
  async (req) => {
    const result = await db.queryRow<{ id: number }>`
      DELETE FROM appointments WHERE id = ${req.appointmentId} RETURNING id
    `;

    if (!result) {
      throw APIError.notFound("appointment not found");
    }
  }
);
