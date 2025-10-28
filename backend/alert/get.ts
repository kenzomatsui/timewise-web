import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import type { Alert, AlertType } from "./types";

interface GetAlertsResponse {
  alerts: Alert[];
}

// Retrieves intelligent alerts for the user based on their tasks and preferences.
export const get = api<void, GetAlertsResponse>(
  { expose: true, method: "GET", path: "/alerts", auth: true },
  async () => {
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

    if (!profile || profile.alert_frequency === "off") {
      return { alerts: [] };
    }

    const tasks = await db.queryAll<any>`
      SELECT * FROM tasks WHERE user_id = ${user.id} AND completed = false
    `;

    const alerts: Alert[] = [];

    const procrastinationThreshold = profile.alert_frequency === "intense" ? 2 : 3;
    for (const task of tasks) {
      if (task.postponements >= procrastinationThreshold) {
        alerts.push({
          type: "procrastination",
          title: "Procrastination Alert",
          message: `"${task.name}" has been postponed ${task.postponements} times`,
          taskId: task.id,
          taskName: task.name,
          severity: "warning",
        });
      }
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDays = new Date(now);
    threeDays.setDate(threeDays.getDate() + 3);

    for (const task of tasks) {
      if (!task.deadline) continue;

      const deadline = new Date(task.deadline);

      if (deadline < now) {
        alerts.push({
          type: "deadline",
          title: "Overdue Task",
          message: `"${task.name}" is overdue!`,
          taskId: task.id,
          taskName: task.name,
          severity: "critical",
        });
      } else if (deadline < tomorrow) {
        alerts.push({
          type: "deadline",
          title: "Due Tomorrow",
          message: `"${task.name}" is due tomorrow`,
          taskId: task.id,
          taskName: task.name,
          severity: "warning",
        });
      } else if (deadline < threeDays && profile.alert_frequency === "intense") {
        alerts.push({
          type: "deadline",
          title: "Upcoming Deadline",
          message: `"${task.name}" is due in ${Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days`,
          taskId: task.id,
          taskName: task.name,
          severity: "info",
        });
      }
    }

    const todayStr = now.toISOString().split("T")[0];
    const todayTasks = tasks.filter((t) => t.allocated_date === todayStr);

    const productiveHours = profile.productive_hours || [];
    let tasksInPeak = 0;
    for (const task of todayTasks) {
      if (task.allocated_start_time && isInProductiveHours(task.allocated_start_time, productiveHours)) {
        tasksInPeak++;
      }
    }

    if (todayTasks.length > 0) {
      const adherencePercent = (tasksInPeak / todayTasks.length) * 100;
      if (adherencePercent < 50 && profile.alert_frequency !== "light") {
        alerts.push({
          type: "adherence",
          title: "Low Adherence to Peak Hours",
          message: `Only ${Math.round(adherencePercent)}% of your tasks today are scheduled during your productive hours`,
          severity: "info",
        });
      }
    }

    if (profile.focus_preference === "intense" && profile.alert_frequency !== "off") {
      alerts.push({
        type: "motivation",
        title: "Focus Time",
        message: "Stay focused and crush your tasks today!",
        severity: "info",
      });
    } else if (profile.focus_preference === "balance") {
      alerts.push({
        type: "motivation",
        title: "Balanced Approach",
        message: "Take breaks when needed and maintain steady progress",
        severity: "info",
      });
    } else if (profile.focus_preference === "light") {
      alerts.push({
        type: "motivation",
        title: "Gentle Reminder",
        message: "Remember to check your tasks when you have time",
        severity: "info",
      });
    }

    return { alerts };
  }
);

function isInProductiveHours(time: string, productiveHours: string[]): boolean {
  const hour = parseInt(time.split(":")[0]);

  for (const period of productiveHours) {
    if (period === "morning" && hour >= 6 && hour < 12) return true;
    if (period === "afternoon" && hour >= 12 && hour < 18) return true;
    if (period === "evening" && hour >= 18 && hour < 24) return true;
  }

  return false;
}
