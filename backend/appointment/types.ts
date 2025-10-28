export type Recurrence = "none" | "daily" | "weekdays" | "weekly";

export interface Appointment {
  id: number;
  userId: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  recurrence: Recurrence;
  description?: string;
  createdAt: Date;
}

export interface AppointmentRow {
  id: number;
  user_id: number;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  category: string;
  recurrence: string;
  description: string | null;
  created_at: Date;
}
