import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import type { UserProfile, FocusPreference, AlertFrequency, AllocationStrategy, ProductiveHour } from "./types";

interface UpdateProfileRequest {
  name?: string;
  occupation?: string;
  sleepHours?: string;
  productiveHours?: ProductiveHour[];
  customHours?: string;
  focusPreference?: FocusPreference;
  alertFrequency?: AlertFrequency;
  allocationStrategy?: AllocationStrategy;
}

// Updates the user's profile settings.
export const update = api<UpdateProfileRequest, UserProfile>(
  { expose: true, method: "PUT", path: "/profile", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    // Get internal user_id from clerk_id
    const user = await db.queryRow<{ id: number }>`
      SELECT id FROM users WHERE clerk_id = ${auth.userID}
    `;
    
    if (!user) {
      throw APIError.notFound("user not found");
    }
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (req.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(req.name);
    }
    if (req.occupation !== undefined) {
      updates.push(`occupation = $${paramCount++}`);
      values.push(req.occupation);
    }
    if (req.sleepHours !== undefined) {
      updates.push(`sleep_hours = $${paramCount++}`);
      values.push(req.sleepHours);
    }
    if (req.productiveHours !== undefined) {
      updates.push(`productive_hours = $${paramCount++}`);
      values.push(req.productiveHours);
    }
    if (req.customHours !== undefined) {
      updates.push(`custom_hours = $${paramCount++}`);
      values.push(req.customHours);
    }
    if (req.focusPreference !== undefined) {
      updates.push(`focus_preference = $${paramCount++}`);
      values.push(req.focusPreference);
    }
    if (req.alertFrequency !== undefined) {
      updates.push(`alert_frequency = $${paramCount++}`);
      values.push(req.alertFrequency);
    }
    if (req.allocationStrategy !== undefined) {
      updates.push(`allocation_strategy = $${paramCount++}`);
      values.push(req.allocationStrategy);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("no fields to update");
    }

    updates.push(`updated_at = NOW()`);
    values.push(user.id);

    const query = `
      UPDATE user_profiles
      SET ${updates.join(", ")}
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    const profile = await db.rawQueryRow<any>(query, ...values);

    if (!profile) {
      throw APIError.notFound("profile not found");
    }

    return {
      userId: profile.user_id,
      name: profile.name,
      occupation: profile.occupation || undefined,
      sleepHours: profile.sleep_hours,
      productiveHours: profile.productive_hours,
      customHours: profile.custom_hours || undefined,
      focusPreference: profile.focus_preference,
      alertFrequency: profile.alert_frequency,
      allocationStrategy: profile.allocation_strategy,
      updatedAt: profile.updated_at,
    };
  }
);
