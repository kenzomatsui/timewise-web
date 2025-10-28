import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import type { Task } from "../task/types";
import type { UserProfile } from "../profile/types";
import type { Appointment } from "../appointment/types";

interface GenerateAgendaRequest {
  days: number;
}

interface GenerateAgendaResponse {
  allocatedTasks: number;
  message: string;
}

// Generates a smart agenda for the specified number of days.
export const generate = api<GenerateAgendaRequest, GenerateAgendaResponse>(
  { expose: true, method: "POST", path: "/agenda/generate", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    const user = await db.queryRow<{ id: number }>`
      SELECT id FROM users WHERE clerk_id = ${auth.userID}
    `;
    
    if (!user) {
      throw APIError.notFound("user not found");
    }
    
    const profile = await db.queryRow<any>`
      SELECT * FROM user_profiles WHERE user_id = ${user.id}
    `;

    if (!profile) {
      throw new Error("profile not found");
    }

    const tasks = await db.queryAll<any>`
      SELECT * FROM tasks
      WHERE user_id = ${user.id}
      AND completed = false
      AND manual_allocation = false
      ORDER BY
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        deadline NULLS LAST,
        created_at
    `;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + req.days);

    const appointments = await db.rawQueryAll<any>(
      `SELECT * FROM appointments WHERE user_id = $1 AND date >= $2 AND date < $3`,
      user.id,
      today.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0]
    );

    const expandedAppointments = expandRecurringAppointments(appointments, today, endDate);

    const allocations = allocateTasks(
      tasks,
      expandedAppointments,
      profile,
      today,
      req.days
    );

    let allocatedCount = 0;
    for (const allocation of allocations) {
      await db.rawExec(
        `UPDATE tasks SET allocated_date = $1, allocated_start_time = $2, allocated_end_time = $3, updated_at = NOW() WHERE id = $4`,
        allocation.date,
        allocation.startTime,
        allocation.endTime,
        allocation.taskId
      );
      allocatedCount++;
    }

    return {
      allocatedTasks: allocatedCount,
      message: `Successfully allocated ${allocatedCount} tasks`,
    };
  }
);

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface Allocation {
  taskId: number;
  date: string;
  startTime: string;
  endTime: string;
}

function expandRecurringAppointments(
  appointments: any[],
  startDate: Date,
  endDate: Date
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (const appt of appointments) {
    const apptDate = new Date(appt.date);

    if (appt.recurrence === "none") {
      slots.push({
        date: appt.date,
        startTime: appt.start_time,
        endTime: appt.end_time,
      });
      continue;
    }

    const current = new Date(Math.max(apptDate.getTime(), startDate.getTime()));
    while (current < endDate) {
      let shouldAdd = false;

      if (appt.recurrence === "daily") {
        shouldAdd = true;
      } else if (appt.recurrence === "weekdays") {
        const day = current.getDay();
        shouldAdd = day >= 1 && day <= 5;
      } else if (appt.recurrence === "weekly") {
        shouldAdd = current.getDay() === apptDate.getDay();
      }

      if (shouldAdd) {
        slots.push({
          date: current.toISOString().split("T")[0],
          startTime: appt.start_time,
          endTime: appt.end_time,
        });
      }

      current.setDate(current.getDate() + 1);
    }
  }

  return slots;
}

