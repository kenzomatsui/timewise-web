export type FocusPreference = "intense" | "balance" | "light";
export type AlertFrequency = "off" | "light" | "normal" | "intense";
export type AllocationStrategy = "fill_first_day" | "one_task_per_day" | "distribute_evenly";
export type ProductiveHour = "morning" | "afternoon" | "evening";

export interface UserProfile {
  userId: number;
  name: string;
  occupation?: string;
  sleepHours: string;
  productiveHours: ProductiveHour[];
  customHours?: string;
  focusPreference: FocusPreference;
  alertFrequency: AlertFrequency;
  allocationStrategy: AllocationStrategy;
  updatedAt: Date;
}

export interface ProfileRow {
  user_id: number;
  name: string;
  occupation: string | null;
  sleep_hours: string;
  productive_hours: string[];
  custom_hours: string | null;
  focus_preference: string;
  alert_frequency: string;
  allocation_strategy: string;
  updated_at: Date;
}
