export type AlertType = "procrastination" | "deadline" | "adherence" | "motivation";

export interface Alert {
  type: AlertType;
  title: string;
  message: string;
  taskId?: number;
  taskName?: string;
  severity: "info" | "warning" | "critical";
}