function allocateTasks(
  tasks: any[],
  appointments: TimeSlot[],
  profile: any,
  startDate: Date,
  days: number
): Allocation[] {
  const allocations: Allocation[] = [];
  const sleepStart = profile.sleep_hours.split(" - ")[0];
  const sleepEnd = profile.sleep_hours.split(" - ")[1];

  const strategy = profile.allocation_strategy || "fill_first_day";

  if (strategy === "fill_first_day") {
    for (let day = 0; day < days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);
      const dateStr = currentDate.toISOString().split("T")[0];

      for (const task of tasks) {
        if (allocations.find((a) => a.taskId === task.id)) continue;

        const slot = findAvailableSlot(
          dateStr,
          task.estimated_time,
          appointments,
          allocations,
          sleepStart,
          sleepEnd,
          profile.productive_hours
        );

        if (slot) {
          allocations.push({
            taskId: task.id,
            date: dateStr,
            startTime: slot.start,
            endTime: slot.end,
          });
        }
      }
    }
  } else if (strategy === "one_task_per_day") {
    for (const task of tasks) {
      for (let day = 0; day < days; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + day);
        const dateStr = currentDate.toISOString().split("T")[0];

        if (allocations.find((a) => a.date === dateStr)) continue;

        const slot = findAvailableSlot(
          dateStr,
          task.estimated_time,
          appointments,
          allocations,
          sleepStart,
          sleepEnd,
          profile.productive_hours
        );

        if (slot) {
          allocations.push({
            taskId: task.id,
            date: dateStr,
            startTime: slot.start,
            endTime: slot.end,
          });
          break;
        }
      }
    }
  } else {
    let dayIndex = 0;
    for (const task of tasks) {
      let allocated = false;
      for (let attempt = 0; attempt < days; attempt++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + dayIndex);
        const dateStr = currentDate.toISOString().split("T")[0];

        const slot = findAvailableSlot(
          dateStr,
          task.estimated_time,
          appointments,
          allocations,
          sleepStart,
          sleepEnd,
          profile.productive_hours
        );

        if (slot) {
          allocations.push({
            taskId: task.id,
            date: dateStr,
            startTime: slot.start,
            endTime: slot.end,
          });
          allocated = true;
          break;
        }

        dayIndex = (dayIndex + 1) % days;
      }

      if (allocated) {
        dayIndex = (dayIndex + 1) % days;
      }
    }
  }

  return allocations;
}

function findAvailableSlot(
  date: string,
  durationMinutes: number,
  appointments: TimeSlot[],
  allocations: Allocation[],
  sleepStart: string,
  sleepEnd: string,
  productiveHours: string[]
): { start: string; end: string } | null {
  const dayAppointments = appointments.filter((a) => a.date === date);
  const dayAllocations = allocations.filter((a) => a.date === date);

  const busySlots = [
    ...dayAppointments.map((a) => ({ start: a.startTime, end: a.endTime })),
    ...dayAllocations.map((a) => ({ start: a.startTime, end: a.endTime })),
  ];

  const sleepStartMinutes = timeToMinutes(sleepStart);
  const sleepEndMinutes = timeToMinutes(sleepEnd);
  if (sleepStartMinutes > sleepEndMinutes) {
    busySlots.push({ start: "00:00", end: sleepEnd });
    busySlots.push({ start: sleepStart, end: "23:59" });
  } else {
    busySlots.push({ start: sleepStart, end: sleepEnd });
  }

  busySlots.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  const productiveRanges = getProductiveRanges(productiveHours);

  for (const range of productiveRanges) {
    const slot = findSlotInRange(
      range.start,
      range.end,
      durationMinutes,
      busySlots
    );
    if (slot) return slot;
  }

  return findSlotInRange("00:00", "23:59", durationMinutes, busySlots);
}

function getProductiveRanges(
  productiveHours: string[]
): { start: string; end: string }[] {
  const ranges: { start: string; end: string }[] = [];

  for (const hour of productiveHours) {
    if (hour === "morning") {
      ranges.push({ start: "06:00", end: "12:00" });
    } else if (hour === "afternoon") {
      ranges.push({ start: "12:00", end: "18:00" });
    } else if (hour === "evening") {
      ranges.push({ start: "18:00", end: "23:59" });
    }
  }

  return ranges;
}

function findSlotInRange(
  rangeStart: string,
  rangeEnd: string,
  durationMinutes: number,
  busySlots: { start: string; end: string }[]
): { start: string; end: string } | null {
  const rangeStartMinutes = timeToMinutes(rangeStart);
  const rangeEndMinutes = timeToMinutes(rangeEnd);

  let currentStart = rangeStartMinutes;

  for (const busy of busySlots) {
    const busyStart = timeToMinutes(busy.start);
    const busyEnd = timeToMinutes(busy.end);

    if (busyEnd <= currentStart) continue;
    if (busyStart >= rangeEndMinutes) break;

    if (currentStart < busyStart) {
      const availableMinutes = Math.min(busyStart, rangeEndMinutes) - currentStart;
      if (availableMinutes >= durationMinutes) {
        return {
          start: minutesToTime(currentStart),
          end: minutesToTime(currentStart + durationMinutes),
        };
      }
    }

    currentStart = Math.max(currentStart, busyEnd);
  }

  if (rangeEndMinutes - currentStart >= durationMinutes) {
    return {
      start: minutesToTime(currentStart),
      end: minutesToTime(currentStart + durationMinutes),
    };
  }

  return null;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}
