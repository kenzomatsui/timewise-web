import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface CategoryTime {
  category: string;
  totalMinutes: number;
}

interface DailyProductivity {
  date: string;
  completedTasks: number;
  totalTasks: number;
  productivityPercent: number;
}

interface ReportResponse {
  last7Days: DailyProductivity[];
  weekCategoryTime: CategoryTime[];
  stats: {
    completedTasks: number;
    pendingTasks: number;
    estimatedFreeTime: number;
    overallProductivity: number;
  };
}

// Retrieves productivity reports and analytics for the user.
export const get = api<void, ReportResponse>(
  { expose: true, method: "GET", path: "/report", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    const user = await db.queryRow<{ id: number }>`
      SELECT id FROM users WHERE clerk_id = ${auth.userID}
    `;
    
    if (!user) {
      throw APIError.notFound("user not found");
    }
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - now.getDay());

    const tasks = await db.queryAll<any>`
      SELECT * FROM tasks WHERE user_id = ${user.id}
    `;

    const last7Days: DailyProductivity[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const dayTasks = tasks.filter((t) => t.allocated_date === dateStr);
      const completedTasks = dayTasks.filter((t) => t.completed).length;
      const totalTasks = dayTasks.length;

      last7Days.push({
        date: dateStr,
        completedTasks,
        totalTasks,
        productivityPercent: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      });
    }

    const weekTasks = tasks.filter((t) => {
      if (!t.allocated_date) return false;
      const taskDate = new Date(t.allocated_date);
      return taskDate >= weekStart && taskDate <= now;
    });

    const categoryMap = new Map<string, number>();
    for (const task of weekTasks) {
      const current = categoryMap.get(task.category) || 0;
      categoryMap.set(task.category, current + task.estimated_time);
    }

    const weekCategoryTime: CategoryTime[] = Array.from(categoryMap.entries()).map(
      ([category, totalMinutes]) => ({ category, totalMinutes })
    );

    const completedTasks = tasks.filter((t) => t.completed).length;
    const pendingTasks = tasks.filter((t) => !t.completed).length;

    const totalEstimatedTime = tasks
      .filter((t) => !t.completed)
      .reduce((sum, t) => sum + t.estimated_time, 0);

    const allocatedTime = tasks
      .filter((t) => t.allocated_date && !t.completed)
      .reduce((sum, t) => sum + t.estimated_time, 0);

    const estimatedFreeTime = Math.max(0, totalEstimatedTime - allocatedTime);

    const totalTasks = tasks.length;
    const overallProductivity = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      last7Days,
      weekCategoryTime,
      stats: {
        completedTasks,
        pendingTasks,
        estimatedFreeTime,
        overallProductivity,
      },
    };
  }
);
